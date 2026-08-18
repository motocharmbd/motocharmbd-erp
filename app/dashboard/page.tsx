"use client";

import { useEffect, useState } from "react";
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
  status: string;
  product_cost?: number;
  delivery_charge?: number;
  boost_cost?: number;
  tracking_code?: string;
};

const CURRENT_MODERATOR_NAME = "Sakin";
const COMMISSION_PER_ORDER = 15;

function n(val: any): number {
  const num = Number(val);
  return Number.isFinite(num) ? num : 0;
}

function money(val: any): string {
  return `৳${n(val).toLocaleString("en-BD")}`;
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [confirmedByOrderId, setConfirmedByOrderId] = useState<Record<string, string>>({});
  const [viewingOrder, setViewingOrder] = useState<Order | null>(null);

  const [stats, setStats] = useState({
    totalOrders: 0,
    deliveredOrders: 0,
    cancelledOrders: 0,
    totalProfit: 0,
    totalCost: 0,
    totalDeliveryCharge: 0,
    totalCommission: 0,
  });

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        setLoading(true);

        // Load confirmation mapping from localStorage
        let assignments: Record<string, string> = {};
        try {
          const saved = localStorage.getItem("mcb_order_confirmed_by");
          if (saved) assignments = JSON.parse(saved);
          setConfirmedByOrderId(assignments);
        } catch (e) {
          console.error("Failed to load confirmation assignments", e);
        }

        const { data: dbOrders, error } = await supabase
          .from("orders")
          .select("*")
          .order("id", { ascending: false });

        if (error) throw error;

        if (dbOrders) {
          // Filter only orders confirmed by "Sakin"
          const sakinOrders = dbOrders.filter(
            (order) => assignments[String(order.id)] === CURRENT_MODERATOR_NAME
          );

          setOrders(sakinOrders);

          let deliveredCount = 0;
          let cancelledCount = 0;
          let profit = 0;
          let cost = 0;
          let delivery = 0;

          sakinOrders.forEach((order) => {
            const status = String(order.status || "").toLowerCase();
            if (["delivered", "partial_delivered"].includes(status)) {
              deliveredCount++;
            } else if (status === "cancelled" || status.includes("return")) {
              cancelledCount++;
            }

            const pCost = n(order.product_cost ?? order.cost ?? 0);
            const dCharge = n(order.delivery_charge ?? 0);
            const bCost = n(order.boost_cost ?? 0);
            const tAmount = n(order.total_amount ?? order.price ?? 0);

            const totalItemCost = pCost + dCharge + bCost;
            cost += totalItemCost;
            delivery += dCharge;
            profit += tAmount - totalItemCost;
          });

          // Commission calculation: ৳15 per non-cancelled order
          const validCommissionOrders = sakinOrders.filter(
            (o) => String(o.status || "").toLowerCase() !== "cancelled"
          );
          const totalCommission = validCommissionOrders.length * COMMISSION_PER_ORDER;

          setStats({
            totalOrders: sakinOrders.length,
            deliveredOrders: deliveredCount,
            cancelledOrders: cancelledCount,
            totalProfit: profit,
            totalCost: cost,
            totalDeliveryCharge: delivery,
            totalCommission: totalCommission,
          });
        }
      } catch (err) {
        console.error("Error fetching dashboard stats:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="text-lg font-semibold text-gray-600 animate-pulse">Loading Dashboard...</div>
      </div>
    );
  }

  function statusClass(status: string) {
    const s = String(status || "").toLowerCase();
    if (s === "delivered") return "bg-green-100 text-green-700";
    if (s === "cancelled") return "bg-red-100 text-red-700";
    if (s.includes("return")) return "bg-orange-100 text-orange-700";
    return "bg-blue-100 text-blue-700";
  }

  return (
    <div className="space-y-6 p-2 md:p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Moderator Dashboard ({CURRENT_MODERATOR_NAME})</h1>
          <p className="text-sm text-gray-500">Your confirmed orders and performance overview</p>
        </div>

        {/* ওপরের স্ট্যাটাস ব্যাজগুলো */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="px-3.5 py-1.5 bg-blue-100 text-blue-800 rounded-lg font-semibold text-xs shadow-sm">
            Total Orders: {stats.totalOrders}
          </div>
          <div className="px-3.5 py-1.5 bg-emerald-100 text-emerald-800 rounded-lg font-semibold text-xs shadow-sm">
            Delivered: {stats.deliveredOrders}
          </div>
          <div className="px-3.5 py-1.5 bg-rose-100 text-rose-800 rounded-lg font-semibold text-xs shadow-sm">
            Cancelled: {stats.cancelledOrders}
          </div>
          <div className="px-3.5 py-1.5 bg-teal-100 text-teal-800 rounded-lg font-semibold text-xs shadow-sm">
            Total Commission: {money(stats.totalCommission)}
          </div>
        </div>
      </div>

      {/* Main Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Confirmed Orders</p>
            <h3 className="text-3xl font-bold text-gray-800 mt-1">{stats.totalOrders}</h3>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl text-xl">📦</div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Total Profit</p>
            <h3 className="text-3xl font-bold text-emerald-600 mt-1">{money(stats.totalProfit)}</h3>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl text-xl">📈</div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Total Cost</p>
            <h3 className="text-3xl font-bold text-rose-600 mt-1">{money(stats.totalCost)}</h3>
          </div>
          <div className="p-3 bg-rose-50 text-rose-600 rounded-xl text-xl">📉</div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Delivery Charge</p>
            <h3 className="text-3xl font-bold text-amber-600 mt-1">{money(stats.totalDeliveryCharge)}</h3>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl text-xl">🚚</div>
        </div>
      </div>

      {/* Moderator Orders Detailed Table Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 overflow-hidden">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Sakin's Confirmed Order Details</h3>
        
        {orders.length === 0 ? (
          <p className="text-gray-500 text-sm py-4">No confirmed orders found for Sakin.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[1000px]">
              <thead>
                <tr className="border-b border-gray-100 text-xs font-semibold text-gray-400 uppercase tracking-wider bg-gray-50">
                  <th className="py-3 px-4">Invoice No</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Customer Name</th>
                  <th className="py-3 px-4">Phone</th>
                  <th className="py-3 px-4">Size & Qty</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-sm text-gray-700">
                {orders.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50/50 transition">
                    <td className="py-3.5 px-4 font-semibold text-blue-600">
                      MCB-{String(item.id).slice(0, 6).toUpperCase()}
                    </td>
                    <td className="py-3.5 px-4">{item.order_date || "-"}</td>
                    <td className="py-3.5 px-4 font-medium text-gray-800">{item.customer_name || "-"}</td>
                    <td className="py-3.5 px-4 whitespace-nowrap">{item.phone || "-"}</td>
                    <td className="py-3.5 px-4">{item.size || "-"} ({n(item.qty)})</td>
                    <td className="py-3.5 px-4 font-semibold text-gray-800">{money(item.total_amount)}</td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-block rounded-lg px-2.5 py-1 text-xs font-semibold ${statusClass(item.status)}`}>
                        {item.status || "Pending"}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => setViewingOrder(item)}
                        className="rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Order Details Modal */}
      {viewingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between border-b pb-3">
              <h2 className="text-xl font-bold text-gray-800">Order Information</h2>
              <button onClick={() => setViewingOrder(null)} className="text-2xl text-gray-500 hover:text-black">×</button>
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
                <div key={label} className="flex justify-between border-b border-gray-50 pb-2">
                  <span className="text-gray-500">{label}:</span>
                  <span className="font-medium text-gray-800">{value}</span>
                </div>
              ))}
            </div>
            <div className="mt-6 flex items-center justify-end border-t pt-4">
              <button
                onClick={() => setViewingOrder(null)}
                className="rounded-xl bg-gray-800 px-5 py-2 text-sm font-semibold text-white hover:bg-gray-900 transition"
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
