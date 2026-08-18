"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import LinkComponent from "next/link";
import { usePathname } from "next/navigation";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [, setIsAdmin] = useState(true);

  useEffect(() => {
    async function checkAdmin() {
      const { data: { session } } = await supabase.auth.getSession();
      const email = session?.user?.email;
      
      if (email) {
        const { data } = await supabase
          .from("authorized_personnel")
          .select("access_type")
          .eq("email", email)
          .single();

        if (data && data.access_type !== "Full Admin") {
          // হ্যান্ডেল এক্সেস
        }
      }
    }
    checkAdmin();
  }, []);

  const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: "🏠" },
    { name: "Orders History", href: "/orders-history", icon: "📄" },
    { name: "Fraud Check", href: "/fraud-check", icon: "🛡️" },
    { name: "Team Management", href: "/team-management", icon: "👥" },
    { name: "Expenses", href: "/expenses", icon: "💰" },
    { name: "Settings", href: "/settings", icon: "⚙️" },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Permanent Fixed Sidebar */}
      <aside className="w-64 flex-shrink-0 bg-slate-900 text-white flex flex-col justify-between p-4 shadow-xl">
        <div>
          <div className="mb-8 px-2">
            <h1 className="text-2xl font-bold tracking-wider">Moto Charm BD</h1>
            <div className="mt-2 inline-block px-2.5 py-1 rounded bg-blue-600 text-[10px] font-bold uppercase tracking-widest text-white">
              ADMINISTRATOR
            </div>
          </div>

          <nav className="space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <LinkComponent
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition ${
                    isActive 
                      ? "bg-blue-600 text-white shadow-md" 
                      : "text-gray-300 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  <span className="text-lg">{item.icon}</span>
                  {item.name}
                </LinkComponent>
              );
            })}
          </nav>
        </div>

        <div className="px-4 py-3 text-xs text-gray-500 border-t border-slate-800">
          Moto Charm BD Admin Panel
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-6 bg-gray-100">
        {children}
      </main>
    </div>
  );
}
