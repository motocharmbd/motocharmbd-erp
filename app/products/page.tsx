"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function ProductsPage() {
  const [productName, setProductName] = useState("");
  const [category, setCategory] = useState("");
  const [costPrice, setCostPrice] = useState("");
  const [sellingPrice, setSellingPrice] = useState("");
  const [stock, setStock] = useState("");

  async function addProduct() {
    const { error } = await supabase.from("products").insert([
      {
        product_name: productName,
        category,
        cost_price: Number(costPrice),
        selling_price: Number(sellingPrice),
        stock: Number(stock),
      },
    ]);

    if (error) {
      alert(error.message);
    } else {
      alert("✅ Product Added Successfully");

      setProductName("");
      setCategory("");
      setCostPrice("");
      setSellingPrice("");
      setStock("");
    }
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Products</h1>

      <div className="bg-white rounded-xl shadow p-6 max-w-xl space-y-4">

        <input
          placeholder="Product Name"
          value={productName}
          onChange={(e) => setProductName(e.target.value)}
          className="w-full border p-3 rounded"
        />

        <input
          placeholder="Category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full border p-3 rounded"
        />

        <input
          type="number"
          placeholder="Cost Price (BDT)"
          value={costPrice}
          onChange={(e) => setCostPrice(e.target.value)}
          className="w-full border p-3 rounded"
        />

        <input
          type="number"
          placeholder="Selling Price (BDT)"
          value={sellingPrice}
          onChange={(e) => setSellingPrice(e.target.value)}
          className="w-full border p-3 rounded"
        />

        <input
          type="number"
          placeholder="Stock"
          value={stock}
          onChange={(e) => setStock(e.target.value)}
          className="w-full border p-3 rounded"
        />

        <button
          onClick={addProduct}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded w-full"
        >
          Save Product
        </button>

      </div>
    </div>
  );
}