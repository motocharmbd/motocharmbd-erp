"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function PurchaseHistoryPage() {
  const [purchases, setPurchases] = useState<any[]>([]);

  async function loadPurchases() {
    const { data, error } = await supabase
      .from("purchases")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error) {
      setPurchases(data || []);
    }
  }

  useEffect(() => {
    loadPurchases();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">
        Purchase History
      </h1>

      <div className="bg-white rounded-xl shadow overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3 text-left">Product</th>
              <th className="p-3 text-left">Qty</th>
              <th className="p-3 text-left">Unit</th>
              <th className="p-3 text-left">Price</th>
              <th className="p-3 text-left">Total</th>
              <th className="p-3 text-left">Date</th>
            </tr>
          </thead>

          <tbody>
            {purchases.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="text-center p-6 text-gray-500"
                >
                  No Purchase Found
                </td>
              </tr>
            ) : (
              purchases.map((item) => (
                <tr
                  key={item.id}
                  className="border-t"
                >
                  <td className="p-3">
                    {item.product_name}
                  </td>

                  <td className="p-3">
                    {item.qty}
                  </td>

                  <td className="p-3">
                    {item.unit}
                  </td>

                  <td className="p-3">
                    ৳{item.unit_price}
                  </td>

                  <td className="p-3 font-semibold">
                    ৳{item.total}
                  </td>

                  <td className="p-3">
                    {new Date(
                      item.created_at
                    ).toLocaleDateString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}