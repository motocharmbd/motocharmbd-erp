"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function PurchaseHistoryPage() {
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    loadHistory();
  }, []);

  async function loadHistory() {
    const { data } = await supabase
      .from("purchases")
      .select("*")
      .order("id", { ascending: false });

    setHistory(data || []);
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">
        Purchase History
      </h1>

      <div className="bg-white rounded-xl shadow">
        <table className="w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3 text-left">Product</th>
              <th className="p-3 text-left">Qty</th>
              <th className="p-3 text-left">Price</th>
              <th className="p-3 text-left">Total</th>
            </tr>
          </thead>

          <tbody>
            {history.map((item) => (
              <tr key={item.id}>
                <td className="p-3">
                  {item.product_name}
                </td>
                <td className="p-3">
                  {item.qty}
                </td>
                <td className="p-3">
                  {item.unit_price}
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