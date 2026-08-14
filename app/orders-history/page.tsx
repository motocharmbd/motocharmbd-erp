"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

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
  const totalCost = productCost + delivery + boost;
  return {
    ...item,
    qty: n(item?.qty),
    total_amount: totalAmount,
    advance_amount: n(item?.advance_amount),
    product_cost: productCost,
    delivery_charge: delivery,
    boost_cost: boost,
    total_cost: totalCost,
    profit: totalAmount - totalCost,
  } as Order;
}

function scoreFromFraudResponse(payload: any): number {
  const direct = payload?.score ?? payload?.data?.score ?? payload?.data?.data?.score;
  if (typeof direct === "number" && Number.isFinite(direct)) return Math.max(0, Math.min(100, Math.round(direct)));

  const root = payload?.data?.data || payload?.data || payload;
  const summary = root?.summary;
  const total = n(summary?.total_parcel);
  const success = n(summary?.success_parcel);
  if (total > 0) return Math.max(0, Math.min(100, Math.round((success / total) * 100)));
  return 0;
}

export default function OrderHistoryPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedMonth, setSelectedMonth] = useState("all");
  const [selectedDate, setSelectedDate] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDateOrders, setSelectedDateOrders] = useState<{ date: string; orders: Order[] } | null>(null);
  const [viewingOrder, setViewingOrder] = useState<Order | null>(null);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmedByOrderId, setConfirmedByOrderId] = useState<Record<string, string>>({});
  const [fraudScores, setFraudScores] = useState<Record<string, FraudScore>>({});
  const fraudCacheRef = useRef<Record<string, FraudScore>>({});
  const hasSyncedRef = useRef(false);

  useEffect(() => {
    loadAndAutoSyncOrders();
    try {
      const saved = localStorage.getItem("mcb_order_confirmed_by");
      if (saved) setConfirmedByOrderId(JSON.parse(saved));
    } catch (error) {
      console.error("Failed to load confirmation assignments", error);
    }
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const search = params.get("search");
    if (search) setSearchQuery(search);
  }, []);

  useEffect(() => {
    const phones = [...new Set(orders.map((o) => String(o.phone || "").trim()).filter(Boolean))];
    if (!phones.length) return;

    let cancelled = false;
    (async () => {
      for (const phone of phones) {
        if (cancelled || fraudCacheRef.current[phone]) continue;
        const loadingValue = { score: 0, loading: true };
        fraudCacheRef.current[phone] = loadingValue;
        setFraudScores((current) => ({ ...current, [phone]: loadingValue }));
        try {
          const res = await fetch("/api/fraud-check", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ phoneNumber: phone }),
          });
          const data = await res.json();
          const result = { score: scoreFromFraudResponse(data), loading: false };
          fraudCacheRef.current[phone] = result;
          if (!cancelled) setFraudScores((current) => ({ ...current, [phone]: result }));
        } catch (error) {
          console.error("Fraud score error for", phone, error);
          const result = { score: 0, loading: false };
          fraudCacheRef.current[phone] = result;
          if (!cancelled) setFraudScores((current) => ({ ...current, [phone]: result }));
        }
      }
    })();

    return () => { cancelled = true; };
  }, [orders]);

  async function loadAndAutoSyncOrders() {
    const { data, error } = await supabase.from("orders").select("*").order("id", { ascending: false });
    if (error) {
      alert(error.message);
      return;
    }
    const fetchedOrders = (data || []).map(withCalculatedValues);
    setOrders(fetchedOrders);
    if (!hasSyncedRef.current) {
      hasSyncedRef.current = true;
      void syncAllTrackingCodes(fetchedOrders);
    }
  }

  async function syncAllTrackingCodes(currentOrders: Order[]) {
    const updated = [...currentOrders];
    let changed = false;
    for (let i = 0; i < updated.length; i++) {
      const item = updated[i];
      if (!item.tracking_code || item.status === "Delivered" || item.status === "Cancelled") continue;
      try {
        const response = await fetch(`https://portal.packzy.com/api/v1/status_by_trackingcode/${item.tracking_code}`, {
          headers: {
            "Api-Key": "0ocu3vpovq1ymvdhtpuz0jys4uhzuga3",
            "Secret-Key": "kqx3xtby4mhsenzih2qwtci6",
            Accept: "application/json",
          },
        });
        const data = await response.json();
        if (!data?.delivery_status) continue;
        const statusLower = String(data.delivery_status).toLowerCase();
        let status = item.status;
        if (statusLower.includes("delivered")) status = "Delivered";
        else if (statusLower.includes("cancel")) status = "Cancelled";
        else if (statusLower.includes("return")) status = "Returned";
        else if (statusLower.includes("hold") || statusLower.includes("processing") || statusLower.includes("in_review")) status = "Processing";
        if (status !== item.status) {
          changed = true;
          updated[i] = withCalculatedValues({ ...item, status });
          await supabase.from("orders").update({ status }).eq("id", item.id);
        }
      } catch (error) {
        console.error("Tracking sync error", item.tracking_code, error);
      }
    }
    if (changed) setOrders(updated);
  }

  const filteredOrders = useMemo(() => orders.filter((item) => {
    const matchesDate = !selectedDate || item.order_date === selectedDate;
    const matchesMonth = selectedMonth === "all" || item.order_date?.startsWith(selectedMonth);
    const query = searchQuery.toLowerCase().trim();
    const invoiceId = `mcb-${String(item.id).slice(0, 6)}`.toLowerCase();
    const matchesSearch = !query || invoiceId.includes(query) || String(item.id).toLowerCase().includes(query) || item.customer_name?.toLowerCase().includes(query) || item.phone?.toLowerCase().includes(query) || item.tracking_code?.toLowerCase().includes(query);
    return (selectedDate ? matchesDate : matchesMonth) && matchesSearch;
  }), [orders, selectedMonth, selectedDate, searchQuery]);

  const groupedByDate = useMemo(() => {
    const grouped: Record<string, Order[]> = {};
    filteredOrders.forEach((item) => {
      const date = item.order_date || "Unknown Date";
      if (!grouped[date]) grouped[date] = [];
      grouped[date].push(item);
    });
    return grouped;
  }, [filteredOrders]);

  const dateList = Object.keys(groupedByDate).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
  const totalOrdersCount = filteredOrders.length;
  const totalSalesSum = filteredOrders.reduce((sum, item) => sum + n(item.total_amount), 0);
  const totalCostSum = filteredOrders.reduce((sum, item) => sum + n(item.product_cost) + n(item.delivery_charge) + n(item.boost_cost), 0);
  const totalProfitSum = totalSalesSum - totalCostSum;

  function setOrderConfirmedBy(orderId: number, person: string) {
    setConfirmedByOrderId((current) => {
      const next = { ...current };
      if (person) next[String(orderId)] = person;
      else delete next[String(orderId)];
      try { localStorage.setItem("mcb_order_confirmed_by", JSON.stringify(next)); } catch (error) { console.error(error); }
      return next;
    });
  }

  function confirmedCount(rows: Order[], person = "Sakin") {
    return rows.filter((row) => confirmedByOrderId[String(row.id)] === person).length;
  }

  function commissionTotal(rows: Order[], person = "Sakin") {
    return rows.filter((row) => confirmedByOrderId[String(row.id)] === person && String(row.status || "").toLowerCase() !== "cancelled").length * COMMISSION_PER_ORDER;
  }

  function updateField(field: keyof Order, value: string) {
    setEditingOrder((current) => current ? { ...current, [field]: ["qty", "total_amount", "advance_amount", "product_cost", "delivery_charge", "boost_cost"].includes(field) ? n(value) : value } : null);
  }

  async function updateOrder() {
    if (!editingOrder) return;
    setSaving(true);
    const productCost = n(editingOrder.product_cost);
    const delivery = n(editingOrder.delivery_charge);
    const boost = n(editingOrder.boost_cost);
    const totalAmount = n(editingOrder.total_amount);
    const totalCost = productCost + delivery + boost;
    const profit = totalAmount - totalCost;
    const updateData = {
      customer_name: editingOrder.customer_name,
      phone: editingOrder.phone,
      address: editingOrder.address,
      order_date: editingOrder.order_date,
      size: editingOrder.size,
      qty: n(editingOrder.qty),
      total_amount: totalAmount,
      advance_amount: n(editingOrder.advance_amount),
      product_cost: productCost,
      delivery_charge: delivery,
      boost_cost: boost,
      total_cost: totalCost,
      profit,
      status: editingOrder.status || "Pending",
      payment_status: editingOrder.payment_status || "Unpaid",
    };
    const { data, error } = await supabase.from("orders").update(updateData).eq("id", editingOrder.id).select().single();
    setSaving(false);
    if (error) { alert(error.message); return; }
    const updated = withCalculatedValues(data);
    setOrders((current) => current.map((item) => item.id === editingOrder.id ? updated : item));
    if (selectedDateOrders) setSelectedDateOrders({ ...selectedDateOrders, orders: selectedDateOrders.orders.map((o) => o.id === editingOrder.id ? updated : o) });
    setEditingOrder(null);
    setViewingOrder(updated);
    alert("Order updated successfully");
  }

  async function deleteOrder(id: number) {
    if (!window.confirm("Are you sure you want to delete this order?")) return;
    const { error } = await supabase.from("orders").delete().eq("id", id);
    if (error) { alert(error.message); return; }
    setOrders((current) => current.filter((item) => item.id !== id));
    setSelectedDateOrders((current) => current ? { ...current, orders: current.orders.filter((o) => o.id !== id) } : null);
    setViewingOrder(null);
    alert("Order deleted successfully");
  }

  async function handleAddOrUpdateTracking(item: Order, isEdit = false) {
    let trackingInput = item.tracking_code;
    if (!trackingInput || isEdit) {
      const promptInput = window.prompt("Enter Steadfast Tracking ID:", item.tracking_code || "");
      if (promptInput === null) return;
      trackingInput = promptInput.trim();
      if (!trackingInput) return;
    }
    try {
      const response = await fetch(`https://portal.packzy.com/api/v1/status_by_trackingcode/${trackingInput}`, {
        headers: {
          "Api-Key": "0ocu3vpovq1ymvdhtpuz0jys4uhzuga3",
          "Secret-Key": "kqx3xtby4mhsenzih2qwtci6",
          Accept: "application/json",
        },
      });
      const data = await response.json();
      let status = item.status || "Pending";
      const lower = String(data?.delivery_status || "").toLowerCase();
      if (lower.includes("delivered")) status = "Delivered";
      else if (lower.includes("cancel")) status = "Cancelled";
      else if (lower.includes("return")) status = "Returned";
      else if (lower.includes("hold") || lower.includes("processing") || lower.includes("in_review")) status = "Processing";
      const { error } = await supabase.from("orders").update({ tracking_code: trackingInput, status }).eq("id", item.id);
      if (error) { alert("Failed to update database: " + error.message); return; }
      const updated = withCalculatedValues({ ...item, tracking_code: trackingInput, status });
      setOrders((current) => current.map((o) => o.id === item.id ? updated : o));
      setSelectedDateOrders((current) => current ? { ...current, orders: current.orders.map((o) => o.id === item.id ? updated : o) } : null);
      alert(`Success! Status from Steadfast: ${data?.delivery_status || status}`);
    } catch (error: any) {
      alert("API Error: " + error.message);
    }
  }

  function downloadInvoice(order: Order) {
    const doc = new jsPDF();
    const totalAmount = n(order.total_amount);
    const advanceAmount = n(order.advance_amount);
    const deliveryCharge = n(order.delivery_charge);
    const dueAmount = totalAmount + deliveryCharge - advanceAmount;
    doc.setFont("helvetica", "bold"); doc.setFontSize(20); doc.text("Moto Charm BD", 14, 20);
    doc.setFont("helvetica", "normal"); doc.setFontSize(10); doc.text("Phone: 01519601483", 14, 26); doc.text("Address: Dhaka, Bangladesh", 14, 32);
    doc.setFont("helvetica", "bold"); doc.setFontSize(22); doc.text("INVOICE", 196, 20, { align: "right" });
    doc.setFont("helvetica", "normal"); doc.setFontSize(10); doc.text(`Invoice No: MCB-${String(order.id).slice(0, 6).toUpperCase()}`, 196, 26, { align: "right" }); doc.text(`Date: ${order.order_date || "-"}`, 196, 32, { align: "right" });
    doc.line(14, 42, 196, 42); doc.setFont("helvetica", "bold"); doc.setFontSize(11); doc.text("Billed To:", 14, 50);
    doc.setFont("helvetica", "normal"); doc.setFontSize(10); doc.text(`Name: ${order.customer_name || "-"}`, 14, 56); doc.text(`Phone: ${order.phone || "-"}`, 14, 62); doc.text(`Address: ${order.address || "-"}`, 14, 68);
    const qty = n(order.qty) || 1;
    autoTable(doc, { startY: 75, head: [["Item Description", "Size", "Qty", "Unit Price", "Total"]], body: [["Moto Charm Accessory / Product", order.size || "-", qty, `TK ${(totalAmount / qty).toFixed(2)}`, `TK ${totalAmount.toFixed(2)}`]], theme: "striped" });
    const y = (doc as any).lastAutoTable.finalY + 10;
    doc.text("Subtotal:", 120, y); doc.text(`TK ${totalAmount.toFixed(2)}`, 196, y, { align: "right" });
    doc.text("Delivery Charge:", 120, y + 6); doc.text(`TK ${deliveryCharge.toFixed(2)}`, 196, y + 6, { align: "right" });
    doc.text("Advanced Paid:", 120, y + 12); doc.text(`-TK ${advanceAmount.toFixed(2)}`, 196, y + 12, { align: "right" });
    doc.line(120, y + 16, 196, y + 16); doc.setFont("helvetica", "bold"); doc.text("Due Amount:", 120, y + 22); doc.text(`TK ${dueAmount.toFixed(2)}`, 196, y + 22, { align: "right" });
    doc.save(`Invoice_MCB_${String(order.id).slice(0, 6)}.pdf`);
  }

  function exportDateOrders(rows: Order[], date: string) {
    const header = ["Invoice No", "Date", "Customer", "Phone", "Address", "Size", "Qty", "Amount", "Advanced", "Product Cost", "Delivery", "Boost", "Total Cost", "Profit", "Status", "Confirmed By", "Tracking", "Fraud Score"];
    const csvRows = rows.map((item) => {
      const calculated = withCalculatedValues(item);
      const score = fraudScores[String(item.phone || "")]?.score ?? "";
      return [
        `MCB-${String(item.id).slice(0, 6).toUpperCase()}`, item.order_date, item.customer_name, item.phone, item.address, item.size, n(item.qty), n(item.total_amount), n(item.advance_amount), n(item.product_cost), n(item.delivery_charge), n(item.boost_cost), calculated.total_cost, calculated.profit, item.status, confirmedByOrderId[String(item.id)] || "", item.tracking_code || "", score === "" ? "" : `${score}%`
      ].map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`).join(",");
    });
    const csv = [header.join(","), ...csvRows].join("\r\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `MotoCharmBD_Orders_${date}.csv`; a.click(); URL.revokeObjectURL(url);
  }

  function statusClass(status: string) {
    if (status === "Delivered") return "bg-green-100 text-green-700";
    if (status === "Processing") return "bg-blue-100 text-blue-700";
    if (status === "Cancelled") return "bg-red-100 text-red-700";
    if (status === "Returned") return "bg-orange-100 text-orange-700";
    return "bg-yellow-100 text-yellow-700";
  }

  function OrderTable({ rows }: { rows: Order[] }) {
    const sakinOrders = confirmedCount(rows);
    const sakinCommission = commissionTotal(rows);
    return <>
      <table className="w-full min-w-[2050px]">
        <thead className="bg-gray-100"><tr>
          {['Invoice No','Date','Customer','Phone','Address','Size','Qty','Amount','Advanced','Product Cost','Delivery','Boost','Total Cost','Profit','Status','Order Confirmed By','Steadfast Courier','Fraud Score','Action'].map((h) => <th key={h} className="p-3 text-left">{h}</th>)}
        </tr></thead>
        <tbody>{rows.length === 0 ? <tr><td colSpan={19} className="p-6 text-center text-gray-500">No matching orders found.</td></tr> : rows.map((item) => {
          const calculated = withCalculatedValues(item);
          const phoneKey = String(item.phone || "").trim();
          const fraud = fraudScores[phoneKey];
          return <tr key={item.id} className="border-b hover:bg-gray-50">
            <td className="p-3 font-semibold text-blue-600">MCB-{String(item.id).slice(0, 6).toUpperCase()}</td>
            <td className="p-3">{item.order_date || "-"}</td>
            <td className="p-3">{item.customer_name || "-"}</td>
            <td className="p-3 whitespace-nowrap">{item.phone || "-"}</td>
            <td className="p-3">{item.address || "-"}</td>
            <td className="p-3">{item.size || "-"}</td>
            <td className="p-3">{n(item.qty)}</td>
            <td className="p-3">{money(calculated.total_amount)}</td>
            <td className="p-3 font-semibold text-green-600">{money(calculated.advance_amount)}</td>
            <td className="p-3">{money(calculated.product_cost)}</td>
            <td className="p-3">{money(calculated.delivery_charge)}</td>
            <td className="p-3">{money(calculated.boost_cost)}</td>
            <td className="p-3 font-semibold text-red-600">{money(calculated.total_cost)}</td>
            <td className="p-3 font-semibold text-green-600">{money(calculated.profit)}</td>
            <td className="p-3"><span className={`inline-block rounded-lg px-3 py-1.5 font-semibold ${statusClass(item.status || "Pending")}`}>{item.status || "Pending"}</span></td>
            <td className="p-3"><select value={confirmedByOrderId[String(item.id)] || ""} onChange={(e) => setOrderConfirmedBy(item.id, e.target.value)} className="min-w-[135px] rounded-lg border bg-white px-2.5 py-1.5 text-xs font-semibold"><option value="">Select Name</option><option value="Sakin">Sakin</option></select></td>
            <td className="p-3">{item.tracking_code ? <div className="flex items-center gap-2"><span className="rounded bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-700">{item.tracking_code}</span><button onClick={() => handleAddOrUpdateTracking(item, true)} className="text-[10px] text-blue-500 hover:underline">Edit</button></div> : <button onClick={() => handleAddOrUpdateTracking(item)} className="rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-600">+ Add Tracking</button>}</td>
            <td className="p-3">{fraud?.loading ? <span className="text-xs text-gray-400">Checking...</span> : <span className={`inline-flex rounded-lg px-2.5 py-1 text-xs font-bold ${fraud?.score >= 70 ? 'bg-green-100 text-green-700' : fraud?.score >= 40 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>{fraud ? `${fraud.score}%` : "—"}</span>}</td>
            <td className="p-3 text-center"><button onClick={() => setViewingOrder(calculated)} className="rounded-lg bg-gray-100 p-2 text-gray-700 hover:bg-blue-50 hover:text-blue-600" title="View Details">◉</button></td>
          </tr>;
        })}</tbody>
      </table>
      <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl border bg-gray-50 p-4">
        <span className="text-sm font-bold text-gray-700">Order Confirmed:</span>
        <span className="rounded-lg bg-blue-100 px-4 py-2 text-sm font-bold text-blue-700">Sakin Total Orders: {sakinOrders}</span>
        <span className="rounded-lg bg-emerald-100 px-4 py-2 text-sm font-bold text-emerald-700">Sakin Commission: {money(sakinCommission)}</span>
        {rows.length > 0 && <button onClick={() => exportDateOrders(rows, rows[0]?.order_date || 'orders')} className="ml-auto rounded-lg bg-green-600 px-4 py-2 text-sm font-bold text-white hover:bg-green-700">Export Excel</button>}
      </div>
    </>;
  }

  return <div className="p-6">
    <div className="mb-6"><h1 className="text-3xl font-bold">Order History</h1><p className="mt-2 text-gray-500">View and manage orders grouped by date.</p></div>
    <div className="mb-6 flex flex-wrap items-center gap-3">
      <select value={selectedMonth} onChange={(e) => { setSelectedMonth(e.target.value); setSelectedDate(""); }} className="rounded-lg border bg-white p-3 font-medium"><option value="all">All Months</option>{Array.from({ length: 12 }, (_, i) => { const month = String(i + 1).padStart(2, '0'); return <option key={month} value={`2026-${month}`}>{new Date(2026, i, 1).toLocaleString('en-US', { month: 'long' })} 2026</option>; })}</select>
      <div className="flex items-center gap-2 rounded-lg border bg-white p-2"><span className="pl-1 text-xs font-semibold text-gray-500">Date:</span><input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="bg-transparent text-sm font-medium outline-none" />{selectedDate && <button onClick={() => setSelectedDate("")} className="px-1 text-xs font-bold text-red-500">✕</button>}</div>
      <input type="text" placeholder="Search by Invoice, name, phone, tracking..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-80 rounded-lg border bg-white p-3 font-medium" />
    </div>
    <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
      <div className="rounded-2xl bg-blue-600 p-6 text-white shadow"><p className="text-sm opacity-90">Total Orders</p><h3 className="mt-2 text-3xl font-bold">{totalOrdersCount}</h3></div>
      <div className="rounded-2xl bg-purple-600 p-6 text-white shadow"><p className="text-sm opacity-90">Total Sales</p><h3 className="mt-2 text-3xl font-bold">{money(totalSalesSum)}</h3></div>
      <div className="rounded-2xl bg-red-600 p-6 text-white shadow"><p className="text-sm opacity-90">Total Cost</p><h3 className="mt-2 text-3xl font-bold">{money(totalCostSum)}</h3></div>
      <div className="rounded-2xl bg-emerald-600 p-6 text-white shadow"><p className="text-sm opacity-90">Total Profit</p><h3 className="mt-2 text-3xl font-bold">{money(totalProfitSum)}</h3></div>
    </div>
    <div className="overflow-x-auto rounded-xl bg-white shadow">
      {searchQuery.trim() || selectedDate ? <OrderTable rows={filteredOrders} /> : <table className="w-full"><thead className="bg-gray-100"><tr><th className="p-4 text-left">Date</th><th className="p-4 text-left">Total</th><th className="p-4 text-right">Action</th></tr></thead><tbody>{dateList.length === 0 ? <tr><td colSpan={3} className="p-6 text-center text-gray-500">No orders found.</td></tr> : dateList.map((date) => <tr key={date} className="border-b hover:bg-gray-50"><td className="p-4 font-medium">{date}</td><td className="p-4 text-gray-600">{groupedByDate[date].length}</td><td className="p-4 text-right"><button onClick={() => setSelectedDateOrders({ date, orders: groupedByDate[date] })} className="font-semibold text-teal-600 hover:underline">View</button></td></tr>)}</tbody></table>}
    </div>

    {selectedDateOrders && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"><div className="max-h-[90vh] w-full max-w-[95vw] overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl"><div className="mb-4 flex items-center justify-between border-b pb-3"><h2 className="text-xl font-bold">Orders Details on {selectedDateOrders.date}</h2><button onClick={() => setSelectedDateOrders(null)} className="text-2xl font-bold text-gray-500">×</button></div><OrderTable rows={selectedDateOrders.orders} /><div className="mt-6 flex justify-end"><button onClick={() => setSelectedDateOrders(null)} className="rounded-lg border bg-gray-100 px-5 py-2">Close</button></div></div></div>}

    {viewingOrder && !editingOrder && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"><div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl"><div className="mb-4 flex items-center justify-between border-b pb-3"><h2 className="text-xl font-bold">Order Details</h2><button onClick={() => setViewingOrder(null)} className="text-2xl text-gray-500">×</button></div><div className="space-y-3 text-sm">
      {[['Invoice No', `MCB-${String(viewingOrder.id).slice(0,6).toUpperCase()}`], ['Date', viewingOrder.order_date], ['Customer Name', viewingOrder.customer_name], ['Phone', viewingOrder.phone], ['Address', viewingOrder.address], ['Size & Qty', `${viewingOrder.size} (${n(viewingOrder.qty)})`], ['Total Amount', money(viewingOrder.total_amount)], ['Advanced Paid', money(viewingOrder.advance_amount)], ['Product Cost', money(viewingOrder.product_cost)], ['Delivery Charge', money(viewingOrder.delivery_charge)], ['Boost Cost', money(viewingOrder.boost_cost)], ['Total Cost', money(n(viewingOrder.product_cost)+n(viewingOrder.delivery_charge)+n(viewingOrder.boost_cost))], ['Profit', money(n(viewingOrder.total_amount)-n(viewingOrder.product_cost)-n(viewingOrder.delivery_charge)-n(viewingOrder.boost_cost))], ['Status', viewingOrder.status]].map(([label,value]) => <div key={label} className="flex justify-between border-b pb-2"><span className="text-gray-500">{label}:</span><span className="font-medium">{value}</span></div>)}
      </div><div className="mt-6 flex items-center justify-between border-t pt-4"><button onClick={() => downloadInvoice(viewingOrder)} className="rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white">Download Invoice PDF</button><div className="flex gap-2"><button onClick={() => deleteOrder(viewingOrder.id)} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white">Delete</button><button onClick={() => setEditingOrder({ ...viewingOrder })} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white">Edit</button></div></div></div></div>}

    {editingOrder && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"><div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl"><div className="mb-6 flex items-center justify-between"><h2 className="text-2xl font-bold">Edit Order</h2><button onClick={() => setEditingOrder(null)} className="text-3xl text-gray-500">×</button></div><div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <div><label className="mb-1 block text-sm font-semibold">Customer Name</label><input value={editingOrder.customer_name || ''} onChange={(e) => updateField('customer_name',e.target.value)} className="w-full rounded-lg border p-3" /></div>
      <div><label className="mb-1 block text-sm font-semibold">Phone</label><input value={editingOrder.phone || ''} onChange={(e) => updateField('phone',e.target.value)} className="w-full rounded-lg border p-3" /></div>
      <div className="md:col-span-2"><label className="mb-1 block text-sm font-semibold">Address</label><input value={editingOrder.address || ''} onChange={(e) => updateField('address',e.target.value)} className="w-full rounded-lg border p-3" /></div>
      <div><label className="mb-1 block text-sm font-semibold">Order Date</label><input type="date" value={editingOrder.order_date || ''} onChange={(e) => updateField('order_date',e.target.value)} className="w-full rounded-lg border p-3" /></div>
      <div><label className="mb-1 block text-sm font-semibold">Size</label><input value={editingOrder.size || ''} onChange={(e) => updateField('size',e.target.value)} className="w-full rounded-lg border p-3" /></div>
      {[['qty','Quantity'],['total_amount','Total Amount (৳)'],['advance_amount','Advanced Paid (৳)'],['product_cost','Product Cost (৳)'],['delivery_charge','Delivery Charge (৳)'],['boost_cost','Boost Cost (৳)']].map(([field,label]) => <div key={field}><label className="mb-1 block text-sm font-semibold">{label}</label><input type="number" value={n((editingOrder as any)[field])} onChange={(e) => updateField(field as keyof Order,e.target.value)} className="w-full rounded-lg border p-3" /></div>)}
      <div><label className="mb-1 block text-sm font-semibold">Status</label><select value={editingOrder.status || 'Pending'} onChange={(e) => updateField('status',e.target.value)} className="w-full rounded-lg border bg-white p-3"><option>Pending</option><option>Processing</option><option>Delivered</option><option>Cancelled</option><option>Returned</option></select></div>
      </div><div className="mt-6 rounded-xl bg-gray-50 p-4"><div className="grid grid-cols-2 gap-3"><div><span className="text-sm text-gray-500">Calculated Total Cost</span><p className="text-xl font-bold text-red-600">{money(n(editingOrder.product_cost)+n(editingOrder.delivery_charge)+n(editingOrder.boost_cost))}</p></div><div><span className="text-sm text-gray-500">Calculated Profit</span><p className="text-xl font-bold text-green-600">{money(n(editingOrder.total_amount)-n(editingOrder.product_cost)-n(editingOrder.delivery_charge)-n(editingOrder.boost_cost))}</p></div></div></div><div className="mt-6 flex justify-end gap-3"><button onClick={() => setEditingOrder(null)} className="rounded-lg border bg-gray-100 px-5 py-3">Cancel</button><button onClick={updateOrder} disabled={saving} className="rounded-lg bg-green-600 px-5 py-3 font-semibold text-white disabled:opacity-50">{saving ? 'Saving ...' : 'Save Changes'}</button></div></div></div>}
  </div>;
}
