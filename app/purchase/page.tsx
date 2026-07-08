"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function PurchasePage() {
  const [products, setProducts] = useState<any[]>([]);

  async function loadProducts() {
    const { data } = await supabase
      .from("products")
      .select("*")
      .order("product_name");

    setProducts(data || []);
  }

  useEffect(() => {
    loadProducts();
  }, []);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Purchase Book</h1>

        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg">
          Save Today's Purchase
        </button>
      </div>

      <div className="bg-white rounded-xl shadow p-6 mt-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">

          <select className="border rounded-lg p-3">
            <option>Select Product</option>

            {products.map((product) => (
              <option key={product.id}>
                {product.product_name}
              </option>
            ))}
          </select>

          <input
            type="number"
            placeholder="Qty"
            className="border rounded-lg p-3"
          />

          <select className="border rounded-lg p-3">
            <option>pcs</option>
            <option>bundle</option>
            <option>sheet</option>
            <option>bottle</option>
            <option>meter</option>
          </select>

          <input
            type="number"
            placeholder="Price (BDT)"
            className="border rounded-lg p-3"
          />

          <button className="bg-green-600 text-white rounded-lg">
            Add Item
          </button>

        </div>
      </div>

      <div className="bg-white rounded-xl shadow mt-6">
        <table className="w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3 text-left">Item</th>
              <th className="p-3 text-left">Qty</th>
              <th className="p-3 text-left">Unit</th>
              <th className="p-3 text-left">Price</th>
              <th className="p-3 text-left">Total</th>
            </tr>
          </thead>

          <tbody>
            <tr>
              <td
                colSpan={5}
                className="text-center p-6 text-gray-500"
              >
                No Purchase Added
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}