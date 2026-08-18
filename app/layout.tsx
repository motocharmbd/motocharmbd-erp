"use client";

import Link from "next/navigation";
import { usePathname } from "next/navigation";

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-gray-900 text-white flex flex-col h-screen p-4 sticky top-0">
      <div className="mb-8 px-2">
        <h1 className="text-2xl font-bold tracking-wide">Moto Charm BD</h1>
      </div>

      <nav className="space-y-2 flex-1">
        <a
          href="/dashboard"
          className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition ${
            pathname === "/dashboard" ? "bg-blue-600 text-white" : "text-gray-300 hover:bg-gray-800 hover:text-white"
          }`}
        >
          <span>🏠</span>
          <span>Dashboard</span>
        </a>

        <a
          href="/orders-history"
          className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition ${
            pathname === "/orders-history" ? "bg-blue-600 text-white" : "text-gray-300 hover:bg-gray-800 hover:text-white"
          }`}
        >
          <span>📄</span>
          <span>Orders History</span>
        </a>

        <a
          href="/fraud-check"
          className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition ${
            pathname === "/fraud-check" ? "bg-blue-600 text-white" : "text-gray-300 hover:bg-gray-800 hover:text-white"
          }`}
        >
          <span>🛡️</span>
          <span>Fraud Check</span>
        </a>
      </nav>
    </aside>
  );
}
