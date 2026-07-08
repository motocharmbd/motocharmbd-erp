"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function PurchasePage() {
  const [products, setProducts] = useState<any[]>([]);
  const [selectedProduct, setSelectedProduct] = useState("");
  const [qty, setQty] = useState("");
  const [price, setPrice] = useState("");
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    loadProducts();
    loadHistory();
  }, []);

  async function loadProducts() {
    const { data } = await supabase
      .from("products")
      .select("*")
      .order("product_name");

    setProducts(data || []);
  }

  async function loadHistory() {
    const { data } = await supabase
      .from("purchases")
      .select("*")
      .order("created_at", { ascending: false });

    setHistory(data || []);
  }

  async function savePurchase() {
    if (!selectedProduct || !qty || !price) {
      alert("Fill all fields");
      return;
    }

    const product = products.find(
      (p) => p.product_name === selectedProduct
    );

    if (!product) {
      alert("Product not found");
      return;
    }

    const total = Number(qty) * Number(price);

    const { error } = await supabase
      .from("purchases")
      .insert([
        {
          product_id: product.id,
          product_name: product.product_name,
          qty: Number(qty),
          unit_price: Number(price),
          total,
        },
      ]);

    if (error) {
      alert(error.message);
      return;
    }

    await supabase
      .from("products")
      .update({
        stock: Number(product.stock) + Number(qty),
        cost_price: Number(price),
      })
      .eq("id", product.id);

    setSelectedProduct("");
    setQty("");
    setPrice("");

    loadProducts();
    loadHistory();

    alert("Purchase Saved");
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">
        Purchase Book
      </h1>

      <div className="bg-white p-6 rounded-xl shadow">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">

          <select
            value={selectedProduct}
            onChange={(e) =>
              setSelectedProduct(e.target.value)
            }
            className="border p-3 rounded-lg"
          >
            <option value="">
              Select Product
            </option>

            {products.map((product) => (
              <option
                key={product.id}
                value={product.product_name}
              >
                {product.product_name}
              </option>
            ))}
          </select>

          <input
            type="number"
            placeholder="Qty"
            value={qty}
            onChange={(e) => setQty(e.target.value)}
            className="border p-3 rounded-lg"
          />

          <input
            type="number"
            placeholder="Unit Price"
            value={price}
            onChange={(e) =>
              setPrice(e.target.value)
            }
            className="border p-3 rounded-lg"
          />

          <button
            onClick={savePurchase}
            className="bg-blue-600 text-white rounded-lg"
          >
            Save Purchase
          </button>

        </div>
      </div>

      <div className="bg-white rounded-xl shadow mt-6">
        <table className="w-full">
          <thead className="bg-gray-100">
            <tr>
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