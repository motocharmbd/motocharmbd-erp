"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Order = {
  id: string | number;
  customer_name?: string;
  phone?: string;
  address?: string;
  order_date?: string;
  size?: string;
  qty?: number;
  total_amount?: number;
  product_cost?: number;
  delivery_charge?: number;
  boost_cost?: number;
  total_cost?: number;
  profit?: number;
  status?: string;
};

const formatInvoiceId = (id: string | number) => {
  const strId = String(id);
  const shortId = strId.slice(0, 6).toUpperCase();
  return `MCB-${shortId}`;
};

export default function OrderDetailsPage() {
  const params = useParams();
  const router = useRouter();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params?.id) {
      loadOrder(String(params.id));
    }
  }, [params?.id]);

  async function loadOrder(id: string) {
    setLoading(true);

    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error(error);
      setOrder(null);
    } else {
      setOrder(data);
    }

    setLoading(false);
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="bg-white rounded-2xl shadow-sm border p-8 text-center">
          <p className="text-gray-500">Loading order...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="p-6">
        <div className="bg-white rounded-2xl shadow-sm border p-8 text-center">
          <h2 className="text-xl font-bold text-red-600">
            Order Not Found
          </h2>

          <button
            onClick={() => router.back()}
            className="mt-4 bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Order Details
          </h1>

          <p className="text-gray-500 mt-1">
            {formatInvoiceId(order.id)}
          </p>
        </div>

        <button
          onClick={() => router.back()}
          className="bg-gray-800 text-white px-5 py-2 rounded-lg hover:bg-gray-900"
        >
          ← Back
        </button>
      </div>

      {/* Invoice */}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Invoice Header */}
        <div className="bg-gray-900 text-white p-6">
          <div className="flex flex-col md:flex-row justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold">
                Moto Charm BD
              </h2>
              <img src="moto-charm-logo.jpg" alt="logo" />

              <p className="text-gray-300 mt-1">
                Customer Order Invoice
              </p>
            </div>

            <div className="md:text-right">
              <p className="text-gray-300 text-sm">
                Invoice ID
              </p>

              <p className="text-xl font-bold">
                {formatInvoiceId(order.id)}
              </p>

              <p className="text-gray-300 text-sm mt-1">
                {order.order_date || "N/A"}
              </p>
            </div>
          </div>
        </div>

        {/* Customer Information */}
        <div className="p-6 border-b">
          <h3 className="text-lg font-bold text-gray-800 mb-4">
            Customer Information
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-500">
                Customer Name
              </p>

              <p className="font-semibold text-gray-800">
                {order.customer_name || "N/A"}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500">
                Phone
              </p>

              <p className="font-semibold text-gray-800">
                {order.phone || "N/A"}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500">
                Address
              </p>

              <p className="font-semibold text-gray-800">
                {order.address || "N/A"}
              </p>
            </div>
          </div>
        </div>

        {/* Order Information */}
        <div className="p-6 border-b">
          <h3 className="text-lg font-bold text-gray-800 mb-4">
            Order Information
          </h3>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-sm text-gray-500">
                Size
              </p>

              <p className="font-bold text-gray-800">
                {order.size || "N/A"}
              </p>
            </div>

            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-sm text-gray-500">
                Quantity
              </p>

              <p className="font-bold text-gray-800">
                {order.qty ?? 0}
              </p>
            </div>

            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-sm text-gray-500">
                Status
              </p>

              <p className="font-bold text-blue-600">
                {order.status || "Pending"}
              </p>
            </div>

            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-sm text-gray-500">
                Order Date
              </p>

              <p className="font-bold text-gray-800">
                {order.order_date || "N/A"}
              </p>
            </div>
          </div>
        </div>

        {/* Cost Summary */}
        <div className="p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">
            Payment & Cost Summary
          </h3>

          <div className="space-y-3">
            <div className="flex justify-between border-b pb-3">
              <span className="text-gray-600">
                Total Amount
              </span>

              <span className="font-bold text-purple-600">
                ৳{Number(order.total_amount || 0).toLocaleString()}
              </span>
            </div>

            <div className="flex justify-between border-b pb-3">
              <span className="text-gray-600">
                Product Cost
              </span>

              <span className="font-semibold">
                ৳{Number(order.product_cost || 0).toLocaleString()}
              </span>
            </div>

            <div className="flex justify-between border-b pb-3">
              <span className="text-gray-600">
                Delivery Charge
              </span>

              <span className="font-semibold">
                ৳{Number(order.delivery_charge || 0).toLocaleString()}
              </span>
            </div>

            <div className="flex justify-between border-b pb-3">
              <span className="text-gray-600">
                Boost Cost
              </span>

              <span className="font-semibold">
                ৳{Number(order.boost_cost || 0).toLocaleString()}
              </span>
            </div>

            <div className="flex justify-between border-b pb-3">
              <span className="text-gray-600">
                Total Cost
              </span>

              <span className="font-bold text-red-600">
                ৳{Number(order.total_cost || 0).toLocaleString()}
              </span>
            </div>

            <div className="flex justify-between pt-2">
              <span className="text-lg font-bold text-gray-800">
                Profit
              </span>

              <span className="text-xl font-bold text-green-600">
                ৳{Number(order.profit || 0).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}