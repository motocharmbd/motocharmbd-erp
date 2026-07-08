"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function ProductsPage() {
  const [productName, setProductName] = useState("");
  const [category, setCategory] = useState("");
  const [costPrice, setCostPrice] = useState("");
  const [sellingPrice, setSellingPrice] = useState("");
  const [stock, setStock] = useState("");
  const [products, setProducts] = useState<any[]>([]);

  async function loadProducts() {
    const { data } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });

    setProducts(data || []);
  }

  useEffect(() => {
    loadProducts();
  }, []);

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
      return;
    }

    alert("✅ Product Added Successfully");

    setProductName("");
    setCategory("");
    setCostPrice("");
    setSellingPrice("");
    setStock("");

    loadProducts();
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Products</h1>

      <div className="bg-white rounded-xl shadow p-6 max-w-xl space-y-4 mb-8">
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

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="text-left p-4">Product</th>
              <th className="text-left p-4">Category</th>
              <th className="text-left p-4">Cost</th>
              <th className="text-left p-4">Selling</th>
              <th className="text-left p-4">Stock</th>
            </tr>
          </thead>

          <tbody>
            {products.map((product) => (
              <tr key={product.id} className="border-t">
                <td className="p-4">{product.product_name}</td>
                <td className="p-4">{product.category}</td>
                <td className="p-4">{product.cost_price}</td>
                <td className="p-4">{product.selling_price}</td>
                <td className="p-4">{product.stock}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}