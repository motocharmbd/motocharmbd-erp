"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<any[]>([]);

  const [expenseName, setExpenseName] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");

  async function loadExpenses() {
    const { data } = await supabase
      .from("expenses")
      .select("*")
      .order("id", { ascending: false });

    setExpenses(data || []);
  }

  async function addExpense() {
    if (!expenseName || !amount) {
      alert("Expense Name and Amount required");
      return;
    }

    const { error } = await supabase
      .from("expenses")
      .insert([
        {
          expense_name: expenseName,
          amount: Number(amount),
          note: note,
        },
      ]);

    if (error) {
      alert(error.message);
      return;
    }

    setExpenseName("");
    setAmount("");
    setNote("");

    loadExpenses();
  }

  useEffect(() => {
    loadExpenses();
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">
        Expenses
      </h1>

      <div className="bg-white p-6 rounded-2xl shadow-md mb-6">
        <h2 className="text-xl font-semibold mb-4">
          Add Expense
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input
            value={expenseName}
            onChange={(e) => setExpenseName(e.target.value)}
            placeholder="Expense Name"
            className="border p-3 rounded-xl"
          />

          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Amount"
            className="border p-3 rounded-xl"
          />

          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Note"
            className="border p-3 rounded-xl"
          />
        </div>

        <button
          onClick={addExpense}
          className="mt-4 bg-red-600 text-white px-6 py-3 rounded-xl"
        >
          Save Expense
        </button>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-md">
        <h2 className="text-xl font-semibold mb-4">
          Expense History
        </h2>

        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left p-3">Expense</th>
              <th className="text-left p-3">Amount</th>
              <th className="text-left p-3">Note</th>
            </tr>
          </thead>

          <tbody>
            {expenses.map((item) => (
              <tr key={item.id} className="border-b">
                <td className="p-3">
                  {item.expense_name}
                </td>

                <td className="p-3">
                  ৳{item.amount}
                </td>

                <td className="p-3">
                  {item.note}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}