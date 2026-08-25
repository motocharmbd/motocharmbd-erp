"use client";

import { useEffect, useMemo, useState } from "react";

type RowType = "Order Courier" | "Cash Fund Total" | "Products Buy";

type LedgerRow = {
  id: string;
  date: string;
  type: RowType;
  totalAmount: number;
  personalCost: number;
  deliveryCharge: number;
  productsCost: number;
  boostCost: number;
  employeeSalary: number;
};

const emptyRow = (date: string): LedgerRow => ({
  id: crypto.randomUUID(),
  date,
  type: "Order Courier",
  totalAmount: 0,
  personalCost: 0,
  deliveryCharge: 0,
  productsCost: 0,
  boostCost: 0,
  employeeSalary: 0,
});

const money = (value: number) => `৳${Number(value || 0).toLocaleString()}`;

export default function AccountingPage() {
  const today = new Date().toISOString().slice(0, 10);
  const [rows, setRows] = useState<LedgerRow[]>([]);
  const [draft, setDraft] = useState<LedgerRow>(() => emptyRow(today));
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("motocharm-accounting-ledger");
      if (saved) setRows(JSON.parse(saved));
    } catch {
      setRows([]);
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (loaded) localStorage.setItem("motocharm-accounting-ledger", JSON.stringify(rows));
  }, [rows, loaded]);

  const draftProfit = useMemo(
    () => draft.totalAmount - draft.personalCost - draft.deliveryCharge - draft.productsCost - draft.boostCost - draft.employeeSalary,
    [draft]
  );

  const totals = useMemo(() => {
    return rows.reduce(
      (a, r) => ({
        totalAmount: a.totalAmount + r.totalAmount,
        personalCost: a.personalCost + r.personalCost,
        deliveryCharge: a.deliveryCharge + r.deliveryCharge,
        productsCost: a.productsCost + r.productsCost,
        boostCost: a.boostCost + r.boostCost,
        employeeSalary: a.employeeSalary + r.employeeSalary,
        profit: a.profit + (r.totalAmount - r.personalCost - r.deliveryCharge - r.productsCost - r.boostCost - r.employeeSalary),
      }),
      { totalAmount: 0, personalCost: 0, deliveryCharge: 0, productsCost: 0, boostCost: 0, employeeSalary: 0, profit: 0 }
    );
  }, [rows]);

  function updateDraft(key: keyof LedgerRow, value: string | number) {
    setDraft((p) => ({ ...p, [key]: key === "date" || key === "type" ? value : Number(value) || 0 } as LedgerRow));
  }

  function addRow() {
    setRows((p) => [...p, { ...draft, id: crypto.randomUUID() }]);
    setDraft(emptyRow(draft.date || today));
  }

  function removeRow(id: string) {
    setRows((p) => p.filter((r) => r.id !== id));
  }

  function clearAll() {
    if (confirm("সব হিসাব মুছে ফেলবেন?")) setRows([]);
  }

  return (
    <main className="min-h-screen bg-[#f4f7f4] p-4 md:p-6 text-gray-900">
      <div className="mx-auto max-w-[1500px]">
        <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-2xl font-black">Manual Accounting</h1>
            <p className="text-sm text-gray-500">Total selling amount থেকে সব cost বাদ দিয়ে Profit automatic হিসাব হবে।</p>
          </div>
          <button onClick={clearAll} className="w-fit rounded-lg bg-red-50 px-4 py-2 text-sm font-bold text-red-600 hover:bg-red-100">Clear All</button>
        </div>

        <section className="mb-5 overflow-hidden rounded-xl border border-gray-300 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1200px] border-collapse text-sm">
              <thead>
                <tr className="bg-red-600 text-white">
                  {[
                    "Date",
                    "Order / Courier",
                    "Total Amount",
                    "Personal Cost",
                    "Delivery Charge",
                    "Products Cost",
                    "Boost Cost",
                    "Employee Salary",
                    "Profit",
                    "Action",
                  ].map((h) => <th key={h} className="border-r border-red-400 px-3 py-2 text-left font-black">{h}</th>)}
                </tr>
              </thead>
              <tbody>
                <tr className="bg-green-50">
                  <td className="border p-2"><input type="date" value={draft.date} onChange={(e) => updateDraft("date", e.target.value)} className="w-full rounded border px-2 py-1.5" /></td>
                  <td className="border p-2"><select value={draft.type} onChange={(e) => updateDraft("type", e.target.value)} className="w-full rounded border px-2 py-1.5 bg-white"><option>Order Courier</option><option>Cash Fund Total</option><option>Products Buy</option></select></td>
                  {(["totalAmount", "personalCost", "deliveryCharge", "productsCost", "boostCost", "employeeSalary"] as const).map((key) => (
                    <td key={key} className="border p-2"><input type="number" min="0" value={draft[key]} onChange={(e) => updateDraft(key, e.target.value)} className="w-full rounded border px-2 py-1.5" /></td>
                  ))}
                  <td className={`border p-2 text-right font-black ${draftProfit >= 0 ? "text-green-700" : "text-red-600"}`}>{money(draftProfit)}</td>
                  <td className="border p-2"><button onClick={addRow} className="rounded bg-green-600 px-4 py-2 font-black text-white hover:bg-green-700">Add</button></td>
                </tr>

                {rows.map((r, index) => {
                  const profit = r.totalAmount - r.personalCost - r.deliveryCharge - r.productsCost - r.boostCost - r.employeeSalary;
                  return (
                    <tr key={r.id} className={index % 2 ? "bg-white" : "bg-green-50/40"}>
                      <td className="border px-3 py-2 font-bold">{r.date}</td>
                      <td className="border px-3 py-2 font-bold">{r.type}</td>
                      <td className="border px-3 py-2 text-right font-bold">{money(r.totalAmount)}</td>
                      <td className="border px-3 py-2 text-right">{money(r.personalCost)}</td>
                      <td className="border px-3 py-2 text-right">{money(r.deliveryCharge)}</td>
                      <td className="border px-3 py-2 text-right">{money(r.productsCost)}</td>
                      <td className="border px-3 py-2 text-right">{money(r.boostCost)}</td>
                      <td className="border px-3 py-2 text-right">{money(r.employeeSalary)}</td>
                      <td className={`border px-3 py-2 text-right font-black ${profit >= 0 ? "text-green-700" : "text-red-600"}`}>{money(profit)}</td>
                      <td className="border px-3 py-2 text-center"><button onClick={() => removeRow(r.id)} className="font-bold text-red-600 hover:underline">Delete</button></td>
                    </tr>
                  );
                })}

                <tr className="bg-green-600 font-black text-white">
                  <td className="border px-3 py-3" colSpan={2}>TOTAL</td>
                  <td className="border px-3 py-3 text-right">{money(totals.totalAmount)}</td>
                  <td className="border px-3 py-3 text-right">{money(totals.personalCost)}</td>
                  <td className="border px-3 py-3 text-right">{money(totals.deliveryCharge)}</td>
                  <td className="border px-3 py-3 text-right">{money(totals.productsCost)}</td>
                  <td className="border px-3 py-3 text-right">{money(totals.boostCost)}</td>
                  <td className="border px-3 py-3 text-right">{money(totals.employeeSalary)}</td>
                  <td className="border px-3 py-3 text-right">{money(totals.profit)}</td>
                  <td className="border px-3 py-3"></td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <div className="rounded-xl bg-white p-4 shadow-sm border-l-4 border-green-600"><p className="text-xs font-bold text-gray-500">Total Sale</p><p className="text-2xl font-black">{money(totals.totalAmount)}</p></div>
          <div className="rounded-xl bg-white p-4 shadow-sm border-l-4 border-red-500"><p className="text-xs font-bold text-gray-500">Total Cost</p><p className="text-2xl font-black">{money(totals.personalCost + totals.deliveryCharge + totals.productsCost + totals.boostCost + totals.employeeSalary)}</p></div>
          <div className="rounded-xl bg-white p-4 shadow-sm border-l-4 border-blue-600"><p className="text-xs font-bold text-gray-500">Delivery Charge</p><p className="text-2xl font-black">{money(totals.deliveryCharge)}</p></div>
          <div className="rounded-xl bg-green-600 p-4 text-white shadow-sm"><p className="text-xs font-bold text-green-100">Remaining / Profit</p><p className="text-2xl font-black">{money(totals.profit)}</p></div>
        </section>
      </div>
    </main>
  );
}
