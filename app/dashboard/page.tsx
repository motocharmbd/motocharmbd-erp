"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

const BRAND_NAME = "Moto Charm BD";

function n(val: any): number { 
  const num = Number(val); 
  return Number.isFinite(num) ? num : 0; 
}

function money(val: any): string { 
  return `৳${n(val).toLocaleString("en-BD")}`; 
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    brandOrders: 0, 
    brandProfit: 0, 
    brandCost: 0, 
    brandDelivery: 0,
    totalAllOrders: 0, 
    totalAllDelivered: 0, 
    totalAllCancelled: 0,
    totalAllIncome: 0, 
    totalAllCost: 0, 
    totalAllDelivery: 0
  });

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const { data: dbOrders, error } = await supabase.from("orders").select("*");
        if (error) throw error;

        if (dbOrders && dbOrders.length > 0) {
          let bOrders = 0, bProfit = 0, bCost = 0, bDelivery = 0;
          let allDelivered = 0, allCancelled = 0, allIncome = 0, allCost = 0, allDelivery = 0;

          dbOrders.forEach((order) => {
            const pCost = n(order.product_cost ?? order.cost ?? 0);
            const dCharge = n(order.delivery_charge ?? 0);
            const bCost = n(order.boost_cost ?? 0);
            const tAmount = n(order.total_amount ?? order.price ?? 0);
            const status = String(order.status || "").toLowerCase();

            // Overall System Statistics (ERP Total)
            allIncome += tAmount;
            allCost += (pCost + dCharge + bCost);
            allDelivery += dCharge;
            if (["delivered", "partial_delivered"].includes(status)) allDelivered++;
            if (status === "cancelled" || status.includes("return")) allCancelled++;
            
            // Brand Specific Calculations
            bOrders++;
            bDelivery += dCharge;
            bCost += (pCost + dCharge + bCost);
            bProfit += (tAmount - (pCost + dCharge + bCost));
          });

          setStats({
            brandOrders: bOrders, 
            brandProfit: bProfit, 
            brandCost: bCost, 
            brandDelivery: bDelivery,
            totalAllOrders: dbOrders.length, 
            totalAllDelivered: allDelivered, 
            totalAllCancelled: allCancelled,
            totalAllIncome: allIncome, 
            totalAllCost: allCost, 
            totalAllDelivery: allDelivery
          });
        }
      } catch (err) { 
        console.error("Dashboard fetch error:", err); 
      } finally { 
        setLoading(false); 
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-lg font-semibold text-gray-600 animate-pulse">Loading Dashboard...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6">
      {/* Brand Dashboard Section */}
      <div>
        <h2 className="text-2xl font-bold mb-4 text-gray-800">{BRAND_NAME} Dashboard</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { title: "Confirmed Orders", val: stats.brandOrders, color: "text-gray-800" },
            { title: "Total Profit", val: money(stats.brandProfit), color: "text-emerald-600" },
            { title: "Total Cost", val: money(stats.brandCost), color: "text-rose-600" },
            { title: "Delivery Charge", val: money(stats.brandDelivery), color: "text-amber-600" }
          ].map((item, i) => (
            <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <p className="text-sm font-medium text-gray-500">{item.title}</p>
              <h3 className={`text-3xl font-bold mt-1 ${item.color}`}>{item.val}</h3>
            </div>
          ))}
        </div>
      </div>

      {/* ERP Total Section */}
      <div className="border-t pt-8">
        <h2 className="text-xl font-bold mb-4 text-blue-700">Overall System Statistics</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {[
            { title: "Total Orders", val: stats.totalAllOrders },
            { title: "Delivered", val: stats.totalAllDelivered },
            { title: "Cancelled", val: stats.totalAllCancelled },
            { title: "Total Income", val: money(stats.totalAllIncome) },
            { title: "Total Cost", val: money(stats.totalAllCost) },
            { title: "Total Delivery", val: money(stats.totalAllDelivery) }
          ].map((item, i) => (
            <div key={i} className="bg-blue-50 p-4 rounded-xl border border-blue-100">
              <p className="text-xs font-semibold text-blue-500 uppercase">{item.title}</p>
              <h4 className="text-xl font-bold text-blue-900 mt-1">{item.val}</h4>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
