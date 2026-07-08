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

      <div className="bg-white rounded-xl shadow">
        <table className="w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3 text-left">
                Customer
              </th>
              <th className="p-3 text-left">
                Product
              </th>
              <th className="p-3 text-left">
                Qty
              </th>
              <th className="p-3 text-left">
                Price
              </th>
              <th className="p-3 text-left">
                Total
              </th>
            </tr>
          </thead>

          <tbody>
            {orders.map((item) => (
              <tr key={item.id}>
                <td className="p-3">
                  {item.customer_name}
                </td>

                <td className="p-3">
                  {item.name}
                </td>

                <td className="p-3">
                  {item.qty}
                </td>

                <td className="p-3">
                  {item.selling_price}
                </td>

                <td className="p-3">
                  {item.total}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}