"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type FraudResult = {
  reports?: any[];
  data?: any;
  summary?: { total_parcel?: number; success_parcel?: number; cancelled_parcel?: number };
};

const motoCharmHeader = (
  <div className="moto-charm-header" aria-label="Moto Charm BD"><span>Moto Charm BD</span></div>
);

const getTodayDhaka = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Dhaka" }).format(new Date());

export default function OrdersPage() {
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [orderDate, setOrderDate] = useState(getTodayDhaka());
  const [size, setSize] = useState("11 Inch");
  const [qty, setQty] = useState("1");
  const [productPrice, setProductPrice] = useState("");
  const [productCostInput, setProductCostInput] = useState("");
  const [giftBox, setGiftBox] = useState(false);
  const [confirmedBy, setConfirmedBy] = useState("");
  const [deliveryCharge, setDeliveryCharge] = useState("60");
  const [boostCost, setBoostCost] = useState("0");
  const [advancedPaid, setAdvancedPaid] = useState("0");
  const [fraudLoading, setFraudLoading] = useState(false);
  const [fraudResult, setFraudResult] = useState<FraudResult | null>(null);
  const [fraudError, setFraudError] = useState("");
  const [previousOrders, setPreviousOrders] = useState<any[]>([]);
  const [previousOrdersLoading, setPreviousOrdersLoading] = useState(false);

  const quantity = Number(qty) || 0;
  const sellingAmount = Number(productPrice) || 0;
  const productCost = Number(productCostInput) || 0;
  const delivery = Number(deliveryCharge) || 0;
  const boost = Number(boostCost) || 0;
  const advance = Number(advancedPaid) || 0;

  const totalCost = productCost + delivery + boost;
  const finalDue = Math.max(0, sellingAmount - advance);
  const profit = sellingAmount - totalCost;

  useEffect(() => {
    const cleanPhone = phone.replace(/\D/g, "");
    if (cleanPhone.length !== 11) {
      setPreviousOrders([]);
      setPreviousOrdersLoading(false);
      return;
    }
    let cancelled = false;
    const timer = setTimeout(async () => {
      setPreviousOrdersLoading(true);
      const { data, error } = await supabase
        .from("orders")
        .select("id, customer_name, phone, order_date, size, qty, total_amount, status")
        .eq("phone", cleanPhone)
        .order("order_date", { ascending: false })
        .limit(10);
      if (!cancelled) {
        setPreviousOrders(error ? [] : data || []);
        setPreviousOrdersLoading(false);
      }
    }, 300);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [phone]);

  useEffect(() => {
    const cleanPhone = phone.replace(/\D/g, "");
    if (cleanPhone.length !== 11) {
      setFraudResult(null); setFraudError(""); return;
    }
    let cancelled = false;
    const timer = setTimeout(async () => {
      setFraudLoading(true); setFraudError(""); setFraudResult(null);
      try {
        const response = await fetch("/api/fraud-check", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phoneNumber: cleanPhone }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data?.message || data?.error || "Fraud check failed");
        if (!cancelled) setFraudResult(data);
      } catch (error: any) {
        if (!cancelled) { console.error(error); setFraudError(error?.message || "Unable to check fraud status"); }
      } finally { if (!cancelled) setFraudLoading(false); }
    }, 500);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [phone]);

  const responseData = fraudResult?.data || fraudResult;
  const courierData = responseData?.data || responseData;
  const summary = courierData?.summary || fraudResult?.summary;
  const reports = fraudResult?.reports || responseData?.reports || courierData?.reports || [];
  const totalParcels = Number(summary?.total_parcel) || 0;
  const successParcels = Number(summary?.success_parcel) || 0;
  const successRate = totalParcels > 0 ? Math.round((successParcels / totalParcels) * 100) : null;
  const successRateClass = successRate === null ? "" : successRate >= 80 ? "text-emerald-600 bg-emerald-50 border-emerald-200" : successRate >= 50 ? "text-amber-600 bg-amber-50 border-amber-200" : "text-red-600 bg-red-50 border-red-200";

  async function saveOrder() {
    if (!customerName || !phone || !address || !orderDate || !size || !qty || !productPrice) {
      alert("Please fill all required fields"); return;
    }
    const cleanPhone = phone.replace(/\D/g, "");
    if (cleanPhone.length !== 11) { alert("Enter a valid 11 digit phone number"); return; }

    const { data: savedOrder, error } = await supabase.from("orders").insert([{
      customer_name: customerName,
      phone: cleanPhone,
      address,
      order_date: orderDate,
      size,
      qty: quantity,
      total_amount: sellingAmount,
      product_cost: productCost,
      delivery_charge: delivery,
      boost_cost: boost,
      total_cost: totalCost,
      profit,
      status: "Pending",
    }]).select("id").single();
    if (error) { alert(error.message); return; }

    if (savedOrder?.id && confirmedBy) {
      try {
        const saved = localStorage.getItem("mcb_order_confirmed_by");
        const assignments = saved ? JSON.parse(saved) : {};
        assignments[String(savedOrder.id)] = confirmedBy;
        localStorage.setItem("mcb_order_confirmed_by", JSON.stringify(assignments));
      } catch (error) {
        console.error("Failed to save confirmation assignment", error);
      }
    }

    alert("Order Saved Successfully");
    setCustomerName(""); setPhone(""); setAddress(""); setOrderDate(getTodayDhaka()); setSize("11 Inch"); setQty("1"); setProductPrice(""); setProductCostInput(""); setGiftBox(false); setConfirmedBy(""); setDeliveryCharge("60"); setBoostCost("0"); setAdvancedPaid("0"); setFraudResult(null); setFraudError(""); setPreviousOrders([]);
  }

  return (
    <div className="min-h-screen bg-slate-50/70">
      <style jsx>{` .moto-charm-header{display:flex;align-items:center;justify-content:center;width:100%;padding:8px 0 12px;overflow:hidden}.moto-charm-header span{display:inline-block;font-size:18px;font-weight:900;letter-spacing:.08em;color:#0f172a;animation:motoCharmPulse 2.2s ease-in-out infinite;transform-origin:center}@keyframes motoCharmPulse{0%,100%{opacity:.72;transform:translateY(0) scale(1);letter-spacing:.08em}50%{opacity:1;transform:translateY(-2px) scale(1.04);letter-spacing:.12em}}`}</style>
      <div className="mx-auto w-full max-w-6xl px-4 py-6 md:px-6">
        {motoCharmHeader}
        <div className="mb-5 flex items-center justify-between gap-4">
          <div><div className="flex items-center gap-2"><div className="h-2.5 w-2.5 rounded-full bg-emerald-500"/><span className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">Order Management</span></div><h1 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900">Create Order</h1><p className="mt-0.5 text-sm text-slate-500">Enter customer details and verify delivery risk before saving.</p></div>
          <div className="hidden rounded-xl border border-slate-200 bg-white px-4 py-2 text-right shadow-sm sm:block"><p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">COD Amount</p><p className="text-lg font-extrabold text-emerald-600">৳{finalDue.toLocaleString()}</p></div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_8px_30px_rgba(15,23,42,0.06)]">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4"><div><h2 className="text-sm font-extrabold text-slate-800">Customer & Order Details</h2><p className="mt-0.5 text-xs text-slate-400">Required information for this order</p></div><span className="rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-700">New Order</span></div>
          <div className="p-5">
            <div className="grid grid-cols-1 gap-x-6 gap-y-4 md:grid-cols-2">
              <div><label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-slate-600">Customer Name</label><input type="text" placeholder="Enter customer name" value={customerName} onChange={e=>setCustomerName(e.target.value)} className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-medium text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"/></div>
              <div><label className="mb-1.5 flex items-center justify-between text-[11px] font-bold uppercase tracking-wide text-slate-600"><span>Phone Number</span><span className="font-medium normal-case tracking-normal text-slate-400">11 digits = auto check</span></label><div className="relative"><input type="text" inputMode="numeric" placeholder="017XXXXXXXX" value={phone} onChange={e=>setPhone(e.target.value)} className={`h-11 w-full rounded-xl border bg-white px-3.5 pr-16 text-sm font-semibold tracking-wide text-slate-800 outline-none transition placeholder:font-medium placeholder:tracking-normal placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 ${successRate!==null?(successRate>=80?"border-emerald-300":successRate>=50?"border-amber-300":"border-red-300"):"border-slate-200"}`}/>{successRate!==null&&!fraudLoading&&!fraudError&&<span className={`absolute right-2 top-1/2 -translate-y-1/2 rounded-full border px-2.5 py-1 text-xs font-black ${successRateClass}`}>{successRate}%</span>}</div></div>
              <div><label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-slate-600">Delivery Address</label><input type="text" placeholder="Enter delivery address" value={address} onChange={e=>setAddress(e.target.value)} className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-medium text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"/></div>
              <div><label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-slate-600">Order Date</label><input type="date" value={orderDate} onChange={e=>setOrderDate(e.target.value)} className="h-11 w-full rounded-xl border border-blue-200 bg-blue-50/30 px-3.5 text-sm font-semibold text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"/></div>
              <div><label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-slate-600">Order Confirmed By</label><select value={confirmedBy} onChange={e=>setConfirmedBy(e.target.value)} className="h-11 w-full rounded-xl border border-blue-200 bg-blue-50/30 px-3.5 text-sm font-semibold text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"><option value="">Select Name</option><option value="Sakin">Sakin</option></select></div>
              <div><label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-slate-600">Product Size</label><select value={size} onChange={e=>setSize(e.target.value)} className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-semibold text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"><option value="11 Inch">11 Inch</option><option value="15 Inch">15 Inch</option></select></div>
              <div><label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-slate-600">Total Amount / Selling Price (৳)</label><input type="number" min="0" value={productPrice} onChange={e=>setProductPrice(e.target.value)} placeholder="Enter customer selling price" className="h-11 w-full rounded-xl border border-emerald-200 bg-emerald-50/30 px-3.5 text-sm font-semibold text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"/></div>
              <div><label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-slate-600">Product Cost (৳)</label><input type="number" min="0" value={productCostInput} onChange={e=>setProductCostInput(e.target.value)} placeholder="Enter product cost" className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-semibold text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"/></div>
              <div><label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-slate-600">Quantity</label><input type="number" min="1" value={qty} onChange={e=>setQty(e.target.value)} className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-semibold text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"/></div>
              <div><label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-slate-600">Gift Box</label><label className="flex h-11 cursor-pointer items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-3.5"><input type="checkbox" checked={giftBox} onChange={e=>setGiftBox(e.target.checked)} className="h-4 w-4 accent-amber-500"/><span className="text-sm font-bold text-amber-800">Yes</span></label></div>
              <div><label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-slate-600">Delivery Charge (৳)</label><input type="number" min="0" value={deliveryCharge} onChange={e=>setDeliveryCharge(e.target.value)} className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-semibold text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"/></div>
              <div><label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-slate-600">Boost Cost (৳)</label><input type="number" min="0" value={boostCost} onChange={e=>setBoostCost(e.target.value)} className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-semibold text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"/></div>
              <div><label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-slate-600">Advanced Paid (৳)</label><input type="number" min="0" value={advancedPaid} onChange={e=>setAdvancedPaid(e.target.value)} className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-semibold text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"/></div>
            </div>

            <div className="mt-5 overflow-hidden rounded-xl border border-slate-200 bg-slate-50/80"><div className="grid grid-cols-2 divide-x divide-slate-200 md:grid-cols-5">
              <div className="px-4 py-3"><p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Selling Price</p><p className="mt-1 text-sm font-bold text-slate-800">৳{sellingAmount.toLocaleString()}</p></div>
              <div className="px-4 py-3"><p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Total Cost</p><p className="mt-1 text-sm font-bold text-slate-800">৳{totalCost.toLocaleString()}</p></div>
              <div className="px-4 py-3"><p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Advance</p><p className="mt-1 text-sm font-bold text-slate-800">৳{advance.toLocaleString()}</p></div>
              <div className="px-4 py-3"><p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Profit</p><p className={`mt-1 text-sm font-extrabold ${profit>=0?"text-emerald-600":"text-red-600"}`}>৳{profit.toLocaleString()}</p></div>
              <div className="border-t border-slate-200 bg-emerald-50 px-4 py-3 md:border-t-0"><p className="text-[10px] font-bold uppercase tracking-wide text-emerald-600">COD</p><p className="mt-1 text-lg font-extrabold text-emerald-600">৳{finalDue.toLocaleString()}</p></div>
            </div></div>

            {previousOrdersLoading && <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-700">Checking previous orders for this number...</div>}
            {!previousOrdersLoading && previousOrders.length > 0 && <div className="mt-4 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3"><div className="flex items-center justify-between gap-3"><div><h3 className="text-sm font-extrabold text-indigo-700">PREVIOUS ORDER FOUND</h3><p className="mt-0.5 text-xs text-indigo-600">This phone number has {previousOrders.length} previous order{previousOrders.length>1?"s":""} with Moto Charm BD.</p></div><span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-black text-indigo-700">{previousOrders.length} ORDER{previousOrders.length>1?"S":""}</span></div><div className="mt-3 overflow-x-auto"><table className="w-full min-w-[560px] text-xs"><thead><tr className="border-b border-indigo-200 text-left text-indigo-500"><th className="px-2 py-2">Date</th><th className="px-2 py-2">Customer</th><th className="px-2 py-2">Size</th><th className="px-2 py-2">Qty</th><th className="px-2 py-2">Amount</th><th className="px-2 py-2">Status</th></tr></thead><tbody>{previousOrders.map((order:any)=><tr key={order.id} className="border-b border-indigo-100 last:border-0"><td className="px-2 py-2 font-semibold text-slate-700">{order.order_date || "-"}</td><td className="px-2 py-2 text-slate-700">{order.customer_name || "-"}</td><td className="px-2 py-2 text-slate-700">{order.size || "-"}</td><td className="px-2 py-2 text-slate-700">{order.qty || 0}</td><td className="px-2 py-2 font-bold text-slate-800">৳{Number(order.total_amount||0).toLocaleString()}</td><td className="px-2 py-2"><span className="rounded-full bg-white px-2 py-1 font-bold text-slate-600">{order.status || "-"}</span></td></tr>)}</tbody></table></div></div>}

            {phone.replace(/\D/g, "").length === 11 && <div className="mt-4">
              {fraudLoading && <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3"><div className="flex items-center gap-3"><div className="h-4 w-4 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent"/><span className="text-sm font-semibold text-slate-600">Checking customer risk...</span></div><span className="text-[11px] font-medium text-slate-400">3 courier networks</span></div>}
              {fraudError&&!fraudLoading&&<div className="flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50 px-4 py-3"><div><p className="text-sm font-bold text-amber-700">Risk check unavailable</p><p className="mt-0.5 text-xs text-amber-600">{fraudError}</p></div><span className="rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-bold text-amber-700">API ERROR</span></div>}
              {fraudResult&&!fraudLoading&&!fraudError&&<div className="flex flex-col gap-3 lg:flex-row lg:items-stretch">{reports.length>0?<div className="flex-1 rounded-xl border border-red-200 bg-red-50 px-4 py-3"><div className="flex items-center gap-3"><div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-100 text-sm font-black text-red-600">!</div><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h3 className="text-sm font-extrabold text-red-700">FRAUD REPORT FOUND</h3><span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-700">{reports.length} REPORT{reports.length>1?"S":""}</span></div><div className="mt-1 space-y-0.5">{reports.slice(0,2).map((report:any,index:number)=><p key={index} className="truncate text-xs text-red-600"><span className="font-semibold">{report.courierName||report.name||"Unknown Courier"}:</span>{" "}{report.details||report.reason||"Fraud reported"}</p>)}{reports.length>2&&<p className="text-[11px] font-semibold text-red-500">+{reports.length-2} more report(s)</p>}</div></div></div></div>:<div className="flex-1 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3"><div className="flex items-center gap-3"><div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-black text-emerald-600">✓</div><div><h3 className="text-sm font-extrabold text-emerald-700">NO FRAUD REPORT</h3><p className="mt-0.5 text-xs text-emerald-600">No reported fraud or scam record found.</p></div></div></div>}{summary&&<div className="flex shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-white"><div className="min-w-[78px] px-3 py-2 text-center"><p className="text-[9px] font-bold uppercase tracking-wide text-slate-400">Orders</p><p className="mt-0.5 text-lg font-black text-slate-800">{summary.total_parcel??0}</p></div><div className="min-w-[78px] border-l border-slate-100 bg-emerald-50/50 px-3 py-2 text-center"><p className="text-[9px] font-bold uppercase tracking-wide text-emerald-600">Success</p><p className="mt-0.5 text-lg font-black text-emerald-600">{summary.success_parcel??0}</p></div><div className="min-w-[78px] border-l border-slate-100 bg-red-50/50 px-3 py-2 text-center"><p className="text-[9px] font-bold uppercase tracking-wide text-red-500">Cancelled</p><p className="mt-0.5 text-lg font-black text-red-500">{summary.cancelled_parcel??0}</p></div></div>}</div>}
            </div>}

            <div className="mt-5 flex flex-col-reverse items-stretch justify-between gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center"><p className="text-xs text-slate-400">Order will be saved with <span className="font-semibold text-slate-600">Pending</span> status.</p><button onClick={saveOrder} className="inline-flex h-11 items-center justify-center rounded-xl bg-emerald-600 px-7 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700 hover:shadow-md active:scale-[0.99]">Save Order</button></div>
          </div>
        </div>
      </div>
    </div>
  );
}
