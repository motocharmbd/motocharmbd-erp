"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [cashIns, setCashIns] = useState<any[]>([]);
  const [expenseName, setExpenseName] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Product Cost");
  const [note, setNote] = useState("");
  const todayStr = new Date().toISOString().split("T")[0];
  const [expenseDate, setExpenseDate] = useState(todayStr);
  const [cashInAmount, setCashInAmount] = useState("");
  const [cashInDate, setCashInDate] = useState(todayStr);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingCashId, setEditingCashId] = useState<number | null>(null);
  const currentMonthStr = todayStr.substring(0, 7);
  const [selectedMonth, setSelectedMonth] = useState(currentMonthStr);

  async function loadData() {
    const { data: expData } = await supabase.from("expenses").select("*").order("expense_date", { ascending: false });
    const { data: cashData } = await supabase.from("daily_cash").select("*").order("date", { ascending: false });
    setExpenses(expData || []);
    setCashIns(cashData || []);
  }

  async function saveExpense() {
    if (!expenseName || !amount) return alert("Please fill mandatory fields");
    
    if (editingId) {
      await supabase.from("expenses").update({ expense_name: expenseName, amount: Number(amount), category, note, expense_date: expenseDate }).eq("id", editingId);
      setEditingId(null);
    } else {
      await supabase.from("expenses").insert([{ expense_name: expenseName, amount: Number(amount), category, note, expense_date: expenseDate }]);
    }
    setExpenseName(""); setAmount(""); setNote(""); setExpenseDate(todayStr);
    loadData();
  }

  async function saveCashIn() {
    if (!cashInAmount) return alert("Please enter cash-in amount");
    
    if (editingCashId) {
      await supabase.from("daily_cash").update({ amount: Number(cashInAmount), date: cashInDate }).eq("id", editingCashId);
      setEditingCashId(null);
    } else {
      await supabase.from("daily_cash").insert([{ amount: Number(cashInAmount), date: cashInDate }]);
    }
    setCashInAmount(""); setCashInDate(todayStr);
    loadData();
  }

  useEffect(() => { loadData(); }, []);

  const filteredExpenses = expenses.filter(item => item.expense_date?.startsWith(selectedMonth));
  const filteredCashIns = cashIns.filter(item => item.date?.startsWith(selectedMonth));

  const totalExpense = filteredExpenses.reduce((acc, item) => acc + Number(item.amount), 0);
  const totalCashIn = filteredCashIns.reduce((acc, item) => acc + Number(item.amount), 0);
  const netProfit = totalCashIn - totalExpense;

  const totals = filteredExpenses.reduce((acc, item) => {
    acc[item.category] = (acc[item.category] || 0) + Number(item.amount);
    return acc;
  }, {} as any);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 p-4 md:p-8 font-sans">
      <div className="max-w-6xl mx-auto">
        
        {/* Header & Filter */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-gray-900">Expense & Profit Accounting</h1>
            <p className="text-sm font-medium text-gray-600">Professional ledger, cost & profit management</p>
          </div>
          <input type="month" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm font-bold shadow-sm outline-none focus:border-blue-600" />
        </div>

        {/* Summary Boxes */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white p-4 border-b-4 border-green-600 shadow-sm rounded-xl">
            <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Total Cash In</p>
            <p className="text-xl font-black mt-1 text-green-600">৳{totalCashIn.toLocaleString()}</p>
          </div>
          {["Product Cost", "Boost Cost", "General Expense"].map(cat => (
            <div key={cat} className="bg-white p-4 border-b-4 border-blue-600 shadow-sm rounded-xl">
              <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">{cat}</p>
              <p className="text-xl font-black mt-1 text-gray-900">৳{(totals[cat] || 0).toLocaleString()}</p>
            </div>
          ))}
          <div className="bg-blue-600 p-4 shadow-sm rounded-xl text-white col-span-2 md:col-span-1">
            <p className="text-[11px] font-bold text-blue-100 uppercase tracking-wider">Net Profit</p>
            <p className="text-xl font-black mt-1">৳{netProfit.toLocaleString()}</p>
          </div>
        </div>

        {/* Forms Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          
          {/* Cash In Form */}
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
            <h2 className="text-xs font-extrabold uppercase text-gray-700 mb-3 tracking-wider">
              {editingCashId ? "Edit Cash In Entry" : "Add Daily Cash In (Income)"}
            </h2>
            <div className="grid grid-cols-1 gap-2.5">
              <input type="number" value={cashInAmount} onChange={(e) => setCashInAmount(e.target.value)} placeholder="Cash In Amount" className="border border-gray-300 px-3.5 py-2 rounded-lg text-sm font-semibold w-full outline-none focus:border-green-600" />
              <input type="date" value={cashInDate} onChange={(e) => setCashInDate(e.target.value)} className="border border-gray-300 px-3.5 py-2 rounded-lg text-sm font-semibold w-full outline-none focus:border-green-600" />
              <button onClick={saveCashIn} className="bg-green-600 text-white font-bold py-2 rounded-lg hover:bg-green-700 transition shadow-sm text-sm">
                {editingCashId ? "Update Cash In" : "Save Cash In"}
              </button>
            </div>
          </div>

          {/* Expense Form */}
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
            <h2 className="text-xs font-extrabold uppercase text-gray-700 mb-3 tracking-wider">
              {editingId ? "Edit Expense Entry" : "Add New Expense Entry"}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <input value={expenseName} onChange={(e) => setExpenseName(e.target.value)} placeholder="Description" className="border border-gray-300 px-3.5 py-2 rounded-lg text-sm font-semibold w-full outline-none focus:border-blue-600" />
              <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Amount" className="border border-gray-300 px-3.5 py-2 rounded-lg text-sm font-semibold w-full outline-none focus:border-blue-600" />
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="border border-gray-300 px-3.5 py-2 rounded-lg text-sm font-semibold w-full outline-none focus:border-blue-600 bg-white">
                <option>Product Cost</option><option>Boost Cost</option><option>General Expense</option>
              </select>
              <input type="date" value={expenseDate} onChange={(e) => setExpenseDate(e.target.value)} className="border border-gray-300 px-3.5 py-2 rounded-lg text-sm font-semibold w-full outline-none focus:border-blue-600" />
              <button onClick={saveExpense} className="bg-blue-600 text-white font-bold py-2 rounded-lg hover:bg-blue-700 transition shadow-sm text-sm sm:col-span-2">
                {editingId ? "Update Expense" : "Save Expense"}
              </button>
            </div>
          </div>

        </div>

        {/* Tables Container with Fixed Height & Scroll */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Cash In Records Table */}
          <div className="bg-white shadow-sm border border-gray-200 rounded-xl overflow-hidden flex flex-col h-[340px]">
            <div className="bg-gray-100 px-4 py-2.5 border-b border-gray-200 flex-shrink-0">
              <h3 className="font-black text-xs uppercase tracking-wider text-green-700">Cash In History</h3>
            </div>
            <div className="overflow-y-auto flex-grow">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
                  <tr className="text-left text-gray-900 font-black uppercase text-[11px] tracking-wider">
                    <th className="p-3">Date</th>
                    <th className="p-3 text-right">Amount</th>
                    <th className="p-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredCashIns.map((item, index) => (
                    <tr key={item.id} className={`${index % 2 === 0 ? 'bg-emerald-50/60' : 'bg-white'}`}>
                      <td className="p-3 font-black text-gray-900 text-xs">{item.date}</td>
                      <td className="p-3 text-right font-black text-green-600 text-sm">৳{Number(item.amount).toLocaleString()}</td>
                      <td className="p-3 text-center">
                        <button onClick={() => { setEditingCashId(item.id); setCashInAmount(item.amount); setCashInDate(item.date); }} className="font-bold text-blue-600 hover:underline mr-2 text-xs">Edit</button>
                        <button onClick={async () => { await supabase.from("daily_cash").delete().eq("id", item.id); loadData(); }} className="font-bold text-red-600 hover:underline text-xs">Delete</button>
                      </td>
                    </tr>
                  ))}
                  {filteredCashIns.length === 0 && (
                    <tr><td colSpan={3} className="p-6 text-center text-gray-400 text-xs font-semibold">No records found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Expenses Data Table */}
          <div className="bg-white shadow-sm border border-gray-200 rounded-xl overflow-hidden flex flex-col h-[340px]">
            <div className="bg-gray-100 px-4 py-2.5 border-b border-gray-200 flex-shrink-0">
              <h3 className="font-black text-xs uppercase tracking-wider text-gray-700">Expense Records</h3>
            </div>
            <div className="overflow-y-auto flex-grow">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
                  <tr className="text-left text-gray-900 font-black uppercase text-[11px] tracking-wider">
                    <th className="p-3">Date</th>
                    <th className="p-3">Description</th>
                    <th className="p-3">Category</th>
                    <th className="p-3 text-right">Amount</th>
                    <th className="p-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredExpenses.map((item, index) => (
                    <tr key={item.id} className={`${index % 2 === 0 ? 'bg-emerald-50/60' : 'bg-white'}`}>
                      <td className="p-3 font-black text-gray-900 text-xs">{item.expense_date}</td>
                      <td className="p-3 font-black text-gray-900 text-xs">{item.expense_name}</td>
                      <td className="p-3">
                        <span className="font-bold text-[10px] bg-gray-100 text-gray-800 px-2 py-0.5 rounded border border-gray-300">
                          {item.category}
                        </span>
                      </td>
                      <td className="p-3 text-right font-black text-rose-600 text-sm">৳{Number(item.amount).toLocaleString()}</td>
                      <td className="p-3 text-center">
                        <button onClick={() => { setEditingId(item.id); setExpenseName(item.expense_name); setAmount(item.amount); setCategory(item.category); setExpenseDate(item.expense_date); }} className="font-bold text-blue-600 hover:underline mr-2 text-xs">Edit</button>
                        <button onClick={async () => { await supabase.from("expenses").delete().eq("id", item.id); loadData(); }} className="font-bold text-red-600 hover:underline text-xs">Delete</button>
                      </td>
                    </tr>
                  ))}
                  {filteredExpenses.length === 0 && (
                    <tr><td colSpan={5} className="p-6 text-center text-gray-400 text-xs font-semibold">No records found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}