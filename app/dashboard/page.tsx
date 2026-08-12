"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from "recharts";
import Link from "next/link";

type Order = {
  id: string | number;
  order_date: string;
  total_amount: number;
  profit: number;
  customer_name?: string;
  phone?: string;
  status?: string;
};

const formatInvoiceId = (id: string | number) => {
  const strId = String(id);
  const shortId = strId.slice(0, 6).toUpperCase();
  return `MCB-${shortId}`;
};

export default function DashboardPage() {
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    loadOrders();
  }, []);

  async function loadOrders() {
    const { data, error } = await supabase.from("orders").select("*").order("order_date", { ascending: false });
    if (error) {
      console.error(error.message);
    } else {
      setOrders(data || []);
    }
  }

  const safeOrders = Array.isArray(orders) ? orders : [];
  
  const totalOrdersCount = safeOrders.length;
  const totalSalesAmount = safeOrders.reduce((sum, item) => sum + (Number(item.total_amount) || 0), 0);
  const totalProfitAmount = safeOrders.reduce((sum, item) => sum + (Number(item.profit) || 0), 0);
  const averageOrderValue = totalOrdersCount > 0 ? (totalSalesAmount / totalOrdersCount).toFixed(2) : 0;

  const chartDataMap: { [date: string]: { date: string; orders: number; sales: number; profit: number } } = {};

  safeOrders.forEach((item) => {
    const d = item.order_date || "Unknown";
    if (!chartDataMap[d]) {
      chartDataMap[d] = { date: d, orders: 0, sales: 0, profit: 0 };
    }
    chartDataMap[d].orders += 1;
    chartDataMap[d].sales += Number(item.total_amount) || 0;
    chartDataMap[d].profit += Number(item.profit) || 0;
  });

  const graphData = Object.values(chartDataMap).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const recentOrders = safeOrders.slice(0, 5);

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-1 text-gray-500">Welcome back! Here is your business performance overview.</p>
        </div>
        <div className="flex gap-3">
          <Link href="/orders" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-medium shadow transition">
            + New Order
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <p className="text-sm font-medium text-gray-500">Total Orders</p>
          <h3 className="text-2xl font-bold text-gray-800 mt-2">{totalOrdersCount}</h3>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <p className="text-sm font-medium text-gray-500">Total Sales</p>
          <h3 className="text-2xl font-bold text-purple-600 mt-2">৳ {totalSalesAmount}</h3>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <p className="text-sm font-medium text-gray-500">Total Profit</p>
          <h3 className="text-2xl font-bold text-green-600 mt-2">৳ {totalProfitAmount}</h3>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <p className="text-sm font-medium text-gray-500">Avg. Order Value (AOV)</p>
          <h3 className="text-2xl font-bold text-blue-600 mt-2">৳ {averageOrderValue}</h3>
        </div>
      </div>

      <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100 mb-6">
        <div className="mb-4">
          <h2 className="text-xl font-bold text-gray-800">Performance & Trend</h2>
          <p className="text-sm text-gray-500">Track daily orders, sales, and profit ups & downs</p>
        </div>
        
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={graphData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} />
              <YAxis stroke="#94a3b8" fontSize={12} />
              <Tooltip 
                contentStyle={{ backgroundColor: "#1e293b", borderRadius: "8px", color: "#fff", border: "none" }}
                itemStyle={{ color: "#fff" }}
              />
              <Legend />
              <Line type="monotone" dataKey="orders" name="Total Orders" stroke="#3b82f6" strokeWidth={3} dot={{ r: 3 }} activeDot={{ r: 7 }} />
              <Line type="monotone" dataKey="sales" name="Sales (৳)" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="profit" name="Profit (৳)" stroke="#10b981" strokeWidth={3} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Recent Orders</h2>
            <p className="text-sm text-gray-500">Latest transactions made in your system</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100 text-sm text-gray-500 bg-gray-50/50">
                <th className="p-3 font-semibold rounded-l-lg">Invoice ID</th>
                <th className="p-3 font-semibold">Date</th>
                <th className="p-3 font-semibold">Amount (৳)</th>
                <th className="p-3 font-semibold rounded-r-lg">Profit (৳)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {recentOrders.length > 0 ? (
                recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50 transition">
                    <td className="p-3 font-semibold text-blue-600">
                      <Link
  href={`/orders/${order.id}`}
  className="hover:underline flex items-center gap-1"
>
                        {formatInvoiceId(order.id)}
                      </Link>
                    </td>
                    <td className="p-3 text-gray-500">{order.order_date || "N/A"}</td>
                    <td className="p-3 font-semibold text-purple-600">৳ {order.total_amount}</td>
                    <td className="p-3 font-semibold text-green-600">৳ {order.profit}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="p-6 text-center text-gray-400">
                    No orders found yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}