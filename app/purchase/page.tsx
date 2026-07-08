"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function PurchasePage() {
  const [products, setProducts] = useState<any[]>([]);
  const [selectedProduct, setSelectedProduct] = useState("");
  const [qty, setQty] = useState("");
  const [unit, setUnit] = useState("pcs");
  const [price, setPrice] = useState("");
  const [purchaseItems, setPurchaseItems] = useState<any[]>([]);

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

  function addItem() {
    if (!selectedProduct || !qty || !price) {
      alert("Fill all fields");
      return;
    }

    const total = Number(qty) * Number(price);

    setPurchaseItems([
      ...purchaseItems,
      {
        product_name: selectedProduct,
        qty: Number(qty),
        unit,
        unit_price: Number(price),
        total,
      },
    ]);

    setQty("");
    setPrice("");
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Purchase Book</h1>

        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg">
          Save Today's Purchase
        </button>
      </div>

      <div className="bg-white rounded-xl shadow p-6 mt-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">

          <select
            value={selectedProduct}
            onChange={(e) => setSelectedProduct(e.target.value)}
            className="border rounded-lg p-3"
          >
            <option value="">Select Product</option>

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
            className="border rounded-lg p-3"
          />

          <select
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            className="border rounded-lg p-3"
          >
            <option>pcs</option>
            <option>bundle</option>
            <option>sheet</option>
            <option>bottle</option>
            <option>meter</option>
          </select>

          <input
            type="number"
            placeholder="Price (BDT)"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="border rounded-lg p-3"
          />

          <button
            onClick={addItem}
            className="bg-green-600 text-white rounded-lg"
          >
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
            {purchaseItems.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="text-center p-6 text-gray-500"
                >
                  No Purchase Added
                </td>
              </tr>
            ) : (
              purchaseItems.map((item, index) => (
                <tr key={index}>
                  <td className="p-3">{item.product_name}</td>
                  <td className="p-3">{item.qty}</td>
                  <td className="p-3">{item.unit}</td>
                  <td className="p-3">{item.unit_price}</td>
                  <td className="p-3">{item.total}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}