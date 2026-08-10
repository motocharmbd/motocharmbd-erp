"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

type Order = {
  id: number;
  order_date: string;
  customer_name: string;
  phone: string;
  address: string;
  size: string;
  qty: number;
  total_amount: number;
  advance_amount: number;
  product_cost: number;
  delivery_charge: number;
  boost_cost: number;
  total_cost: number;
  profit: number;
  status: string;
  payment_status: string;
  tracking_code?: string;
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedMonth, setSelectedMonth] = useState("all");
  const [selectedDate, setSelectedDate] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewingOrder, setViewingOrder] = useState<Order | null>(null);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const hasSyncedRef = useRef(false);

  const [newOrder, setNewOrder] = useState({
    order_date: new Date().toISOString().split("T")[0],
    customer_name: "",
    phone: "",
    address: "",
    size: "11 Inch",
    qty: 1,
    total_amount: 0,
    advance_amount: 0,
    product_cost: 0,
    delivery_charge: 60,
    boost_cost: 0,
    status: "Processing",
    payment_status: "Unpaid",
  });

  useEffect(() => {
    loadAndAutoSyncOrders();
  }, []);

  async function loadAndAutoSyncOrders() {
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .order("id", { ascending: false });

    if (error) {
      alert(error.message);
      return;
    }

    const fetchedOrders = (data || []) as Order[];
    setOrders(fetchedOrders);

    if (!hasSyncedRef.current) {
      hasSyncedRef.current = true;
      syncAllTrackingCodes(fetchedOrders);
    }
  }

  async function syncAllTrackingCodes(currentOrders: Order[]) {
    let updatedOrders = [...currentOrders];
    let hasChanges = false;

    for (let i = 0; i < updatedOrders.length; i++) {
      const item = updatedOrders[i];
      if (item.tracking_code && item.status !== "Delivered" && item.status !== "Cancelled") {
        try {
          const response = await fetch(`https://portal.packzy.com/api/v1/status_by_trackingcode/${item.tracking_code}`, {
            method: "GET",
            headers: {
              "Api-Key": "0ocu3vpovq1ymvdhtpuz0jys4uhzuga3",
              "Secret-Key": "kqx3xtby4mhsenzih2qwtci6",
              "Accept": "application/json",
            },
          });

          const data = await response.json();

          if (data && data.delivery_status) {
            let fetchedStatus = item.status;
            const statusLower = data.delivery_status.toLowerCase();

            if (statusLower.includes("delivered")) fetchedStatus = "Delivered";
            else if (statusLower.includes("cancel")) fetchedStatus = "Cancelled";
            else if (statusLower.includes("return")) fetchedStatus = "Returned";
            else if (statusLower.includes("hold") || statusLower.includes("processing") || statusLower.includes("in_review")) fetchedStatus = "Processing";

            if (fetchedStatus !== item.status) {
              hasChanges = true;
              updatedOrders[i] = { ...item, status: fetchedStatus };

              await supabase
                .from("orders")
                .update({ status: fetchedStatus })
                .eq("id", item.id);
            }
          }
        } catch (err) {
          console.error("Auto sync error for ID:", item.tracking_code);
        }
      }
    }

    if (hasChanges) {
      setOrders([...updatedOrders]);
    }
  }

  const filteredOrders = orders.filter((item) => {
    // যদি নির্দিষ্ট তারিখ সিলেক্ট করা থাকে তবে শুধু সেই তারিখ চেক করবে, না থাকলে মাস চেক করবে
    const matchesDate = !selectedDate || item.order_date === selectedDate;
    const matchesMonth = selectedMonth === "all" || item.order_date?.startsWith(selectedMonth);
    
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      !searchQuery ||
      item.customer_name?.toLowerCase().includes(query) ||
      item.phone?.toLowerCase().includes(query) ||
      item.tracking_code?.toLowerCase().includes(query);

    return (selectedDate ? matchesDate : matchesMonth) && matchesSearch;
  });

  const totalOrdersCount = filteredOrders.length;
  const totalSalesSum = filteredOrders.reduce((acc, item) => acc + (Number(item.total_amount) || 0), 0);
  const totalCostSum = filteredOrders.reduce((acc, item) => acc + (Number(item.total_cost) || 0), 0);
  const totalProfitSum = filteredOrders.reduce((acc, item) => acc + (Number(item.profit) || 0), 0);

  function updateField(field: keyof Order, value: string) {
    setEditingOrder((current) => {
      if (!current) return null;

      const numberFields = [
        "qty",
        "total_amount",
        "advance_amount",
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

  async function createOrder() {
    setSaving(true);

    const productCost = Number(newOrder.product_cost) || 0;
    const delivery = Number(newOrder.delivery_charge) || 0;
    const boost = Number(newOrder.boost_cost) || 0;
    const totalAmount = Number(newOrder.total_amount) || 0;
    const advanceAmount = Number(newOrder.advance_amount) || 0;
    const totalCost = productCost + delivery + boost;
    const profit = totalAmount - totalCost;

    const insertData = {
      order_date: newOrder.order_date,
      customer_name: newOrder.customer_name,
      phone: newOrder.phone,
      address: newOrder.address,
      size: newOrder.size,
      qty: Number(newOrder.qty) || 1,
      total_amount: totalAmount,
      advance_amount: advanceAmount,
      product_cost: productCost,
      delivery_charge: delivery,
      boost_cost: boost,
      total_cost: totalCost,
      profit,
      status: newOrder.status,
      payment_status: newOrder.payment_status,
    };

    const { data, error } = await supabase
      .from("orders")
      .insert([insertData])
      .select()
      .single();

    setSaving(false);

    if (error) {
      alert(error.message);
      return;
    }

    setOrders((current) => [data as Order, ...current]);
    setIsCreating(false);
    
    setNewOrder({
      order_date: new Date().toISOString().split("T")[0],
      customer_name: "",
      phone: "",
      address: "",
      size: "11 Inch",
      qty: 1,
      total_amount: 0,
      advance_amount: 0,
      product_cost: 0,
      delivery_charge: 60,
      boost_cost: 0,
      status: "Processing",
      payment_status: "Unpaid",
    });

    alert("Order created successfully!");
  }

  async function updateOrder() {
    if (!editingOrder) return;

    setSaving(true);

    const productCost = Number(editingOrder.product_cost) || 0;
    const delivery = Number(editingOrder.delivery_charge) || 0;
    const boost = Number(editingOrder.boost_cost) || 0;
    const totalAmount = Number(editingOrder.total_amount) || 0;
    const advanceAmount = Number(editingOrder.advance_amount) || 0;
    const totalCost = productCost + delivery + boost;
    const profit = totalAmount - totalCost;

    const updateData = {
      customer_name: editingOrder.customer_name,
      phone: editingOrder.phone,
      address: editingOrder.address,
      order_date: editingOrder.order_date,
      size: editingOrder.size,
      qty: Number(editingOrder.qty) || 0,
      total_amount: totalAmount,
      advance_amount: advanceAmount,
      product_cost: productCost,
      delivery_charge: delivery,
      boost_cost: boost,
      total_cost: totalCost,
      profit,
      status: editingOrder.status || "Pending",
      payment_status: editingOrder.payment_status || "Unpaid",
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
        item.id === editingOrder.id ? (data as Order) : item
      )
    );

    setEditingOrder(null);
    setViewingOrder(data as Order);

    alert("Order updated successfully");
  }

  async function deleteOrder(id: number) {
    const confirmDelete = window.confirm("Are you sure you want to delete this order?");
    if (!confirmDelete) return;

    const { error } = await supabase.from("orders").delete().eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    setOrders((current) => current.filter((item) => item.id !== id));
    setViewingOrder(null);
    alert("Order deleted successfully");
  }

  async function handleAddOrUpdateTracking(item: Order, isEdit = false) {
    let trackingInput = item.tracking_code;

    if (!trackingInput || isEdit) {
      const promptInput = window.prompt("Enter Steadfast Tracking ID:", item.tracking_code || "");
      if (promptInput === null) return;
      trackingInput = promptInput.trim();
      if (!trackingInput) return;
    }

    try {
      const response = await fetch(`https://portal.packzy.com/api/v1/status_by_trackingcode/${trackingInput}`, {
        method: "GET",
        headers: {
          "Api-Key": "0ocu3vpovq1ymvdhtpuz0jys4uhzuga3",
          "Secret-Key": "kqx3xtby4mhsenzih2qwtci6",
          "Accept": "application/json",
        },
      });

      const data = await response.json();
      let fetchedStatus = item.status || "Pending";
      
      if (data && data.delivery_status) {
        const statusLower = data.delivery_status.toLowerCase();
        if (statusLower.includes("delivered")) fetchedStatus = "Delivered";
        else if (statusLower.includes("cancel")) fetchedStatus = "Cancelled";
        else if (statusLower.includes("return")) fetchedStatus = "Returned";
        else if (statusLower.includes("hold") || statusLower.includes("processing") || statusLower.includes("in_review")) fetchedStatus = "Processing";
      }

      const { error } = await supabase
        .from("orders")
        .update({ tracking_code: trackingInput, status: fetchedStatus })
        .eq("id", item.id);

      if (error) {
        alert("Failed to update database: " + error.message);
        return;
      }

      setOrders((current) =>
        current.map((o) => (o.id === item.id ? { ...o, tracking_code: trackingInput, status: fetchedStatus } : o))
      );

      alert(`Success! Status from Steadfast: ${data.delivery_status || fetchedStatus}`);
    } catch (err: any) {
      console.error(err);
      alert("API Error: " + err.message);
    }
  }

  function downloadInvoice(order: Order) {
    const doc = new jsPDF();

    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.setTextColor(30, 41, 59); 
    doc.text("Moto Charm BD", 14, 20); 

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139); 
    doc.text("Phone: 01519601483", 14, 26);
    doc.text("Address: Dhaka, Bangladesh", 14, 32);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(15, 23, 42);
    doc.text("INVOICE", 196, 20, { align: "right" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(`Invoice No: MCB-${order.id}`, 196, 26, { align: "right" });
    doc.text(`Date: ${order.order_date || "-"}`, 196, 32, { align: "right" });
    
    doc.setFont("helvetica", "bold");
    doc.setTextColor(order.payment_status === "Paid" ? 5 : 153, order.payment_status === "Paid" ? 150 : 27, 50);
    doc.text(`Payment: ${order.payment_status || "Unpaid"}`, 196, 38, { align: "right" });

    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.line(14, 42, 196, 42);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(30, 41, 59);
    doc.text("Billed To:", 14, 50);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(51, 65, 85);
    doc.text(`Name: ${order.customer_name || "-"}`, 14, 56);
    doc.text(`Phone: ${order.phone || "-"}`, 14, 62);
    doc.text(`Address: ${order.address || "-"}`, 14, 68);

    const qty = order.qty || 1;
    const totalAmount = Number(order.total_amount) || 0;
    const unitPrice = totalAmount / qty;
    const deliveryCharge = Number(order.delivery_charge) || 0;
    const grandTotal = totalAmount + deliveryCharge;

    autoTable(doc, {
      startY: 75,
      head: [['Item Description', 'Size', 'Qty', 'Unit Price', 'Total']],
      body: [
        [
          "Moto Charm Accessory / Product",
          order.size || "-",
          qty,
          `TK ${unitPrice.toFixed(2)}`,
          `TK ${totalAmount.toFixed(2)}`
        ],
      ],
      headStyles: { 
        fillColor: [30, 41, 59], 
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        halign: 'left'
      },
      bodyStyles: { textColor: [51, 65, 85] },
      columnStyles: {
        2: { halign: 'center' },
        3: { halign: 'right' },
        4: { halign: 'right' }
      },
      theme: 'striped',
    });

    const finalY = (doc as any).lastAutoTable.finalY + 10;
    const summaryX = 120;
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text("Subtotal:", summaryX, finalY);
    doc.text(`TK ${totalAmount.toFixed(2)}`, 196, finalY, { align: "right" });

    doc.text("Delivery Charge:", summaryX, finalY + 6);
    doc.text(`TK ${deliveryCharge.toFixed(2)}`, 196, finalY + 6, { align: "right" });

    let nextY = finalY + 12;
    doc.setDrawColor(203, 213, 225);
    doc.line(summaryX, nextY, 196, nextY);
    nextY += 6;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text("Total Amount:", summaryX, nextY);
    doc.text(`TK ${grandTotal.toFixed(2)}`, 196, nextY, { align: "right" });

    nextY += 10;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(51, 65, 85);
    doc.text(`Payment Status: ${order.payment_status || "Unpaid"}`, 14, nextY);

    doc.setFont("helvetica", "italic");
    doc.setFontSize(9);
    doc.setTextColor(148, 163, 184);
    doc.text("Thank you for shopping with Moto Charm BD!", 14, nextY + 12);

    doc.save(`Invoice_MCB_${order.id}.pdf`);
  }

  function statusClass(status: string) {
    switch (status) {
      case "Delivered": return "bg-green-100 text-green-700";
      case "Processing": return "bg-blue-100 text-blue-700";
      case "Cancelled": return "bg-red-100 text-red-700";
      case "Returned": return "bg-orange-100 text-orange-700";
      default: return "bg-yellow-100 text-yellow-700";
    }
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Order History</h1>
          <p className="mt-2 text-gray-500">View and manage all orders securely.</p>
        </div>
        <button
          type="button"
          onClick={() => setIsCreating(true)}
          className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white shadow hover:bg-blue-700 transition"
        >
          + Create New Order
        </button>
      </div>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={selectedMonth}
            onChange={(e) => {
              setSelectedMonth(e.target.value);
              setSelectedDate(""); // মাস বদলালে নির্দিষ্ট তারিখ রিসেট হবে
            }}
            className="rounded-lg border bg-white p-3 font-medium"
          >
            <option value="all">All Months</option>
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

          {/* নির্দিষ্ট তারিখ সিলেক্ট করার অপশন */}
          <div className="flex items-center gap-2 rounded-lg border bg-white p-2">
            <span className="text-xs font-semibold text-gray-500 pl-1">Date:</span>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent font-medium outline-none text-sm"
            />
            {selectedDate && (
              <button
                type="button"
                onClick={() => setSelectedDate("")}
                className="text-xs text-red-500 font-bold px-1 hover:underline"
                title="Clear date filter"
              >
                ✕
              </button>
            )}
          </div>

          <input
            type="text"
            placeholder="Search by name, phone, tracking..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-72 rounded-lg border bg-white p-3 font-medium"
          />
        </div>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="rounded-2xl bg-blue-600 p-6 text-white shadow">
          <p className="text-sm font-medium opacity-90">Total Orders</p>
          <h3 className="mt-2 text-3xl font-bold">{totalOrdersCount}</h3>
        </div>
        <div className="rounded-2xl bg-purple-600 p-6 text-white shadow">
          <p className="text-sm font-medium opacity-90">Total Sales</p>
          <h3 className="mt-2 text-3xl font-bold">৳{totalSalesSum.toLocaleString()}</h3>
        </div>
        <div className="rounded-2xl bg-red-600 p-6 text-white shadow">
          <p className="text-sm font-medium opacity-90">Total Cost</p>
          <h3 className="mt-2 text-3xl font-bold">৳{totalCostSum.toLocaleString()}</h3>
        </div>
        <div className="rounded-2xl bg-emerald-600 p-6 text-white shadow">
          <p className="text-sm font-medium opacity-90">Total Profit</p>
          <h3 className="mt-2 text-3xl font-bold">৳{totalProfitSum.toLocaleString()}</h3>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl bg-white shadow">
        <table className="w-full min-w-[1800px]">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3 text-left">Date</th>
              <th className="p-3 text-left">Customer</th>
              <th className="p-3 text-left">Phone</th>
              <th className="p-3 text-left">Address</th>
              <th className="p-3 text-left">Size</th>
              <th className="p-3 text-left">Qty</th>
              <th className="p-3 text-left">Amount</th>
              <th className="p-3 text-left">Advanced</th>
              <th className="p-3 text-left">Product Cost</th>
              <th className="p-3 text-left">Delivery</th>
              <th className="p-3 text-left">Boost</th>
              <th className="p-3 text-left">Total Cost</th>
              <th className="p-3 text-left">Profit</th>
              <th className="p-3 text-left">Status</th>
              <th className="p-3 text-left">Steadfast Courier</th>
              <th className="p-3 text-center">Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.map((item) => (
              <tr key={item.id} className="border-b hover:bg-gray-50">
                <td className="p-3">{item.order_date || "-"}</td>
                <td className="p-3">{item.customer_name || "-"}</td>
                <td className="p-3">{item.phone || "-"}</td>
                <td className="p-3">{item.address || "-"}</td>
                <td className="p-3">{item.size || "-"}</td>
                <td className="p-3">{item.qty || 0}</td>
                <td className="p-3">৳{Number(item.total_amount || 0).toLocaleString()}</td>
                <td className="p-3 text-green-600 font-semibold">৳{Number(item.advance_amount || 0).toLocaleString()}</td>
                <td className="p-3">৳{Number(item.product_cost || 0).toLocaleString()}</td>
                <td className="p-3">৳{Number(item.delivery_charge || 0).toLocaleString()}</td>
                <td className="p-3">৳{Number(item.boost_cost || 0).toLocaleString()}</td>
                <td className="p-3">৳{Number(item.total_cost || 0).toLocaleString()}</td>
                <td className="p-3 font-semibold text-green-600">৳{Number(item.profit || 0).toLocaleString()}</td>
                <td className="p-3">
                  <span className={`inline-block rounded-lg px-3 py-1.5 font-semibold ${statusClass(item.status || "Pending")}`}>
                    {item.status || "Pending"}
                  </span>
                </td>
                <td className="p-3">
                  {item.tracking_code ? (
                    <div className="flex items-center gap-2">
                      <span className="rounded bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-700">
                        {item.tracking_code}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleAddOrUpdateTracking(item, true)}
                        className="text-[10px] text-blue-500 hover:underline"
                      >
                        Edit
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleAddOrUpdateTracking(item)}
                      className="rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-600 hover:bg-indigo-100"
                    >
                      + Add Tracking
                    </button>
                  )}
                </td>
                <td className="p-3 text-center">
                  <button
                    type="button"
                    onClick={() => setViewingOrder(item)}
                    className="inline-flex items-center justify-center rounded-lg bg-gray-100 p-2 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition"
                    title="View Details"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isCreating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold">Create New Order</h2>
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="text-3xl text-gray-500 hover:text-black"
              >
                ×
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-700">Customer Name</label>
                <input
                  value={newOrder.customer_name}
                  onChange={(e) => setNewOrder({ ...newOrder, customer_name: e.target.value })}
                  className="w-full rounded-lg border p-3"
                  placeholder="Customer name"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-700">Phone</label>
                <input
                  value={newOrder.phone}
                  onChange={(e) => setNewOrder({ ...newOrder, phone: e.target.value })}
                  className="w-full rounded-lg border p-3"
                  placeholder="Phone number"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-700">Address</label>
                <input
                  value={newOrder.address}
                  onChange={(e) => setNewOrder({ ...newOrder, address: e.target.value })}
                  className="w-full rounded-lg border p-3"
                  placeholder="Delivery address"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-700">Order Date</label>
                <input
                  type="date"
                  value={newOrder.order_date}
                  onChange={(e) => setNewOrder({ ...newOrder, order_date: e.target.value })}
                  className="w-full rounded-lg border p-3"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-700">Size</label>
                <select
                  value={newOrder.size}
                  onChange={(e) => setNewOrder({ ...newOrder, size: e.target.value })}
                  className="w-full rounded-lg border p-3"
                >
                  <option value="11 Inch">11 Inch</option>
                  <option value="15 Inch">15 Inch</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-700">Quantity (Qty)</label>
                <input
                  type="number"
                  value={newOrder.qty}
                  onChange={(e) => setNewOrder({ ...newOrder, qty: Number(e.target.value) })}
                  className="w-full rounded-lg border p-3"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-700">Total Amount (৳)</label>
                <input
                  type="number"
                  value={newOrder.total_amount}
                  onChange={(e) => setNewOrder({ ...newOrder, total_amount: Number(e.target.value) })}
                  className="w-full rounded-lg border p-3"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-700">Advanced Paid (৳)</label>
                <input
                  type="number"
                  value={newOrder.advance_amount}
                  onChange={(e) => setNewOrder({ ...newOrder, advance_amount: Number(e.target.value) })}
                  className="w-full rounded-lg border p-3"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-700">Product Cost (৳)</label>
                <input
                  type="number"
                  value={newOrder.product_cost}
                  onChange={(e) => setNewOrder({ ...newOrder, product_cost: Number(e.target.value) })}
                  className="w-full rounded-lg border p-3"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-700">Delivery Charge (৳)</label>
                <input
                  type="number"
                  value={newOrder.delivery_charge}
                  onChange={(e) => setNewOrder({ ...newOrder, delivery_charge: Number(e.target.value) })}
                  className="w-full rounded-lg border p-3"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-700">Boost Cost (৳)</label>
                <input
                  type="number"
                  value={newOrder.boost_cost}
                  onChange={(e) => setNewOrder({ ...newOrder, boost_cost: Number(e.target.value) })}
                  className="w-full rounded-lg border p-3"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="rounded-lg border px-5 py-3"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={createOrder}
                disabled={saving}
                className="rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? "Creating..." : "Save Order"}
              </button>
            </div>
          </div>
        </div>
      )}

      {viewingOrder && !editingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between border-b pb-3">
              <h2 className="text-xl font-bold">Order Details</h2>
              <button
                type="button"
                onClick={() => setViewingOrder(null)}
                className="text-2xl text-gray-500 hover:text-black"
              >
                ×
              </button>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between border-b pb-2"><span className="text-gray-500">Date:</span> <span className="font-medium">{viewingOrder.order_date}</span></div>
              <div className="flex justify-between border-b pb-2"><span className="text-gray-500">Customer Name:</span> <span className="font-medium">{viewingOrder.customer_name}</span></div>
              <div className="flex justify-between border-b pb-2"><span className="text-gray-500">Phone:</span> <span className="font-medium">{viewingOrder.phone}</span></div>
              <div className="flex justify-between border-b pb-2"><span className="text-gray-500">Address:</span> <span className="font-medium">{viewingOrder.address}</span></div>
              <div className="flex justify-between border-b pb-2"><span className="text-gray-500">Size & Qty:</span> <span className="font-medium">{viewingOrder.size} ({viewingOrder.qty})</span></div>
              <div className="flex justify-between border-b pb-2"><span className="text-gray-500">Total Amount:</span> <span className="font-medium">৳{viewingOrder.total_amount}</span></div>
              <div className="flex justify-between border-b pb-2"><span className="text-gray-500">Advanced Paid:</span> <span className="font-medium text-green-600">৳{viewingOrder.advance_amount}</span></div>
              <div className="flex justify-between border-b pb-2"><span className="text-gray-500">Product Cost:</span> <span className="font-medium">৳{viewingOrder.product_cost}</span></div>
              <div className="flex justify-between border-b pb-2"><span className="text-gray-500">Delivery Charge:</span> <span className="font-medium">৳{viewingOrder.delivery_charge}</span></div>
              <div className="flex justify-between border-b pb-2"><span className="text-gray-500">Boost Cost:</span> <span className="font-medium">৳{viewingOrder.boost_cost}</span></div>
              <div className="flex justify-between border-b pb-2"><span className="text-gray-500">Total Cost:</span> <span className="font-medium">৳{viewingOrder.total_cost}</span></div>
              <div className="flex justify-between border-b pb-2"><span className="text-gray-500">Profit:</span> <span className="font-semibold text-green-600">৳{viewingOrder.profit}</span></div>
              <div className="flex justify-between pb-2"><span className="text-gray-500">Status:</span> <span className="font-semibold">{viewingOrder.status}</span></div>
            </div>

            <div className="mt-6 flex justify-between items-center border-t pt-4">
              <button
                type="button"
                onClick={() => downloadInvoice(viewingOrder)}
                className="rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800"
              >
                Download Invoice PDF
              </button>
              
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => deleteOrder(viewingOrder.id)}
                  className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
                >
                  Delete
                </button>
                <button
                  type="button"
                  onClick={() => setEditingOrder({ ...viewingOrder })}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  Edit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {editingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold">Edit Order</h2>
              <button
                type="button"
                onClick={() => setEditingOrder(null)}
                className="text-3xl text-gray-500 hover:text-black"
              >
                ×
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-700">Customer Name</label>
                <input
                  value={editingOrder.customer_name}
                  onChange={(e) => updateField("customer_name", e.target.value)}
                  className="w-full rounded-lg border p-3"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-700">Phone</label>
                <input
                  value={editingOrder.phone}
                  onChange={(e) => updateField("phone", e.target.value)}
                  className="w-full rounded-lg border p-3"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-700">Address</label>
                <input
                  value={editingOrder.address}
                  onChange={(e) => updateField("address", e.target.value)}
                  className="w-full rounded-lg border p-3"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-700">Order Date</label>
                <input
                  type="date"
                  value={editingOrder.order_date || ""}
                  onChange={(e) => updateField("order_date", e.target.value)}
                  className="w-full rounded-lg border p-3"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-700">Size</label>
                <select
                  value={editingOrder.size}
                  onChange={(e) => updateField("size", e.target.value)}
                  className="w-full rounded-lg border p-3"
                >
                  <option value="11 Inch">11 Inch</option>
                  <option value="15 Inch">15 Inch</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-700">Quantity (Qty)</label>
                <input
                  type="number"
                  value={editingOrder.qty}
                  onChange={(e) => updateField("qty", e.target.value)}
                  className="w-full rounded-lg border p-3"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-700">Total Amount (৳)</label>
                <input
                  type="number"
                  value={editingOrder.total_amount}
                  onChange={(e) => updateField("total_amount", e.target.value)}
                  className="w-full rounded-lg border p-3"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-700">Advanced Paid (৳)</label>
                <input
                  type="number"
                  value={editingOrder.advance_amount}
                  onChange={(e) => updateField("advance_amount", e.target.value)}
                  className="w-full rounded-lg border p-3"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-700">Product Cost (৳)</label>
                <input
                  type="number"
                  value={editingOrder.product_cost}
                  onChange={(e) => updateField("product_cost", e.target.value)}
                  className="w-full rounded-lg border p-3"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-700">Delivery Charge (৳)</label>
                <input
                  type="number"
                  value={editingOrder.delivery_charge}
                  onChange={(e) => updateField("delivery_charge", e.target.value)}
                  className="w-full rounded-lg border p-3"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-700">Boost Cost (৳)</label>
                <input
                  type="number"
                  value={editingOrder.boost_cost}
                  onChange={(e) => updateField("boost_cost", e.target.value)}
                  className="w-full rounded-lg border p-3"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setEditingOrder(null)}
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
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}