"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

function n(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function todayLocal() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

type Order = {
  id: number;
  order_date?: string;
  customer_name?: string;
  phone?: string;
  address?: string;
  size?: string;
  qty?: number;
  total_amount?: number;
  advance_amount?: number;
  product_cost?: number;
  delivery_charge?: number;
  boost_cost?: number;
  status?: string;
  payment_status?: string;
  tracking_code?: string;
};

function escapeCSV(value: unknown) {
  const text = value === null || value === undefined ? "" : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

function buildCSV(orders: Order[]) {
  const headers = [
    "Invoice No",
    "Order ID",
    "Date",
    "Customer Name",
    "Phone",
    "Address",
    "Size",
    "Quantity",
    "Total Amount",
    "Advance Amount",
    "Product Cost",
    "Delivery Charge",
    "Boost Cost",
    "Total Cost",
    "Profit",
    "Status",
    "Payment Status",
    "Steadfast Tracking Code",
  ];

  const rows = orders.map((item) => {
    const productCost = n(item.product_cost);
    const delivery = n(item.delivery_charge);
    const boost = n(item.boost_cost);
    const totalAmount = n(item.total_amount);
    const totalCost = productCost + delivery + boost;
    const profit = totalAmount - totalCost;

    return [
      `MCB-${String(item.id).slice(0, 6).toUpperCase()}`,
      item.id,
      item.order_date || "",
      item.customer_name || "",
      item.phone || "",
      item.address || "",
      item.size || "",
      n(item.qty),
      totalAmount,
      n(item.advance_amount),
      productCost,
      delivery,
      boost,
      totalCost,
      profit,
      item.status || "Pending",
      item.payment_status || "Unpaid",
      item.tracking_code || "",
    ];
  });

  return [headers, ...rows]
    .map((row) => row.map(escapeCSV).join(","))
    .join("\r\n");
}

function downloadCSV(csv: string, fileName: string) {
  const blob = new Blob(["\uFEFF" + csv], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export default function ExportOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState("");
  const [selectedDate, setSelectedDate] = useState(todayLocal());
  const [exportAllDates, setExportAllDates] = useState(false);

  useEffect(() => {
    async function loadOrders() {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .order("id", { ascending: false });

      if (error) {
        setError(error.message);
      } else {
        setOrders((data || []) as Order[]);
      }
      setLoading(false);
    }

    loadOrders();
  }, []);

  const filteredOrders = useMemo(() => {
    if (exportAllDates) return orders;
    return orders.filter((order) => order.order_date === selectedDate);
  }, [orders, selectedDate, exportAllDates]);

  const totals = useMemo(() => {
    const sales = filteredOrders.reduce((sum, order) => sum + n(order.total_amount), 0);
    const cost = filteredOrders.reduce(
      (sum, order) =>
        sum + n(order.product_cost) + n(order.delivery_charge) + n(order.boost_cost),
      0
    );
    return {
      sales,
      cost,
      profit: sales - cost,
    };
  }, [filteredOrders]);

  function exportSelected() {
    if (filteredOrders.length === 0) return;

    setExporting(true);
    try {
      const csv = buildCSV(filteredOrders);
      const suffix = exportAllDates ? "All_Dates" : selectedDate;
      downloadCSV(csv, `Moto_Charm_BD_Orders_${suffix}.csv`);
    } finally {
      setTimeout(() => setExporting(false), 500);
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-3xl rounded-2xl bg-white p-8 shadow-xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Export Orders</h1>
          <p className="mt-2 text-gray-500">
            Select a date and export only that day&apos;s orders to Excel / Google Sheets.
          </p>
        </div>

        {loading ? (
          <div className="rounded-xl bg-gray-50 p-6 text-center text-gray-500">
            Loading orders...
          </div>
        ) : error ? (
          <div className="rounded-xl bg-red-50 p-6 text-red-700">
            Failed to load orders: {error}
          </div>
        ) : (
          <>
            <div className="mb-6 rounded-2xl border border-gray-200 bg-gray-50 p-5">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex-1 min-w-[240px]">
                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    Export Date
                  </label>
                  <input
                    type="date"
                    value={selectedDate}
                    disabled={exportAllDates}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full rounded-xl border bg-white p-3 font-semibold outline-none focus:border-emerald-500 disabled:bg-gray-200"
                  />
                </div>

                <label className="mt-7 flex cursor-pointer items-center gap-2 rounded-xl border bg-white px-4 py-3 font-semibold text-gray-700">
                  <input
                    type="checkbox"
                    checked={exportAllDates}
                    onChange={(e) => setExportAllDates(e.target.checked)}
                    className="h-4 w-4"
                  />
                  Export All Dates
                </label>
              </div>

              {!exportAllDates && (
                <p className="mt-3 text-sm text-gray-500">
                  Example: select <strong>14</strong> and only orders created on that date will be exported.
                </p>
              )}
            </div>

            <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-4">
              <div className="rounded-xl bg-blue-50 p-5">
                <p className="text-sm font-medium text-blue-700">Orders</p>
                <p className="mt-1 text-3xl font-bold text-blue-900">{filteredOrders.length}</p>
              </div>
              <div className="rounded-xl bg-purple-50 p-5">
                <p className="text-sm font-medium text-purple-700">Sales</p>
                <p className="mt-1 text-2xl font-bold text-purple-900">৳{totals.sales.toLocaleString()}</p>
              </div>
              <div className="rounded-xl bg-red-50 p-5">
                <p className="text-sm font-medium text-red-700">Cost</p>
                <p className="mt-1 text-2xl font-bold text-red-900">৳{totals.cost.toLocaleString()}</p>
              </div>
              <div className="rounded-xl bg-emerald-50 p-5">
                <p className="text-sm font-medium text-emerald-700">Profit</p>
                <p className="mt-1 text-2xl font-bold text-emerald-900">৳{totals.profit.toLocaleString()}</p>
              </div>
            </div>

            <button
              type="button"
              onClick={exportSelected}
              disabled={filteredOrders.length === 0 || exporting}
              className="w-full rounded-xl bg-emerald-600 px-6 py-4 text-lg font-bold text-white shadow transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {exporting
                ? "Preparing Sheet..."
                : filteredOrders.length === 0
                  ? "No Orders for Selected Date"
                  : exportAllDates
                    ? `Export All ${filteredOrders.length} Orders`
                    : `Export ${filteredOrders.length} Orders for ${selectedDate}`}
            </button>

            <p className="mt-4 text-center text-xs text-gray-400">
              Includes sales, advance, product cost, delivery, boost, total cost, profit, status and tracking information.
            </p>
          </>
        )}
      </div>
    </main>
  );
}
