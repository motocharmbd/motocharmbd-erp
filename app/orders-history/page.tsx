"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Order = {
  id: number;
  order_date: string;
  customer_name: string;
  phone: string;
  address: string;
  size: string;
  qty: number;
  total_amount: number;
  product_cost: number;
  delivery_charge: number;
  boost_cost: number;
  total_cost: number;
  profit: number;
  status: string;
};

export default function OrderHistoryPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedMonth, setSelectedMonth] = useState("all");
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadOrders();
  }, []);

  async function loadOrders() {
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .order("id", { ascending: false });

    if (error) {
      alert(error.message);
      return;
    }

    setOrders((data || []) as Order[]);
  }

  const filteredOrders =
    selectedMonth === "all"
      ? orders
      : orders.filter((item) =>
          item.order_date?.startsWith(selectedMonth)
        );

  const totalOrders = filteredOrders.length;

  const totalSales = filteredOrders.reduce(
    (sum, item) => sum + Number(item.total_amount || 0),
    0
  );

  const totalCost = filteredOrders.reduce(
    (sum, item) => sum + Number(item.total_cost || 0),
    0
  );

  const totalProfit = filteredOrders.reduce(
    (sum, item) => sum + Number(item.profit || 0),
    0
  );

  function openEdit(order: Order) {
    setEditingOrder({ ...order });
  }

  function updateField(
    field: keyof Order,
    value: string
  ) {
    setEditingOrder((current) => {
      if (!current) return null;

      const numberFields = [
        "qty",
        "total_amount",
        "product_cost",
        "delivery_charge",
        "boost_cost",
      ];

      return {
        ...current,
        [field]: numberFields.includes(field)
          ? Number(value) || 0
          : value,
      };
    });
  }

  async function updateStatus(
    id: number,
    status: string
  ) {
    const { error } = await supabase
      .from("orders")
      .update({ status })
      .eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    setOrders((current) =>
      current.map((item) =>
        item.id === id
          ? { ...item, status }
          : item
      )
    );
  }

  async function updateOrder() {
    if (!editingOrder) return;

    setSaving(true);

    const productCost =
      Number(editingOrder.product_cost) || 0;

    const delivery =
      Number(editingOrder.delivery_charge) || 0;

    const boost =
      Number(editingOrder.boost_cost) || 0;

    const totalAmount =
      Number(editingOrder.total_amount) || 0;

    const totalCost =
      productCost + delivery + boost;

    const profit =
      totalAmount - totalCost;

    const updateData = {
      customer_name: editingOrder.customer_name,
      phone: editingOrder.phone,
      address: editingOrder.address,
      order_date: editingOrder.order_date,
      size: editingOrder.size,
      qty: Number(editingOrder.qty) || 0,
      total_amount: totalAmount,
      product_cost: productCost,
      delivery_charge: delivery,
      boost_cost: boost,
      total_cost: totalCost,
      profit,
      status: editingOrder.status || "Pending",
    };

    const { data, error } = await supabase
      .from("orders")
      .update(updateData)
      .eq("id", editingOrder.id)
      .select()
      .single();

    setSaving(false);

    if (error) {
      alert(error.message);
      return;
    }

    setOrders((current) =>
      current.map((item) =>
        item.id === editingOrder.id
          ? (data as Order)
          : item
      )
    );

    setEditingOrder(null);

    alert("Order updated successfully");
  }

  async function deleteOrder(id: number) {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this order?"
    );

    if (!confirmDelete) return;

    const { error } = await supabase
      .from("orders")
      .delete()
      .eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    setOrders((current) =>
      current.filter((item) => item.id !== id)
    );

    alert("Order deleted successfully");
  }

  function statusClass(status: string) {
    switch (status) {
      case "Delivered":
        return "bg-green-100 text-green-700";

      case "Processing":
        return "bg-blue-100 text-blue-700";

      case "Cancelled":
        return "bg-red-100 text-red-700";

      case "Returned":
        return "bg-orange-100 text-orange-700";

      default:
        return "bg-yellow-100 text-yellow-700";
    }
  }

  return (
    <div className="p-6">

      <div className="mb-6">
        <h1 className="text-3xl font-bold">
          Order History
        </h1>

        <p className="mt-2 text-gray-500">
          View, edit and manage all orders.
        </p>
      </div>

      <select
        value={selectedMonth}
        onChange={(e) =>
          setSelectedMonth(e.target.value)
        }
        className="mb-6 rounded-lg border bg-white p-3"
      >
        <option value="all">
          All Months
        </option>

        <option value="2026-01">January 2026</option>
        <option value="2026-02">February 2026</option>
        <option value="2026-03">March 2026</option>
        <option value="2026-04">April 2026</option>
        <option value="2026-05">May 2026</option>
        <option value="2026-06">June 2026</option>
        <option value="2026-07">July 2026</option>
        <option value="2026-08">August 2026</option>
        <option value="2026-09">September 2026</option>
        <option value="2026-10">October 2026</option>
        <option value="2026-11">November 2026</option>
        <option value="2026-12">December 2026</option>
      </select>

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">

        <div className="rounded-2xl bg-blue-500 p-5 text-white shadow-lg">
          <p>Total Orders</p>
          <p className="mt-2 text-3xl font-bold">
            {totalOrders}
          </p>
        </div>

        <div className="rounded-2xl bg-purple-500 p-5 text-white shadow-lg">
          <p>Total Sales</p>
          <p className="mt-2 text-3xl font-bold">
            ৳{totalSales.toLocaleString()}
          </p>
        </div>

        <div className="rounded-2xl bg-red-500 p-5 text-white shadow-lg">
          <p>Total Cost</p>
          <p className="mt-2 text-3xl font-bold">
            ৳{totalCost.toLocaleString()}
          </p>
        </div>

        <div className="rounded-2xl bg-green-500 p-5 text-white shadow-lg">
          <p>Total Profit</p>
          <p className="mt-2 text-3xl font-bold">
            ৳{totalProfit.toLocaleString()}
          </p>
        </div>

      </div>

      <div className="overflow-x-auto rounded-xl bg-white shadow">

        <table className="w-full min-w-[1700px]">

          <thead className="bg-gray-100">
            <tr>

              <th className="p-3 text-left">Date</th>
              <th className="p-3 text-left">Customer</th>
              <th className="p-3 text-left">Phone</th>
              <th className="p-3 text-left">Address</th>
              <th className="p-3 text-left">Size</th>
              <th className="p-3 text-left">Qty</th>
              <th className="p-3 text-left">Amount</th>
              <th className="p-3 text-left">Product Cost</th>
              <th className="p-3 text-left">Delivery</th>
              <th className="p-3 text-left">Boost</th>
              <th className="p-3 text-left">Total Cost</th>
              <th className="p-3 text-left">Profit</th>
              <th className="p-3 text-left">Status</th>
              <th className="p-3 text-left">Action</th>

            </tr>
          </thead>

          <tbody>

            {filteredOrders.map((item) => (

              <tr
                key={item.id}
                className="border-b hover:bg-gray-50"
              >

                <td className="p-3">
                  {item.order_date || "-"}
                </td>

                <td className="p-3">
                  {item.customer_name || "-"}
                </td>

                <td className="p-3">
                  {item.phone || "-"}
                </td>

                <td className="p-3">
                  {item.address || "-"}
                </td>

                <td className="p-3">
                  {item.size || "-"}
                </td>

                <td className="p-3">
                  {item.qty || 0}
                </td>

                <td className="p-3">
                  ৳{Number(
                    item.total_amount || 0
                  ).toLocaleString()}
                </td>

                <td className="p-3">
                  ৳{Number(
                    item.product_cost || 0
                  ).toLocaleString()}
                </td>

                <td className="p-3">
                  ৳{Number(
                    item.delivery_charge || 0
                  ).toLocaleString()}
                </td>

                <td className="p-3">
                  ৳{Number(
                    item.boost_cost || 0
                  ).toLocaleString()}
                </td>

                <td className="p-3">
                  ৳{Number(
                    item.total_cost || 0
                  ).toLocaleString()}
                </td>

                <td className="p-3 font-semibold text-green-600">
                  ৳{Number(
                    item.profit || 0
                  ).toLocaleString()}
                </td>

                <td className="p-3">

                  <select
                    value={item.status || "Pending"}
                    onChange={(e) =>
                      updateStatus(
                        item.id,
                        e.target.value
                      )
                    }
                    className={`rounded-lg border-0 px-3 py-2 font-semibold ${statusClass(
                      item.status || "Pending"
                    )}`}
                  >

                    <option value="Pending">
                      Pending
                    </option>

                    <option value="Processing">
                      Processing
                    </option>

                    <option value="Delivered">
                      Delivered
                    </option>

                    <option value="Cancelled">
                      Cancelled
                    </option>

                    <option value="Returned">
                      Returned
                    </option>

                  </select>

                </td>

                <td className="p-3">

                  <div className="flex gap-2">

                    <button
                      type="button"
                      onClick={() =>
                        openEdit(item)
                      }
                      className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                    >
                      Edit
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        deleteOrder(item.id)
                      }
                      className="rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-700"
                    >
                      Delete
                    </button>

                  </div>

                </td>

              </tr>

            ))}

          </tbody>

        </table>

        {filteredOrders.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            No orders found.
          </div>
        )}

      </div>

      {editingOrder && (

        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">

          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">

            <div className="mb-6 flex items-center justify-between">

              <h2 className="text-2xl font-bold">
                Edit Order
              </h2>

              <button
                type="button"
                onClick={() =>
                  setEditingOrder(null)
                }
                className="text-3xl text-gray-500 hover:text-black"
              >
                ×
              </button>

            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

              <input
                value={
                  editingOrder.customer_name
                }
                onChange={(e) =>
                  updateField(
                    "customer_name",
                    e.target.value
                  )
                }
                placeholder="Customer Name"
                className="rounded-lg border p-3"
              />

              <input
                value={editingOrder.phone}
                onChange={(e) =>
                  updateField(
                    "phone",
                    e.target.value
                  )
                }
                placeholder="Phone"
                className="rounded-lg border p-3"
              />

              <input
                value={editingOrder.address}
                onChange={(e) =>
                  updateField(
                    "address",
                    e.target.value
                  )
                }
                placeholder="Address"
                className="rounded-lg border p-3"
              />

              <input
                type="date"
                value={
                  editingOrder.order_date || ""
                }
                onChange={(e) =>
                  updateField(
                    "order_date",
                    e.target.value
                  )
                }
                className="rounded-lg border p-3"
              />

              <select
                value={editingOrder.size}
                onChange={(e) =>
                  updateField(
                    "size",
                    e.target.value
                  )
                }
                className="rounded-lg border p-3"
              >
                <option value="11 Inch">
                  11 Inch
                </option>

                <option value="15 Inch">
                  15 Inch
                </option>
              </select>

              <input
                type="number"
                value={editingOrder.qty}
                onChange={(e) =>
                  updateField(
                    "qty",
                    e.target.value
                  )
                }
                placeholder="Qty"
                className="rounded-lg border p-3"
              />

              <input
                type="number"
                value={
                  editingOrder.total_amount
                }
                onChange={(e) =>
                  updateField(
                    "total_amount",
                    e.target.value
                  )
                }
                placeholder="Total Amount"
                className="rounded-lg border p-3"
              />

              <input
                type="number"
                value={
                  editingOrder.product_cost
                }
                onChange={(e) =>
                  updateField(
                    "product_cost",
                    e.target.value
                  )
                }
                placeholder="Product Cost"
                className="rounded-lg border p-3"
              />

              <input
                type="number"
                value={
                  editingOrder.delivery_charge
                }
                onChange={(e) =>
                  updateField(
                    "delivery_charge",
                    e.target.value
                  )
                }
                placeholder="Delivery Charge"
                className="rounded-lg border p-3"
              />

              <input
                type="number"
                value={
                  editingOrder.boost_cost
                }
                onChange={(e) =>
                  updateField(
                    "boost_cost",
                    e.target.value
                  )
                }
                placeholder="Boost Cost"
                className="rounded-lg border p-3"
              />

              <select
                value={
                  editingOrder.status || "Pending"
                }
                onChange={(e) =>
                  updateField(
                    "status",
                    e.target.value
                  )
                }
                className="rounded-lg border p-3"
              >
                <option value="Pending">
                  Pending
                </option>

                <option value="Processing">
                  Processing
                </option>

                <option value="Delivered">
                  Delivered
                </option>

                <option value="Cancelled">
                  Cancelled
                </option>

                <option value="Returned">
                  Returned
                </option>
              </select>

            </div>

            <div className="mt-6 flex justify-end gap-3">

              <button
                type="button"
                onClick={() =>
                  setEditingOrder(null)
                }
                className="rounded-lg border px-5 py-3"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={updateOrder}
                disabled={saving}
                className="rounded-lg bg-green-600 px-5 py-3 font-semibold text-white hover:bg-green-700 disabled:opacity-50"
              >
                {saving
                  ? "Saving..."
                  : "Save Changes"}
              </button>

            </div>

          </div>

        </div>

      )}

    </div>
  );
}