"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from "recharts";
import Link from "next/link";

type Order = {
  id: string | number;
  order_date: string;
  total_amount: number;
  product_cost?: number;
  delivery_charge?: number;
  boost_cost?: number;
  customer_name?: string;
  phone?: string;
  status?: string;
  tracking_code?: string;
};

const COMMISSION_PER_ORDER = 15;
const formatInvoiceId = (id: string | number) => `MCB-${String(id).slice(0, 6).toUpperCase()}`;

const n = (value: unknown): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const normalizedStatus = (value: unknown) => String(value || "").trim().toLowerCase();
const isDeliveredStatus = (value: unknown) => ["delivered", "partial_delivered"].includes(normalizedStatus(value));
const isCancelledStatus = (value: unknown) => normalizedStatus(value) === "cancelled";

function mapSteadfastStatus(value: unknown): string {
  const status = normalizedStatus(value);
  if (["delivered", "partial_delivered"].includes(status)) return "Delivered";
  if (status === "cancelled") return "Cancelled";
  if (status.includes("return")) return "Returned";
  if (["pending", "delivered_approval_pending", "partial_delivered_approval_pending", "cancelled_approval_pending", "unknown_approval_pending", "hold", "in_review", "unknown"].includes(status)) return "Processing";
  return "";
}

