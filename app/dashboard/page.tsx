"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalOrders: 0,
    deliveredOrders: 0,
    cancelledOrders: 0,
    totalProfit: 0,
    totalCost: 0,
    totalDeliveryCharge: 0,
    totalCommission: 0,
  });
  const [moderatorDetails, setModeratorDetails] = useState<any[]>([]);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        setLoading(true);
        
        const { data: orders, error } = await supabase
          .from("orders")
          .select("*");

        if (error) throw error;

        if (orders && orders.length > 0) {
          // আপনার ডাটাবেসের প্রথম অর্ডারটি কনসোলে প্রিন্ট করে দেখে নিতে পারেন ফিল্ডগুলোর আসল নাম কী
          console.log("Full Order Row Data:", orders[0]);

          let totalOrd = orders.length;
          let deliveredCount = 0;
          let cancelledCount = 0;
          let profit = 0;
          let cost = 0;
          let delivery = 0;
          let commission = 0;
          
          const modMap: { [key: string]: { count: number; sales: number; commission: number } } = {};

          orders.forEach((order) => {
            const status = String(order.status || "").toLowerCase();
            if (status.includes("deliver")) {
              deliveredCount++;
            } else if (status.includes("cancel") || status.includes("return")) {
              cancelledCount++;
            }

            // বিভিন্ন সম্ভাব্য কলামের নাম চেক করা হচ্ছে যাতে Cost এবং Commission মিস না হয়
            const orderCost = Number(
              order.cost ?? 
              order.buying_price ?? 
              order.purchase_cost ?? 
              order.product_cost ?? 
              0
            );

            const orderProfit = Number(
              order.profit ?? 
              order.net_profit ?? 
              0
            );

            const orderDelivery = Number(
              order.delivery_charge ?? 
              order.shipping_charge ?? 
              order.delivery ?? 
              0
            );

            const orderCommission = Number(
              order.commission ?? 
              order.sakin_commission ?? 
              order.mod_commission ?? 
              order.comission ?? 
              0
            );

            cost += orderCost;
            profit += orderProfit;
            delivery += orderDelivery;
            commission += orderCommission;

            // মডারেটরের নাম বিভিন্ন কলাম থেকে খোঁজা হচ্ছে
            const moderator = String(
              order.moderator_name ?? 
              order.moderator ?? 
              order.user_name ?? 
              order.created_by ?? 
              order.agent ?? 
              "Unknown"
            );

            if (!modMap[moderator]) {
              modMap[moderator] = { count: 0, sales: 0, commission: 0 };
            }
            modMap[moderator].count += 1;
            modMap[moderator].sales += Number(order.total_amount ?? order.price ?? order.grand_total ?? 0);
            modMap[moderator].commission += orderCommission;
          });

          setStats({
            totalOrders: totalOrd,
            deliveredOrders: deliveredCount,
            cancelledOrders: cancelledCount,
            totalProfit: profit,
            totalCost: cost,
            totalDeliveryCharge: delivery,
            totalCommission: commission,
          });

          const modArray = Object.keys(modMap).map((key) => ({
            name: key,
            totalOrders: modMap[key].count,
            totalSales: modMap[key].sales,
            totalCommission: modMap[key].commission,
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
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="text-lg font-semibold text-gray-600 animate-pulse">Loading Dashboard...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Dashboard Overview</h1>
          <p className="text-sm text-gray-500">Welcome back, Admin</p>
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
            Total Commission: ৳ {stats.totalCommission.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Main Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Total Orders</p>
            <h3 className="text-3xl font-bold text-gray-800 mt-1">{stats.totalOrders}</h3>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl text-xl">📦</div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Total Profit</p>
            <h3 className="text-3xl font-bold text-emerald-600 mt-1">৳ {stats.totalProfit.toLocaleString()}</h3>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl text-xl">📈</div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Total Cost</p>
            <h3 className="text-3xl font-bold text-rose-600 mt-1">৳ {stats.totalCost.toLocaleString()}</h3>
          </div>
          <div className="p-3 bg-rose-50 text-rose-600 rounded-xl text-xl">📉</div>
        </div>

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
        <h3 className="text-lg font-bold text-gray-800 mb-4">Moderator Order Details & Commission</h3>
        
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
                  <th className="py-3 px-4">Total Commission</th>
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
                    <td className="py-3.5 px-4 font-semibold text-teal-600">৳ {mod.totalCommission.toLocaleString()}</td>
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
