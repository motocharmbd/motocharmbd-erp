"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function DashboardPage() {
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    async function fetchData() {
      // আপনার শিটের নাম "Moto Charm BD" হতে পারে, টেবিলটি সঠিক কিনা চেক করে নিন
      const { data, error } = await supabase.from("Moto Charm BD").select("*");
      if (error) {
        console.error("Error fetching data:", error);
        return;
      }

      // ডাটা প্রসেসিং
      const totalOrders = data.length;
      const delivered = data.filter((item: any) => item.Status === "Delivered").length;
      const profit = data.reduce((acc: number, curr: any) => acc + (Number(curr.Profit) || 0), 0);
      
      setStats({ totalOrders, delivered, profit });
    }
    fetchData();
  }, []);

  if (!stats) return <div>Loading...</div>;

  return (
    <div style={{ padding: "20px" }}>
      <h1>Dashboard</h1>
      <div style={{ display: "flex", gap: "20px" }}>
        <div style={{ padding: "20px", background: "#eee", borderRadius: "10px" }}>
          <h3>Total Orders: {stats.totalOrders}</h3>
        </div>
        <div style={{ padding: "20px", background: "#eee", borderRadius: "10px" }}>
          <h3>Delivered: {stats.delivered}</h3>
        </div>
        <div style={{ padding: "20px", background: "#eee", borderRadius: "10px" }}>
          <h3>Total Profit: ৳{stats.profit}</h3>
        </div>
      </div>
    </div>
  );
}
