"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function ProductsPage() {
  const [products, setProducts] = useState<any[]>([]);

  const [productName, setProductName] = useState("");
  const [size, setSize] = useState("");
  const [costPrice, setCostPrice] = useState("");
  const [sellingPrice, setSellingPrice] = useState("");
  const [stock, setStock] = useState("");

  async function loadProducts() {
    const { data } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });

    setProducts(data || []);
  }

  async function addProduct() {
    if (!productName || !size) {
      alert("Product Name and Size required");
      return;
    }

    const { error } = await supabase.from("products").insert([
      {
        product_name: productName,
        size: size,
        cost_price: Number(costPrice),
        selling_price: Number(sellingPrice),
        stock: Number(stock),
        category: "General",
      },
    ]);

    if (error) {
      alert(error.message);
      return;
    }

    setProductName("");
    setSize("");
    setCostPrice("");
    setSellingPrice("");
    setStock("");

    loadProducts();
  }

  useEffect(() => {
    loadProducts();
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">
        Products
      </h1>

      <div className="bg-white p-6 rounded-2xl shadow-md mb-6">
        <h2 className="text-xl font-semibold mb-4">
          Add Product
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
            placeholder="Product Name"
            className="border p-3 rounded-xl"
          />

          <select
            value={size}
            onChange={(e) => setSize(e.target.value)}
            className="border p-3 rounded-xl"
          >
            <option value="">Select Size</option>
            <option value="11 Inch">11 Inch</option>
            <option value="15 Inch">15 Inch</option>
          </select>

          <input
            type="number"
            value={costPrice}
            onChange={(e) => setCostPrice(e.target.value)}
            placeholder="Purchase Price"
            className="border p-3 rounded-xl"
          />

          <input
            type="number"
            value={sellingPrice}
            onChange={(e) => setSellingPrice(e.target.value)}
            placeholder="Selling Price"
            className="border p-3 rounded-xl"
          />

          <input
            type="number"
            value={stock}
            onChange={(e) => setStock(e.target.value)}
            placeholder="Stock Quantity"
            className="border p-3 rounded-xl"
          />
        </div>

        <button
          onClick={addProduct}
          className="mt-4 bg-blue-600 text-white px-6 py-3 rounded-xl"
        >
          Add Product
        </button>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-md">
        <h2 className="text-xl font-semibold mb-4">
          Product List
        </h2>

        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left p-3">Name</th>
              <th className="text-left p-3">Size</th>
              <th className="text-left p-3">Cost</th>
              <th className="text-left p-3">Selling</th>
              <th className="text-left p-3">Stock</th>
            </tr>
          </thead>

          <tbody>
            {products.map((item) => (
              <tr key={item.id} className="border-b">
                <td className="p-3">{item.product_name}</td>
<td className="p-3">{item.size}</td>
                <td className="p-3">{item.cost_price}</td>
                <td className="p-3">{item.selling_price}</td>
                <td className="p-3">{item.stock}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}