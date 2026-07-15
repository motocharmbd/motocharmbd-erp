"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function DashboardPage() {
  const [productCount, setProductCount] = useState(0);
  const [orderCount, setOrderCount] = useState(0);
  const [purchaseCost, setPurchaseCost] = useState(0);
  const [profit, setProfit] = useState(0);

  async function loadDashboard() {
    const { count: products } = await supabase
      .from("products")
      .select("*", {
        count: "exact",
        head: true,
      });

    const { count: orders } = await supabase
      .from("orders")
      .select("*", {
        count: "exact",
        head: true,
      });

    const { data: productData } = await supabase
      .from("products")
      .select("stock,cost_price");

    let totalCost = 0;

    productData?.forEach((item) => {
      totalCost +=
        (Number(item.stock) || 0) *
        (Number(item.cost_price) || 0);
    });

    const { data: orderData } = await supabase
      .from("orders")
      .select("profit");

    let totalProfit = 0;

    orderData?.forEach((item) => {
      totalProfit += Number(item.profit) || 0;
    });

    setProductCount(products || 0);
    setOrderCount(orders || 0);
    setPurchaseCost(totalCost);
    setProfit(totalProfit);
  }

  useEffect(() => {
    loadDashboard();

    const productsChannel = supabase
      .channel("products-live")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "products",
        },
        () => loadDashboard()
      )
      .subscribe();

    const ordersChannel = supabase
      .channel("orders-live")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
        },
        () => loadDashboard()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(productsChannel);
      supabase.removeChannel(ordersChannel);
    };
  }, []);

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            Good Evening, Admin 👋
          </h1>
          <p className="mt-2 text-gray-500">
            Here's your business overview today
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-full bg-green-100 px-4 py-2 shadow-sm">
          <span className="relative flex h-3 w-3">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-500 opacity-75"></span>
            <span className="relative inline-flex h-3 w-3 rounded-full bg-green-600"></span>
          </span>

          <span className="font-semibold text-green-700">
            Live Sync
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl bg-blue-500 p-6 text-white shadow-lg">
          <h2 className="text-lg">Products</h2>
          <p className="mt-2 text-3xl font-bold">
            {productCount}
          </p>
        </div>

        <div className="rounded-2xl bg-green-500 p-6 text-white shadow-lg">
          <h2 className="text-lg">Purchase Cost</h2>
          <p className="mt-2 text-3xl font-bold">
            ৳{purchaseCost.toLocaleString()}
          </p>
        </div>

        <div className="rounded-2xl bg-purple-500 p-6 text-white shadow-lg">
          <h2 className="text-lg">Orders</h2>
          <p className="mt-2 text-3xl font-bold">
            {orderCount}
          </p>
        </div>

        <div className="rounded-2xl bg-orange-500 p-6 text-white shadow-lg">
          <h2 className="text-lg">Profit</h2>
          <p className="mt-2 text-3xl font-bold">
            ৳{profit.toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
}