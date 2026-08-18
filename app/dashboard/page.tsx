"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";

type Order = {
  id: number;
  order_date: string;
  customer_name: string;
  phone: string;
  address: string;
  size: string;
  qty: number;
  total_amount: number;
  advance_amount: number;
  product_cost: number;
  delivery_charge: number;
  boost_cost: number;
  total_cost: number;
  profit: number;
  status: string;
  payment_status: string;
  tracking_code?: string;
};

type FraudScore = { score: number; loading?: boolean };

const COMMISSION_PER_ORDER = 15;
const CURRENT_MODERATOR_NAME = "Sakin";

function n(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function money(value: unknown) {
  return `৳${n(value).toLocaleString("en-BD")}`;
}

function withCalculatedValues(item: any): Order {
  const productCost = n(item?.product_cost);
  const delivery = n(item?.delivery_charge);
  const boost = n(item?.boost_cost);
  const totalAmount = n(item?.total_amount);
  return {
    ...item,
    qty: n(item?.qty),
    total_amount: totalAmount,
    advance_amount: n(item?.advance_amount),
    product_cost: productCost,
    delivery_charge: delivery,
    boost_cost: boost,
    total_cost: productCost + delivery + boost,
    profit: totalAmount - productCost - delivery - boost,
  } as Order;
}

function mapSteadfastStatus(value: unknown): string {
  const status = String(value || "").trim().toLowerCase();
  if (["delivered", "partial_delivered"].includes(status)) return "Delivered";
  if (status === "cancelled") return "Cancelled";
  if (status.includes("return")) return "Returned";
  if (
    [
      "pending",
      "delivered_approval_pending",
      "partial_delivered_approval_pending",
      "cancelled_approval_pending",
      "unknown_approval_pending",
      "hold",
      "in_review",
      "unknown",
    ].includes(status)
  )
    return "Processing";
  return "";
}

function scoreFromFraudResponse(payload: any): number {
  const direct =
    payload?.score ??
    payload?.success_ratio ??
    payload?.data?.score ??
    payload?.data?.success_ratio ??
    payload?.data?.data?.score ??
    payload?.data?.data?.success_ratio;
  const numericDirect = Number(direct);
  if (Number.isFinite(numericDirect))
    return Math.max(0, Math.min(100, Math.round(numericDirect)));
  const root = payload?.data?.data || payload?.data || payload;
  const summary = root?.summary;
  const total = n(summary?.total_parcel);
  const success = n(summary?.success_parcel);
  return total > 0 ? Math.max(0, Math.min(100, Math.round((success / total) * 100))) : 0;
}

export default function DashboardPage() {
  const [mounted, setMounted] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedMonth, setSelectedMonth] = useState("all");
  const [selectedDate, setSelectedDate] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDateOrders, setSelectedDateOrders] = useState<{ date: string; orders: Order[] } | null>(null);
  const [viewingOrder, setViewingOrder] = useState<Order | null>(null);
  const [confirmedByOrderId, setConfirmedByOrderId] = useState<Record<string, string>>({});
  const [fraudScores, setFraudScores] = useState<Record<string, FraudScore>>({});
  
  const fraudCacheRef = useRef<Record<string, FraudScore>>({});
  const hasSyncedRef = useRef(false);

  // প্রিভেন্ট হাইড্রেশন এরর
  useEffect(() => {
    setMounted(true);
    try {
      const saved = localStorage.getItem("mcb_order_confirmed_by");
      if (saved) setConfirmedByOrderId(JSON.parse(saved));
    } catch (error) {
      console.error("Failed to load confirmation assignments", error);
    }
    loadAndAutoSyncOrders();
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const phones = [...new Set(orders.map((o) => String(o.phone || "").trim()).filter(Boolean))];
    if (!phones.length) return;
    let cancelled = false;
    (async () => {
      for (const phone of phones) {
        if (cancelled || fraudCacheRef.current[phone]) continue;
        const loadingValue = { score: 0, loading: true };
        fraudCacheRef.current[phone] = loadingValue;
        setFraudScores((c) => ({ ...c, [phone]: loadingValue }));
        try {
          const res = await fetch("/api/fraud-check", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ phoneNumber: phone }),
            cache: "no-store",
          });
          const payload = await res.json();
          const result = { score: scoreFromFraudResponse(payload), loading: false };
          fraudCacheRef.current[phone] = result;
          if (!cancelled) setFraudScores((c) => ({ ...c, [phone]: result }));
        } catch (error) {
          console.error("Fraud score error", error);
          const result = { score: 0, loading: false };
          fraudCacheRef.current[phone] = result;
          if (!cancelled) setFraudScores((c) => ({ ...c, [phone]: result }));
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [orders, mounted]);

  async function loadAndAutoSyncOrders() {
    try {
      const { data, error } = await supabase.from("orders").select("*").order("id", { ascending: false });
      if (error) {
        console.error("Supabase error:", error.message);
        return;
      }
      const fetched = (data || []).map(withCalculatedValues);
      setOrders(fetched);
      if (!hasSyncedRef.current) {
        hasSyncedRef.current = true;
        void autoFetchMissingTrackingCodes(fetched);
      }
    } catch (err) {
      console.error("Load orders error:", err);
    }
  }

  async function autoFetchMissingTrackingCodes(currentOrders: Order[]) {
    const updated = [...currentOrders];
    let changed = false;
    for (let i = 0; i < updated.length; i++) {
      const item = updated[i];
      if (!item.tracking_code) {
        try {
          const res = await fetch("/api/steadfast/create-order", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ orderId: item.id }),
          });
          const steadfastData = await res.json();
          if (steadfastData.success && steadfastData.tracking_code) {
            const trackingInput = steadfastData.tracking_code;
            const { error: dbError } = await supabase
              .from("orders")
              .update({ tracking_code: trackingInput, status: "Processing" })
              .eq("id", item.id);
            if (!dbError) {
              changed = true;
              updated[i] = withCalculatedValues({ ...item, tracking_code: trackingInput, status: "Processing" });
            }
          }
        } catch (err) {
          console.error("Auto tracking fetch error for order", item.id, err);
        }
      } else {
        try {
          const response = await fetch(`/api/steadfast?tracking_code=${encodeURIComponent(item.tracking_code)}`, {
            cache: "no-store",
          });
          const data = await response.json();
          if (!response.ok || !data?.delivery_status) continue;
          const nextStatus = mapSteadfastStatus(data.delivery_status);
          if (!nextStatus || nextStatus === item.status) continue;
          changed = true;
          updated[i] = withCalculatedValues({ ...item, status: nextStatus });
          await supabase.from("orders").update({ status: nextStatus }).eq("id", item.id);
        } catch (error) {
          console.error("Tracking sync error", item.tracking_code, error);
        }
      }
    }
    if (changed) setOrders(updated);
  }

  const baseFilteredOrders = useMemo(() => {
    return orders.filter((item) => {
      // যদি confirmation সিস্টেম চেক অফ রাখতে চান বা সব দেখতে চান, তবে নিচের কন্ডিশন ফ্লেক্সিবল রাখতে পারেন। 
      // আপাতত আপনার দেওয়া লজিক অনুযায়ী রাখা হলো:
      const isSakinOrder = confirmedByOrderId[String(item.id)] === CURRENT_MODERATOR_NAME;
      // যদি কোনো অর্ডার কনফার্মড বাই সেভ করা না থাকে কিন্তু আপনি দেখতে চান, তবে || !confirmedByOrderId[...] দিতে পারেন।
      // নিরাপত্তার জন্য আপাতত সব অর্ডার দেখানোর ব্যবস্থা রাখছি যদি ফিল্টার খালি থাকে:
      const hasAnyConfirmation = Object.keys(confirmedByOrderId).length > 0;
      if (hasAnyConfirmation && !isSakinOrder) return false;

      const matchesDate = !selectedDate || item.order_date === selectedDate;
      const matchesMonth = selectedMonth === "all" || item.order_date?.startsWith(selectedMonth);
      const query = searchQuery.toLowerCase().trim();
      const invoiceId = `mcb-${String(item.id).slice(0, 6)}`.toLowerCase();
      const matchesSearch =
        !query ||
        invoiceId.includes(query) ||
        String(item.id).toLowerCase().includes(query) ||
        item.customer_name?.toLowerCase().includes(query) ||
        item.phone?.toLowerCase().includes(query) ||
        item.tracking_code?.toLowerCase().includes(query);

      return (selectedDate ? matchesDate : matchesMonth) && matchesSearch;
    });
  }, [orders, selectedMonth, selectedDate, searchQuery, confirmedByOrderId]);

  const groupedByDate = useMemo(() => {
    const grouped: Record<string, Order[]> = {};
    baseFilteredOrders.forEach((item) => {
      const date = item.order_date || "Unknown Date";
      if (!grouped[date]) grouped[date] = [];
      grouped[date].push(item);
    });
    return grouped;
  }, [baseFilteredOrders]);

  const dateList = Object.keys(groupedByDate).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  if (!mounted) return <div className="p-6 text-gray-500">Loading Dashboard...</div>;

  function totalOrdersRowsCount(rows: Order[]) {
    return rows.length;
  }
  function deliveredRowsCount(rows: Order[]) {
    return rows.filter((row) => String(row.status || "").toLowerCase() === "delivered").length;
  }
  function cancelledRowsCount(rows: Order[]) {
    return rows.filter((row) => String(row.status || "").toLowerCase() === "cancelled").length;
  }
  function totalCommissionAmount(rows: Order[]) {
    return rows.filter((row) => String(row.status || "").toLowerCase() !== "cancelled").length * COMMISSION_PER_ORDER;
  }

  function statusClass(status: string) {
    if (status === "Delivered") return "bg-green-100 text-green-700";
    if (status === "Processing") return "bg-blue-100 text-blue-700";
    if (status === "Cancelled") return "bg-red-100 text-red-700";
    if (status === "Returned") return "bg-orange-100 text-orange-700";
    return "bg-yellow-100 text-yellow-700";
  }

  function StatsSummary({ rows }: { rows: Order[] }) {
    const count = totalOrdersRowsCount(rows);
    const delivered = deliveredRowsCount(rows);
    const cancelled = cancelledRowsCount(rows);
    const commission = totalCommissionAmount(rows);
    return (
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-lg bg-blue-100 px-3 py-2 text-sm font-bold text-blue-700">Total Orders: {count}</span>
        <span className="rounded-lg bg-green-100 px-3 py-2 text-sm font-bold text-green-700">Delivered: {delivered}</span>
        <span className="rounded-lg bg-red-100 px-3 py-2 text-sm font-bold text-red-700">Cancelled: {cancelled}</span>
        <span className="rounded-lg bg-emerald-100 px-3 py-2 text-sm font-bold text-emerald-700">
          Total Commission: {money(commission)}
        </span>
      </div>
    );
  }

  function OrderTable({ rows }: { rows: Order[] }) {
    return (
      <>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1500px]">
            <thead className="bg-gray-100">
              <tr>
                {["Invoice No", "Date", "Customer", "Phone", "Address", "Size", "Qty", "Amount", "Advanced", "Status", "Order Confirmed By", "Steadfast Courier", "Fraud Score", "Action"].map(
                  (h) => (
                    <th key={h} className="p-3 text-left">
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={14} className="p-6 text-center text-gray-500">
                    No matching orders found.
                  </td>
                </tr>
              ) : (
                rows.map((item) => {
                  const calculated = withCalculatedValues(item);
                  const phoneKey = String(item.phone || "").trim();
                  const fraud = fraudScores[phoneKey];
                  return (
                    <tr key={item.id} className="border-b hover:bg-gray-50">
                      <td className="p-3 font-semibold text-blue-600">
                        MCB-{String(item.id).slice(0, 6).toUpperCase()}
                      </td>
                      <td className="p-3">{item.order_date || "-"}</td>
                      <td className="p-3">{item.customer_name || "-"}</td>
                      <td className="p-3 whitespace-nowrap">{item.phone || "-"}</td>
                      <td className="p-3">{item.address || "-"}</td>
                      <td className="p-3">{item.size || "-"}</td>
                      <td className="p-3">{n(item.qty)}</td>
                      <td className="p-3">{money(calculated.total_amount)}</td>
                      <td className="p-3 font-semibold text-green-600">{money(calculated.advance_amount)}</td>
                      <td className="p-3">
                        <span className={`inline-block rounded-lg px-3 py-1.5 font-semibold ${statusClass(item.status || "Pending")}`}>
                          {item.status || "Pending"}
                        </span>
                      </td>
                      <td className="p-3 font-medium">{confirmedByOrderId[String(item.id)] || CURRENT_MODERATOR_NAME}</td>
                      <td className="p-3">
                        {item.tracking_code ? (
                          <span className="rounded bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-700">
                            {item.tracking_code}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">Syncing...</span>
                        )}
                      </td>
                      <td className="p-3">
                        {fraud?.loading ? (
                          <span className="text-xs text-gray-400">Checking...</span>
                        ) : (
                          <span
                            className={`inline-flex rounded-lg px-2.5 py-1 text-xs font-bold ${
                              fraud?.score >= 70
                                ? "bg-green-100 text-green-700"
                                : fraud?.score >= 40
                                ? "bg-yellow-100 text-yellow-700"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            {fraud ? `${fraud.score}%` : "—"}
                          </span>
                        )}
                      </td>
                      <td className="p-3">
                        <button
                          onClick={() => setViewingOrder(calculated)}
                          className="rounded-lg bg-gray-100 p-2 text-gray-700 hover:bg-blue-50 hover:text-blue-600"
                          title="View Details"
                        >
                          ◉
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl border bg-gray-50 p-4">
          <StatsSummary rows={rows} />
        </div>
      </>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Dashboard & Order History ({CURRENT_MODERATOR_NAME})</h1>
          <p className="mt-2 text-gray-500">Welcome to your dashboard. View and manage your confirmed orders grouped by date.</p>
        </div>
        <StatsSummary rows={baseFilteredOrders} />
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <select
          value={selectedMonth}
          onChange={(e) => {
            setSelectedMonth(e.target.value);
            setSelectedDate("");
          }}
          className="rounded-lg border bg-white p-3 font-medium"
        >
          <option value="all">All Months</option>
          {Array.from({ length: 12 }, (_, i) => {
            const month = String(i + 1).padStart(2, "0");
            return (
              <option key={month} value={`2026-${month}`}>
                {new Date(2026, i, 1).toLocaleString("en-US", { month: "long" })} 2026
              </option>
            );
          })}
        </select>
        <div className="flex items-center gap-2 rounded-lg border bg-white p-2">
          <span className="pl-1 text-xs font-semibold text-gray-500">Date:</span>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="bg-transparent text-sm font-medium outline-none"
          />
          {selectedDate && (
            <button onClick={() => setSelectedDate("")} className="px-1 text-xs font-bold text-red-500">
              ✕
            </button>
          )}
        </div>
        <input
          type="text"
          placeholder="Search by Invoice, name, phone, tracking..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-80 rounded-lg border bg-white p-3 font-medium"
        />
      </div>

      <div className="overflow-x-auto rounded-xl bg-white shadow">
        {searchQuery.trim() || selectedDate ? (
          <OrderTable rows={baseFilteredOrders} />
        ) : (
          <table className="w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-4 text-left">Date</th>
                <th className="p-4 text-left">Total</th>
                <th className="p-4 text-left">Total Orders</th>
                <th className="p-4 text-left">Total Commission</th>
                <th className="p-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {dateList.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-gray-500">
                    No orders found.
                  </td>
                </tr>
              ) : (
                dateList.map((date) => {
                  const rows = groupedByDate[date];
                  return (
                    <tr key={date} className="border-b hover:bg-gray-50">
                      <td className="p-4 font-medium">{date}</td>
                      <td className="p-4 text-gray-600">{rows.length}</td>
                      <td className="p-4 font-bold text-blue-700">{totalOrdersRowsCount(rows)}</td>
                      <td className="p-4 font-bold text-emerald-700">{money(totalCommissionAmount(rows))}</td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => setSelectedDateOrders({ date, orders: rows })}
                          className="font-semibold text-teal-600 hover:underline"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        )}
      </div>

      {selectedDateOrders && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-[95vw] overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between border-b pb-3">
              <div>
                <h2 className="text-xl font-bold">Orders Details on {selectedDateOrders.date}</h2>
                <div className="mt-2">
                  <StatsSummary rows={selectedDateOrders.orders} />
                </div>
              </div>
              <button onClick={() => setSelectedDateOrders(null)} className="text-2xl font-bold text-gray-500">
                ×
              </button>
            </div>
            <OrderTable rows={selectedDateOrders.orders} />
            <div className="mt-6 flex justify-end">
              <button onClick={() => setSelectedDateOrders(null)} className="rounded-lg border bg-gray-100 px-5 py-2">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {viewingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between border-b pb-3">
              <h2 className="text-xl font-bold">Order Details</h2>
              <button onClick={() => setViewingOrder(null)} className="text-2xl text-gray-500">
                ×
              </button>
            </div>
            <div className="space-y-3 text-sm">
              {[
                ["Invoice No", `MCB-${String(viewingOrder.id).slice(0, 6).toUpperCase()}`],
                ["Date", viewingOrder.order_date],
                ["Customer Name", viewingOrder.customer_name],
                ["Phone", viewingOrder.phone],
                ["Address", viewingOrder.address],
                ["Size & Qty", `${viewingOrder.size} (${n(viewingOrder.qty)})`],
                ["Total Amount", money(viewingOrder.total_amount)],
                ["Advanced Paid", money(viewingOrder.advance_amount)],
                ["Status", viewingOrder.status],
                ["Tracking Code", viewingOrder.tracking_code || "N/A"],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between border-b pb-2">
                  <span className="text-gray-500">{label}:</span>
                  <span className="font-medium">{value}</span>
                </div>
              ))}
            </div>
            <div className="mt-6 flex items-center justify-end border-t pt-4">
              <button
                onClick={() => setViewingOrder(null)}
                className="rounded-lg bg-gray-800 px-4 py-2 text-sm font-semibold text-white"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
