"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function OrdersPage() {
  const [products, setProducts] = useState<any[]>([]);

  const [customerName, setCustomerName] = useState("");
  const [selectedProduct, setSelectedProduct] = useState("");
  const [qty, setQty] = useState("");
  const [sellingPrice, setSellingPrice] = useState("");

  useEffect(() => {
    loadProducts();
  }, []);

  async function loadProducts() {
    const { data } = await supabase
      .from("products")
      .select("*")
      .order("product_name");

    setProducts(data || []);
  }

  async function saveOrder() {
    if (
      !customerName ||
      !selectedProduct ||
      !qty ||
      !sellingPrice
    ) {
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

    const quantity = Number(qty);
    const sellPrice = Number(sellingPrice);

    const totalSellingPrice =
      quantity * sellPrice;

    const profit =
      totalSellingPrice -
      quantity * Number(product.cost_price);

    const { error } = await supabase
      .from("orders")
      .insert([
        {
          customer_name: customerName,
          product_id: product.id,
          product_name: product.product_name,
          qty: quantity,
          selling_price: sellPrice,
          total: totalSellingPrice,
          profit: profit,
          status: "Pending",
        },
      ]);

    if (error) {
      alert(error.message);
      return;
    }

    alert("Order Saved Successfully");

    setCustomerName("");
    setSelectedProduct("");
    setQty("");
    setSellingPrice("");
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">
        Orders
      </h1>

      <div className="bg-white rounded-xl shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <input
            type="text"
            placeholder="Customer Name"
            value={customerName}
            onChange={(e) =>
              setCustomerName(e.target.value)
            }
            className="border rounded-lg p-3"
          />

          <select
            value={selectedProduct}
            onChange={(e) =>
              setSelectedProduct(e.target.value)
            }
            className="border rounded-lg p-3"
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
            onChange={(e) =>
              setQty(e.target.value)
            }
            className="border rounded-lg p-3"
          />

          <input
            type="number"
            placeholder="Selling Price"
            value={sellingPrice}
            onChange={(e) =>
              setSellingPrice(e.target.value)
            }
            className="border rounded-lg p-3"
          />

          <button
            onClick={saveOrder}
            className="bg-green-600 text-white rounded-lg px-4 py-3 hover:bg-green-700"
          >
            Save Order
          </button>
        </div>
      </div>
    </div>
  );
}