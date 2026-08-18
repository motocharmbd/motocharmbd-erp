"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Sidebar() {
  const pathname = usePathname();

  const menuItems = [
    { name: "Dashboard", href: "/dashboard", icon: "🏠" },
    { name: "Orders History", href: "/orders-history", icon: "📄" },
    { name: "Fraud Check", href: "/fraud-check", icon: "🛡️" },
  ];

  return (
    <aside className="w-64 bg-gray-900 text-white flex flex-col min-h-screen p-4">
      {/* Brand Title */}
      <div className="mb-8 px-2">
        <h1 className="text-2xl font-bold tracking-wide">Moto Charm BD</h1>
      </div>

      {/* Navigation Links (Full Access Granted) */}
      <nav className="space-y-2 flex-1">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition ${
                isActive
                  ? "bg-blue-600 text-white shadow-lg"
                  : "text-gray-300 hover:bg-gray-800 hover:text-white"
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer / Info */}
      <div className="pt-4 border-t border-gray-800 text-xs text-gray-500 text-center">
        Full Access Mode Enabled
      </div>
    </aside>
  );
}
