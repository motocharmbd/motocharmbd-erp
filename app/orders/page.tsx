"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function OrdersPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [selectedProduct, setSelectedProduct] = useState("");
  const [qty, setQty] = useState("");
  const [sellingPrice, setSellingPrice] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [orderItems, setOrderItems] = useState<any[]>([]);

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

  function addOrderItem() {
    if (!selectedProduct || !qty || !sellingPrice) {
      alert("Fill all fields");
      return;
    }

    const total = Number(qty) * Number(sellingPrice);

    setOrderItems([
      ...orderItems,
      {
        product_name: selectedProduct,
        qty: Number(qty),
        selling_price: Number(sellingPrice),
        total,
      },
    ]);

    setQty("");
    setSellingPrice("");
  }

  async function saveOrder() {
    if (orderItems.length === 0) {
      alert("No Orders Added");
      return;
    }

    for (const item of orderItems) {
      const product = products.find(
        (p) => p.product_name === item.product_name
      );

      if (!product) continue;

      if ((product.stock || 0) < item.qty) {
        alert(`Insufficient Stock for ${item.product_name}`);
        return;
      }

      const { error } = await supabase
        .from("orders")
        .insert([
          {
            product_id: product.id,
            product_name: item.product_name,
            customer_name: customerName,
            qty: item.qty,
            selling_price: item.selling_price,
            total: item.total,
          },
        ]);

      if (error) {
        alert(error.message);
        return;
      }

      await supabase
        .from("products")
        .update({
          stock: product.stock - item.qty,
        })
        .eq("id", product.id);
    }

    alert("✅ Order Saved Successfully");

    setOrderItems([]);
    setCustomerName("");

    loadProducts();
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Orders</h1>

        <button
          onClick={saveOrder}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg"
        >
          Save Order
        </button>
      </div>

      <div className="bg-white rounded-xl shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">

          <input
            placeholder="Customer Name"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            className="border rounded-lg p-3"
          />

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

          <input
            type="number"
            placeholder="Selling Price"
            value={sellingPrice}
            onChange={(e) => setSellingPrice(e.target.value)}
            className="border rounded-lg p-3"
          />

          <button
            onClick={addOrderItem}
            className="bg-green-600 text-white rounded-lg"
          >
            Add Order
          </button>

        </div>
      </div>

      <div className="bg-white rounded-xl shadow mt-6">
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
            {orderItems.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  className="text-center p-6 text-gray-500"
                >
                  No Orders Added
                </td>
              </tr>
            ) : (
              orderItems.map((item, index) => (
                <tr key={index}>
                  <td className="p-3">{item.product_name}</td>
                  <td className="p-3">{item.qty}</td>
                  <td className="p-3">{item.selling_price}</td>
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