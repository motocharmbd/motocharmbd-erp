"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type FraudResult = {
  reports?: any[];
  data?: any;
  summary?: {
    total_parcel?: number;
    success_parcel?: number;
    cancelled_parcel?: number;
  };
};

const motoCharmHeader = (
  <div className="moto-charm-header" aria-label="Moto Charm BD">
    <span>Moto Charm BD</span>
  </div>
);

export default function OrdersPage() {
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  const [size, setSize] = useState("11 Inch");
  const [qty, setQty] = useState("1");

  const [totalAmount, setTotalAmount] = useState("");
  const [deliveryCharge, setDeliveryCharge] = useState("60");
  const [boostCost, setBoostCost] = useState("0");
  const [advancedPaid, setAdvancedPaid] = useState("0");

  // Fraud
  const [fraudLoading, setFraudLoading] = useState(false);
  const [fraudResult, setFraudResult] = useState<FraudResult | null>(null);
  const [fraudError, setFraudError] = useState("");

  // -----------------------------
  // PRODUCT COST
  // -----------------------------
  const quantity = Number(qty) || 0;

  const productCost =
    size === "11 Inch"
      ? quantity * 150
      : quantity * 180;

  // -----------------------------
  // AUTO TOTAL DUE
  // -----------------------------
  const calculatedTotal =
    productCost +
    (Number(deliveryCharge) || 0);

  const finalDue =
    calculatedTotal - (Number(advancedPaid) || 0);

  // -----------------------------
  // AUTO FRAUD CHECK
  // -----------------------------
  useEffect(() => {
    const cleanPhone = phone.replace(/\D/g, "");

    if (cleanPhone.length !== 11) {
      setFraudResult(null);
      setFraudError("");
      return;
    }

    let cancelled = false;

    const timer = setTimeout(async () => {
      setFraudLoading(true);
      setFraudError("");
      setFraudResult(null);

      try {
        const response = await fetch("/api/fraud-check", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            phoneNumber: cleanPhone,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data?.message || "Fraud check failed"
          );
        }

        if (!cancelled) {
          setFraudResult(data);
        }
      } catch (error: any) {
        if (!cancelled) {
          console.error(error);
          setFraudError(
            error?.message || "Unable to check fraud status"
          );
        }
      } finally {
        if (!cancelled) {
          setFraudLoading(false);
        }
      }
    }, 500);

    return () => {

      <style jsx>{`
        .moto-charm-header {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          padding: 8px 0 12px;
          overflow: hidden;
        }
      
        .moto-charm-header span {
          display: inline-block;
          font-size: 18px;
          font-weight: 900;
          letter-spacing: 0.08em;
          color: #0f172a;
          animation: motoCharmPulse 2.2s ease-in-out infinite;
          transform-origin: center;
        }
      
        @keyframes motoCharmPulse {
          0%, 100% {
            opacity: 0.72;
            transform: translateY(0) scale(1);
            letter-spacing: 0.08em;
          }
          50% {
            opacity: 1;
            transform: translateY(-2px) scale(1.04);
            letter-spacing: 0.12em;
          }
        }
      `}</style>
      {motoCharmHeader}
      cancelled = true;
      clearTimeout(timer);
    };
  }, [phone]);

  // -----------------------------
  // EXTRACT FRAUD DATA
  // -----------------------------
  const responseData =
    fraudResult?.data || fraudResult;

  const courierData =
    responseData?.data || responseData;

  const summary =
    courierData?.summary ||
    fraudResult?.summary;

  const reports =
    fraudResult?.reports ||
    responseData?.reports ||
    courierData?.reports ||
    [];

  // -----------------------------
  // SAVE ORDER
  // -----------------------------
  async function saveOrder() {
    if (
      !customerName ||
      !phone ||
      !address ||
      !size ||
      !qty
    ) {
      alert("Please fill all required fields");
      return;
    }

    const cleanPhone = phone.replace(/\D/g, "");

    if (cleanPhone.length !== 11) {
      alert("Enter a valid 11 digit phone number");
      return;
    }

    const delivery = Number(deliveryCharge) || 0;
    const boost = Number(boostCost) || 0;
    const advance = Number(advancedPaid) || 0;

    const totalCost =
      productCost +
      delivery +
      boost;

    const profit =
      finalDue - totalCost;

    const { error } = await supabase
      .from("orders")
      .insert([
        {
          customer_name: customerName,
          phone: cleanPhone,
          address,

          order_date:
            new Date()
              .toISOString()
              .split("T")[0],

          size,
          qty: quantity,

          total_amount: finalDue,

          product_cost: productCost,
          delivery_charge: delivery,
          boost_cost: boost,

          total_cost: totalCost,
          profit,

          status: "Pending",
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
    setSize("11 Inch");
    setQty("1");
    setTotalAmount("");
    setDeliveryCharge("60");
    setBoostCost("0");
    setAdvancedPaid("0");

    setFraudResult(null);
    setFraudError("");
  }

  return (
    <div className="min-h-screen bg-slate-50/70">
      <div className="mx-auto w-full max-w-6xl px-4 py-6 md:px-6">

        {/* PAGE HEADER */}
        <div className="mb-5 flex items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
              <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
                Order Management
              </span>
            </div>

            <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900">
              Create Order
            </h1>

            <p className="mt-0.5 text-sm text-slate-500">
              Enter customer details and verify delivery risk before saving.
            </p>
          </div>

          <div className="hidden rounded-xl border border-slate-200 bg-white px-4 py-2 text-right shadow-sm sm:block">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              COD Amount
            </p>
            <p className="text-lg font-extrabold text-emerald-600">
              ৳{finalDue.toLocaleString()}
            </p>
          </div>
        </div>

        {/* MAIN CARD */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_8px_30px_rgba(15,23,42,0.06)]">

          {/* CARD TOP */}
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <div>
              <h2 className="text-sm font-extrabold text-slate-800">
                Customer & Order Details
              </h2>
              <p className="mt-0.5 text-xs text-slate-400">
                Required information for this order
              </p>
            </div>

            <span className="rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-700">
              New Order
            </span>
          </div>

          <div className="p-5">

            {/* FORM */}
            <div className="grid grid-cols-1 gap-x-6 gap-y-4 md:grid-cols-2">

              {/* CUSTOMER */}
              <div>
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-slate-600">
                  Customer Name
                </label>
                <input
                  type="text"
                  placeholder="Enter customer name"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-medium text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />
              </div>

              {/* PHONE */}
              <div>
                <label className="mb-1.5 flex items-center justify-between text-[11px] font-bold uppercase tracking-wide text-slate-600">
                  <span>Phone Number</span>
                  <span className="font-medium normal-case tracking-normal text-slate-400">
                    11 digits = auto check
                  </span>
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="017XXXXXXXX"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-semibold tracking-wide text-slate-800 outline-none transition placeholder:font-medium placeholder:tracking-normal placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />
              </div>

              {/* ADDRESS */}
              <div>
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-slate-600">
                  Delivery Address
                </label>
                <input
                  type="text"
                  placeholder="Enter delivery address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-medium text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />
              </div>

              {/* SIZE */}
              <div>
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-slate-600">
                  Product Size
                </label>
                <select
                  value={size}
                  onChange={(e) => setSize(e.target.value)}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-semibold text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                >
                  <option value="11 Inch">11 Inch — ৳150</option>
                  <option value="15 Inch">15 Inch — ৳180</option>
                </select>
              </div>

              {/* QTY */}
              <div>
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-slate-600">
                  Quantity
                </label>
                <input
                  type="number"
                  min="1"
                  value={qty}
                  onChange={(e) => setQty(e.target.value)}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-semibold text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />
              </div>

              {/* ADVANCE */}
              <div>
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-slate-600">
                  Advanced Paid (৳)
                </label>
                <input
                  type="number"
                  min="0"
                  value={advancedPaid}
                  onChange={(e) => setAdvancedPaid(e.target.value)}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-semibold text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />
              </div>

              {/* DELIVERY */}
              <div>
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-slate-600">
                  Delivery Charge (৳)
                </label>
                <input
                  type="number"
                  min="0"
                  value={deliveryCharge}
                  onChange={(e) => setDeliveryCharge(e.target.value)}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-semibold text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />
              </div>

              {/* BOOST */}
              <div>
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-slate-600">
                  Boost Cost (৳)
                </label>
                <input
                  type="number"
                  min="0"
                  value={boostCost}
                  onChange={(e) => setBoostCost(e.target.value)}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-semibold text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />
              </div>
            </div>

            {/* ORDER SUMMARY */}
            <div className="mt-5 overflow-hidden rounded-xl border border-slate-200 bg-slate-50/80">
              <div className="grid grid-cols-2 divide-x divide-slate-200 md:grid-cols-4">
                <div className="px-4 py-3">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                    Product
                  </p>
                  <p className="mt-1 text-sm font-bold text-slate-800">
                    ৳{productCost.toLocaleString()}
                  </p>
                </div>

                <div className="px-4 py-3">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                    Delivery
                  </p>
                  <p className="mt-1 text-sm font-bold text-slate-800">
                    ৳{Number(deliveryCharge || 0).toLocaleString()}
                  </p>
                </div>

                <div className="px-4 py-3">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                    Advance
                  </p>
                  <p className="mt-1 text-sm font-bold text-slate-800">
                    ৳{Number(advancedPaid || 0).toLocaleString()}
                  </p>
                </div>

                <div className="border-t border-slate-200 bg-emerald-50 px-4 py-3 md:border-t-0">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-emerald-600">
                    Total Due / COD
                  </p>
                  <p className="mt-1 text-lg font-extrabold text-emerald-600">
                    ৳{finalDue.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            {/* FRAUD / RISK */}
            {phone.replace(/\D/g, "").length === 11 && (
              <div className="mt-4">
                {fraudLoading && (
                  <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
                      <span className="text-sm font-semibold text-slate-600">
                        Checking customer risk...
                      </span>
                    </div>
                    <span className="text-[11px] font-medium text-slate-400">
                      Courier network
                    </span>
                  </div>
                )}

                {fraudError && !fraudLoading && (
                  <div className="flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                    <div>
                      <p className="text-sm font-bold text-amber-700">
                        Risk check unavailable
                      </p>
                      <p className="mt-0.5 text-xs text-amber-600">
                        {fraudError}
                      </p>
                    </div>
                    <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-bold text-amber-700">
                      API ERROR
                    </span>
                  </div>
                )}

                {fraudResult && !fraudLoading && !fraudError && (
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-stretch">

                    {reports.length > 0 ? (
                      <div className="flex-1 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-100 text-sm font-black text-red-600">
                            !
                          </div>
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="text-sm font-extrabold text-red-700">
                                FRAUD REPORT FOUND
                              </h3>
                              <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-700">
                                {reports.length} REPORT{reports.length > 1 ? "S" : ""}
                              </span>
                            </div>

                            <div className="mt-1 space-y-0.5">
                              {reports.slice(0, 2).map((report: any, index: number) => (
                                <p key={index} className="truncate text-xs text-red-600">
                                  <span className="font-semibold">
                                    {report.courierName || report.name || "Unknown Courier"}:
                                  </span>{" "}
                                  {report.details || report.reason || "Fraud reported"}
                                </p>
                              ))}
                              {reports.length > 2 && (
                                <p className="text-[11px] font-semibold text-red-500">
                                  +{reports.length - 2} more report(s)
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex-1 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-black text-emerald-600">
                            ✓
                          </div>
                          <div>
                            <h3 className="text-sm font-extrabold text-emerald-700">
                              NO FRAUD REPORT
                            </h3>
                            <p className="mt-0.5 text-xs text-emerald-600">
                              No reported fraud or scam record found.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {summary && (
                      <div className="flex shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-white">
                        <div className="min-w-[78px] px-3 py-2 text-center">
                          <p className="text-[9px] font-bold uppercase tracking-wide text-slate-400">
                            Orders
                          </p>
                          <p className="mt-0.5 text-lg font-black text-slate-800">
                            {summary.total_parcel ?? 0}
                          </p>
                        </div>

                        <div className="min-w-[78px] border-l border-slate-100 bg-emerald-50/50 px-3 py-2 text-center">
                          <p className="text-[9px] font-bold uppercase tracking-wide text-emerald-600">
                            Success
                          </p>
                          <p className="mt-0.5 text-lg font-black text-emerald-600">
                            {summary.success_parcel ?? 0}
                          </p>
                        </div>

                        <div className="min-w-[78px] border-l border-slate-100 bg-red-50/50 px-3 py-2 text-center">
                          <p className="text-[9px] font-bold uppercase tracking-wide text-red-500">
                            Cancelled
                          </p>
                          <p className="mt-0.5 text-lg font-black text-red-500">
                            {summary.cancelled_parcel ?? 0}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* FOOTER / SAVE */}
            <div className="mt-5 flex flex-col-reverse items-stretch justify-between gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center">
              <p className="text-xs text-slate-400">
                Order will be saved with <span className="font-semibold text-slate-600">Pending</span> status.
              </p>

              <button
                onClick={saveOrder}
                className="inline-flex h-11 items-center justify-center rounded-xl bg-emerald-600 px-7 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700 hover:shadow-md active:scale-[0.99]"
              >
                Save Order
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