export default function DashboardPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [confirmedByOrderId, setConfirmedByOrderId] = useState<Record<string, string>>({});

  useEffect(() => {
    loadOrders();

    try {
      const saved = localStorage.getItem("mcb_order_confirmed_by");
      if (saved) setConfirmedByOrderId(JSON.parse(saved));
    } catch (error) {
      console.error("Failed to load Sakin assignments", error);
    }

    const syncAssignments = () => {
      try {
        const saved = localStorage.getItem("mcb_order_confirmed_by");
        setConfirmedByOrderId(saved ? JSON.parse(saved) : {});
      } catch (error) {
        console.error("Failed to sync Sakin assignments", error);
      }
    };

    window.addEventListener("storage", syncAssignments);
    return () => window.removeEventListener("storage", syncAssignments);
  }, []);

  async function loadOrders() {
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .order("order_date", { ascending: false });

    if (error) {
      console.error(error.message);
      return;
    }

    const fetched = (data || []) as Order[];
    setOrders(fetched);
    void syncTrackingStatuses(fetched);
  }

  async function syncTrackingStatuses(currentOrders: Order[]) {
    const updated = [...currentOrders];
    let changed = false;

    for (let index = 0; index < updated.length; index += 1) {
      const item = updated[index];
      const trackingCode = String(item.tracking_code || "").trim();
      if (!trackingCode) continue;

      try {
        const response = await fetch(`/api/steadfast?tracking_code=${encodeURIComponent(trackingCode)}`, {
          cache: "no-store",
        });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok || !payload?.delivery_status) continue;

        const nextStatus = mapSteadfastStatus(payload.delivery_status);
        if (!nextStatus || normalizedStatus(item.status) === normalizedStatus(nextStatus)) continue;

        changed = true;
        updated[index] = { ...item, status: nextStatus };
        await supabase.from("orders").update({ status: nextStatus }).eq("id", item.id);
      } catch (error) {
        console.error("Dashboard tracking sync failed", trackingCode, error);
      }
    }

    if (changed) setOrders(updated);
  }

  const totalOrdersCount = orders.length;
  const deliveredOrdersCount = orders.filter((item) => isDeliveredStatus(item.status)).length;
  const cancelledOrdersCount = orders.filter((item) => isCancelledStatus(item.status)).length;
  const processingOrdersCount = orders.filter((item) => !isDeliveredStatus(item.status) && !isCancelledStatus(item.status)).length;

  const totalSalesAmount = orders.reduce((sum, item) => sum + n(item.total_amount), 0);
  const totalDeliveryCharge = orders.reduce((sum, item) => sum + n(item.delivery_charge), 0);
  const totalProductCost = orders.reduce((sum, item) => sum + n(item.product_cost), 0);

  const sakinOrders = orders.filter((item) => confirmedByOrderId[String(item.id)] === "Sakin");
  const sakinTotalOrders = sakinOrders.length;
  const sakinDeliveredOrders = sakinOrders.filter((item) => isDeliveredStatus(item.status)).length;
  const sakinCancelledOrders = sakinOrders.filter((item) => isCancelledStatus(item.status)).length;
  const sakinCommission = Math.max(0, sakinTotalOrders - sakinCancelledOrders) * COMMISSION_PER_ORDER;

  const chartDataMap: Record<string, { date: string; orders: number; sales: number }> = {};

  orders.forEach((item) => {
    const date = item.order_date || "Unknown";
    if (!chartDataMap[date]) {
      chartDataMap[date] = { date, orders: 0, sales: 0 };
    }
    chartDataMap[date].orders += 1;
    chartDataMap[date].sales += n(item.total_amount);
  });

  const graphData = Object.values(chartDataMap).sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const recentOrders = orders.slice(0, 5);

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-1 text-gray-500">Welcome back! Here is your business performance overview.</p>
        </div>
        <Link href="/orders" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-medium shadow transition">
          + New Order
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <p className="text-sm font-medium text-gray-500">Total Orders</p>
          <h3 className="text-2xl font-bold text-gray-800 mt-2">{totalOrdersCount}</h3>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <p className="text-sm font-medium text-gray-500">Total Sales</p>
          <h3 className="text-2xl font-bold text-purple-600 mt-2">৳ {totalSalesAmount.toLocaleString()}</h3>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <p className="text-sm font-medium text-gray-500">Total Delivery Charge</p>
          <h3 className="text-2xl font-bold text-orange-600 mt-2">৳ {totalDeliveryCharge.toLocaleString()}</h3>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <p className="text-sm font-medium text-gray-500">Total Product Cost</p>
          <h3 className="text-2xl font-bold text-red-600 mt-2">৳ {totalProductCost.toLocaleString()}</h3>
        </div>
      </div>

      <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100 mb-6">
        <div className="mb-4">
          <h2 className="text-xl font-bold text-gray-800">Sakin Summary</h2>
          <p className="text-sm text-gray-500">Sakin assigned orders and commission status</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="rounded-lg bg-blue-100 px-3 py-2 text-sm font-bold text-blue-700">Orders: {sakinTotalOrders}</span>
          <span className="rounded-lg bg-green-100 px-3 py-2 text-sm font-bold text-green-700">Delivered: {sakinDeliveredOrders}</span>
          <span className="rounded-lg bg-red-100 px-3 py-2 text-sm font-bold text-red-700">Cancel: {sakinCancelledOrders}</span>
          <span className="rounded-lg bg-emerald-100 px-3 py-2 text-sm font-bold text-emerald-700">Commission: ৳{sakinCommission}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="rounded-xl bg-white p-4 shadow-sm border border-gray-100">
          <p className="text-xs font-medium text-gray-500">All Orders</p>
          <p className="mt-1 text-xl font-bold text-gray-800">{totalOrdersCount}</p>
        </div>
        <div className="rounded-xl bg-white p-4 shadow-sm border border-gray-100">
          <p className="text-xs font-medium text-gray-500">Delivered</p>
          <p className="mt-1 text-xl font-bold text-green-600">{deliveredOrdersCount}</p>
        </div>
        <div className="rounded-xl bg-white p-4 shadow-sm border border-gray-100">
          <p className="text-xs font-medium text-gray-500">Cancelled</p>
          <p className="mt-1 text-xl font-bold text-red-600">{cancelledOrdersCount}</p>
        </div>
        <div className="rounded-xl bg-white p-4 shadow-sm border border-gray-100">
          <p className="text-xs font-medium text-gray-500">Processing</p>
          <p className="mt-1 text-xl font-bold text-blue-600">{processingOrdersCount}</p>
        </div>
      </div>

      <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100 mb-6">
        <div className="mb-4">
          <h2 className="text-xl font-bold text-gray-800">Performance & Trend</h2>
          <p className="text-sm text-gray-500">Track daily orders and sales</p>
        </div>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={graphData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} />
              <YAxis stroke="#94a3b8" fontSize={12} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="orders" name="Total Orders" stroke="#3b82f6" strokeWidth={3} dot={{ r: 3 }} activeDot={{ r: 7 }} />
              <Line type="monotone" dataKey="sales" name="Sales (৳)" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100">
        <div className="mb-4">
          <h2 className="text-xl font-bold text-gray-800">Recent Orders</h2>
          <p className="text-sm text-gray-500">Latest transactions made in your system</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100 text-sm text-gray-500 bg-gray-50/50">
                <th className="p-3 font-semibold">Invoice ID</th>
                <th className="p-3 font-semibold">Date</th>
                <th className="p-3 font-semibold">Amount (৳)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {recentOrders.length > 0 ? recentOrders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50 transition">
                  <td className="p-3 font-semibold text-blue-600">
                    <Link href={`/orders/${order.id}`} className="hover:underline">{formatInvoiceId(order.id)}</Link>
                  </td>
                  <td className="p-3 text-gray-500">{order.order_date || "N/A"}</td>
                  <td className="p-3 font-semibold text-purple-600">৳ {n(order.total_amount).toLocaleString()}</td>
                </tr>
              )) : (
                <tr><td colSpan={3} className="p-6 text-center text-gray-400">No orders found yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}