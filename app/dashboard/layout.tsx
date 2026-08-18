"use client";

import { useEffect, useState } from "react";
import SakinCommissionDisplay from "@/app/components/SakinCommissionDisplay";
import RoleGuard from "@/app/components/RoleGuard";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [roleReady, setRoleReady] = useState(false);

  useEffect(() => {
    const role = String(localStorage.getItem("userRole") || "moderator").toLowerCase();
    setIsAdmin(role === "admin");
    setRoleReady(true);
  }, []);

  if (!roleReady) return null;

  return (
    <RoleGuard>
      <div className="flex min-h-screen">
        <aside className="w-64 bg-gray-900 p-5 text-white">
          <div className="mb-8 flex items-center justify-between gap-2">
            <h2 className="text-2xl font-bold">Moto Charm BD</h2>
          </div>
          <div className="mb-5 rounded-xl bg-white/10 px-3 py-2 text-xs font-bold uppercase tracking-wide text-gray-200">
            {isAdmin ? "Admin • Full Access" : "Moderator • View Mode"}
          </div>
          <nav className="space-y-3">
            <a href="/dashboard" className="block hover:text-blue-400">🏠 Dashboard</a>
            {isAdmin && <a href="/orders" className="block hover:text-blue-400">🛒 Orders</a>}
            <a href="/orders-history" className="block hover:text-blue-400">📑 Orders History</a>
            {isAdmin && <a href="/expenses" className="block hover:text-blue-400">💸 Expenses</a>}
            <a href="/fraud-check" className="block hover:text-blue-400">🛡️ Fraud Check</a>
            {isAdmin && <a href="/settings" className="block hover:text-blue-400">⚙️ Settings</a>}
          </nav>
        </aside>
        <main className="flex-1 bg-gray-100 p-8">
          {children}
          <SakinCommissionDisplay />
        </main>
      </div>
    </RoleGuard>
  );
}
