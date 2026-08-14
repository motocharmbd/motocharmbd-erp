"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

function n(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
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

function downloadCSV(csv: string) {
  const blob = new Blob(["\uFEFF" + csv], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `Moto_Charm_BD_All_Orders_${new Date().toISOString().slice(0, 10)}.csv`;
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

  function exportAll() {
    setExporting(true);
    try {
      downloadCSV(buildCSV(orders));
    } finally {
      setTimeout(() => setExporting(false), 500);
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-2xl rounded-2xl bg-white p-8 shadow-xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Export All Orders</h1>
          <p className="mt-2 text-gray-500">
            Export your complete order history to a CSV file compatible with Excel and Google Sheets.
          </p>
        </div>

        {loading ? (
          <div className="rounded-xl bg-gray-50 p-6 text-center text-gray-500">
            Loading all orders...
          </div>
        ) : error ? (
          <div className="rounded-xl bg-red-50 p-6 text-red-700">
            Failed to load orders: {error}
          </div>
        ) : (
          <>
            <div className="mb-6 grid grid-cols-2 gap-4">
              <div className="rounded-xl bg-blue-50 p-5">
                <p className="text-sm font-medium text-blue-700">Total Orders</p>
                <p className="mt-1 text-3xl font-bold text-blue-900">{orders.length}</p>
              </div>
              <div className="rounded-xl bg-emerald-50 p-5">
                <p className="text-sm font-medium text-emerald-700">Export Format</p>
                <p className="mt-1 text-2xl font-bold text-emerald-900">CSV / Sheet</p>
              </div>
            </div>

            <button
              type="button"
              onClick={exportAll}
              disabled={orders.length === 0 || exporting}
              className="w-full rounded-xl bg-emerald-600 px-6 py-4 text-lg font-bold text-white shadow transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {exporting ? "Preparing Sheet..." : `Export All ${orders.length} Orders`}
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
