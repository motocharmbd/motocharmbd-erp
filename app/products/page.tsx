"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function ProductsPage() {
  const [productName, setProductName] = useState("");
  const [size, setSize] = useState("");
  const [purchasePrice, setPurchasePrice] = useState("");
  const [sellingPrice, setSellingPrice] = useState("");
  const [stock, setStock] = useState("");
  const [products, setProducts] = useState<any[]>([]);

  const loadProducts = async () => {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("id", { ascending: false });

    if (!error) {
      setProducts(data || []);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const addProduct = async () => {
    const { error } = await supabase.from("products").insert([
      {
        product_name: productName,
        size: size,
        cost_price: Number(purchasePrice),
        selling_price: Number(sellingPrice),
        stock: Number(stock),
        category: "Ring",
        product_type: "Ring",
      },
    ]);

    if (error) {
      alert(error.message);
      return;
    }

    alert("Product Added Successfully");

    setProductName("");
    setSize("");
    setPurchasePrice("");
    setSellingPrice("");
    setStock("");

    loadProducts();
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">
        Products
      </h1>

      <div className="bg-white p-6 rounded-2xl shadow-xl border border-gray-200 mb-6">
        <h2 className="text-xl font-semibold mb-4">
          Add Product
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="Product Name"
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
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
            placeholder="Purchase Price"
            value={purchasePrice}
            onChange={(e) => setPurchasePrice(e.target.value)}
            className="border p-3 rounded-xl"
          />

          <input
            type="number"
            placeholder="Selling Price"
            value={sellingPrice}
            onChange={(e) => setSellingPrice(e.target.value)}
            className="border p-3 rounded-xl"
          />

          <input
            type="number"
            placeholder="Stock Quantity"
            value={stock}
            onChange={(e) => setStock(e.target.value)}
            className="border p-3 rounded-xl"
          />
        </div>

        <button
          onClick={addProduct}
          className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl"
        >
          Add Product
          
        </button>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-xl border border-gray-200">
        <h2 className="text-xl font-semibold mb-4">
          Product List
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full border border-gray-200">
            <thead>
              <tr className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                <th className="border p-4 text-left">Name</th>
                <th className="border p-4 text-left">Size</th>
                <th className="border p-4 text-left">Purchase</th>
                <th className="border p-4 text-left">Selling</th>
                <th className="border p-4 text-left">Stock</th>
                <th className="border p-4 text-center">Action</th>
              </tr>
            </thead>

            <tbody>
              {products.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="border p-6 text-center text-gray-500"
                  >
                    No Products Yet
                  </td>
                </tr>
              ) : (
                products.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-blue-50 transition"
                  >
                    <td className="border p-4">
                      {item.product_name}
                    </td>

                    <td className="border p-4">
                      {item.size}
                    </td>

                    <td className="border p-4">
                      ৳{item.cost_price}
                    </td>

                    <td className="border p-4 text-green-600 font-semibold">
                      ৳{item.selling_price}
                    </td>

                    <td className="border p-4">
                      {item.stock}
                    </td>
                    <td className="border p-4 text-center">
  <button
    onClick={() => deleteProduct(item.id)}
    className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-lg"
  >
    Delete
  </button>
</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}