"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalProfit: 0,
    totalCost: 0,
    totalDeliveryCharge: 0,
  });
  const [moderatorDetails, setModeratorDetails] = useState<any[]>([]);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        setLoading(true);
        
        // আপনার অর্ডার টেবিল থেকে ডাটা ফেচ করা (টেবিলের নাম 'orders' না হলে আপনার টেবিল নাম দিয়ে বদল করে নেবেন)
        const { data: orders, error } = await supabase
          .from("orders")
          .select("*");

        if (error) throw error;

        if (orders) {
          let totalOrd = orders.length;
          let profit = 0;
          let cost = 0;
          let delivery = 0;
          const modMap: { [key: string]: { count: number; sales: number } } = {};

          orders.forEach((order) => {
            // ফিল্ডগুলোর নাম আপনার ডাটাবেস অনুযায়ী অ্যাডজাস্ট করে নিতে পারেন
            profit += Number(order.profit || 0);
            cost += Number(order.cost || 0);
            delivery += Number(order.delivery_charge || 0);

            // মডারেটর অনুযায়ী অর্ডার ডিটেলস হিসাব করা
            const moderator = order.moderator_name || order.moderator || "Unknown";
            if (!modMap[moderator]) {
              modMap[moderator] = { count: 0, sales: 0 };
            }
            modMap[moderator].count += 1;
            modMap[moderator].sales += Number(order.total_amount || order.price || 0);
          });

          setStats({
            totalOrders: totalOrd,
            totalProfit: profit,
            totalCost: cost,
            totalDeliveryCharge: delivery,
          });

          const modArray = Object.keys(modMap).map((key) => ({
            name: key,
            totalOrders: modMap[key].count,
            totalSales: modMap[key].sales,
          }));

          setModeratorDetails(modArray);
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
      <div className="flex items-center justify-center h-full">
        <div className="text-lg font-semibold text-gray-600 animate-pulse">Loading Dashboard...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Dashboard Overview</h1>
        <span className="text-sm text-gray-500">Welcome back, Admin</span>
      </div>

      {/* Top Stat Cards: Profit, Cost, Delivery Charge, Total Order */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Orders */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Total Orders</p>
            <h3 className="text-3xl font-bold text-gray-800 mt-1">{stats.totalOrders}</h3>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl text-xl">📦</div>
        </div>

        {/* Total Profit */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Total Profit</p>
            <h3 className="text-3xl font-bold text-emerald-600 mt-1">৳ {stats.totalProfit.toLocaleString()}</h3>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl text-xl">📈</div>
        </div>

        {/* Total Cost */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Total Cost</p>
            <h3 className="text-3xl font-bold text-rose-600 mt-1">৳ {stats.totalCost.toLocaleString()}</h3>
          </div>
          <div className="p-3 bg-rose-50 text-rose-600 rounded-xl text-xl">📉</div>
        </div>

        {/* Delivery Charge */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Delivery Charge</p>
            <h3 className="text-3xl font-bold text-amber-600 mt-1">৳ {stats.totalDeliveryCharge.toLocaleString()}</h3>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl text-xl">🚚</div>
        </div>
      </div>

      {/* Moderator Order Details Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Moderator Order Details</h3>
        
        {moderatorDetails.length === 0 ? (
          <p className="text-gray-500 text-sm py-4">No moderator data found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Moderator Name</th>
                  <th className="py-3 px-4">Total Orders Handled</th>
                  <th className="py-3 px-4">Total Sales Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-sm text-gray-700">
                {moderatorDetails.map((mod, index) => (
                  <tr key={index} className="hover:bg-gray-50/50 transition">
                    <td className="py-3.5 px-4 font-medium text-gray-800">{mod.name}</td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-1 bg-blue-50 text-blue-600 rounded-full font-semibold text-xs">
                        {mod.totalOrders} Orders
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-gray-800">৳ {mod.totalSales.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
