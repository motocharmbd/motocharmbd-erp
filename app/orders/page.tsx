"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function OrdersPage() {
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  

  const [size, setSize] = useState("");
  const [qty, setQty] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
  const [deliveryCharge, setDeliveryCharge] = useState("");
  const [boostCost, setBoostCost] = useState("");

  async function saveOrder() {
    if (
      !customerName ||
      !phone ||
      !size ||
      !qty ||
      !totalAmount
    ) {
      alert("Fill all required fields");
      return;
    }

    const quantity = Number(qty);

    const productCost =
      size === "11 Inch"
        ? quantity * 150
        : quantity * 180;

    const delivery = Number(deliveryCharge) || 0;
    const boost = Number(boostCost) || 0;

    const totalCost =
      productCost + delivery + boost;

    const profit =
      Number(totalAmount) - totalCost;

    const { error } = await supabase
      .from("orders")
      .insert([
        {
          customer_name: customerName,
          phone,
          address,
          order_date: new Date().toISOString().split("T")[0],
          size,
          qty: quantity,
          total_amount: Number(totalAmount),

          product_cost: productCost,
          delivery_charge: delivery,
          boost_cost: boost,
          total_cost: totalCost,
          profit,
        },
      ]);

    if (error) {
      alert(error.message);
      return;
    }

    alert("Order Saved Successfully");

    setCustomerName("");
    setPhone("");
    setAddress("");
    setSize("");
    setQty("");
    setTotalAmount("");
    setDeliveryCharge("");
    setBoostCost("");
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">
        Orders
      </h1>

      <div className="bg-white rounded-xl shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          <input
            type="text"
            placeholder="Customer Name"
            value={customerName}
            onChange={(e) =>
              setCustomerName(e.target.value)
            }
            className="border rounded-lg p-3"
          />

          <input
            type="text"
            placeholder="Phone"
            value={phone}
            onChange={(e) =>
              setPhone(e.target.value)
            }
            className="border rounded-lg p-3"
          />

          <input
            type="text"
            placeholder="Address"
            value={address}
            onChange={(e) =>
              setAddress(e.target.value)
            }
            className="border rounded-lg p-3"
          />

         

          <select
            value={size}
            onChange={(e) =>
              setSize(e.target.value)
            }
            className="border rounded-lg p-3"
          >
            <option value="">
              Select Size
            </option>

            <option value="11 Inch">
              11 Inch
            </option>

            <option value="15 Inch">
              15 Inch
            </option>
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
            placeholder="Total Amount"
            value={totalAmount}
            onChange={(e) =>
              setTotalAmount(e.target.value)
            }
            className="border rounded-lg p-3"
          />
<input
            type="number"
            placeholder="Delivery Charge"
            value={deliveryCharge}
            onChange={(e) =>
              setDeliveryCharge(e.target.value)
            }
            className="border rounded-lg p-3"
          />

          <input
            type="number"
            placeholder="Boost Cost"
            value={boostCost}
            onChange={(e) =>
              setBoostCost(e.target.value)
            }
            className="border rounded-lg p-3"
          />

        </div>

        <button
          onClick={saveOrder}
          className="mt-4 bg-green-600 text-white rounded-lg px-6 py-3 hover:bg-green-700"
        >
          Save Order
        </button>
      </div>
    </div>
  );
}