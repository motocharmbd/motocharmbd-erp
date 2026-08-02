"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function OrderHistoryPage() {
  const [orders, setOrders] = useState<any[]>([]);

  useEffect(() => {
    loadOrders();
  }, []);

  async function loadOrders() {
    const { data } = await supabase
      .from("orders")
      .select("*")
      .order("id", { ascending: false });

    setOrders(data || []);
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">
        Order History
      </h1>

      <div className="bg-white rounded-xl shadow overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3 text-left">Date</th>
              <th className="p-3 text-left">Customer</th>
              <th className="p-3 text-left">Phone</th>
              <th className="p-3 text-left">Size</th>
              <th className="p-3 text-left">Qty</th>
              <th className="p-3 text-left">Amount</th>
              <th className="p-3 text-left">Profit</th>
            </tr>
          </thead>

          <tbody>
            {orders.map((item) => (
              <tr key={item.id} className="border-b">
                <td className="p-3">
                  {item.order_date}
                </td>

                <td className="p-3">
                  {item.customer_name}
                </td>

                <td className="p-3">
                  {item.phone}
                </td>

                <td className="p-3">
                  {item.size}
                </td>

                <td className="p-3">
                  {item.qty}
                </td>

                <td className="p-3">
                  ৳{item.total_amount}
                </td>

                <td className="p-3 font-semibold text-green-600">
                  ৳{item.profit}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}