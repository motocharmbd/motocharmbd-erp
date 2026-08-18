"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

export default function Sidebar() {
  const [userRole, setUserRole] = useState<string>("Loading...");

  useEffect(() => {
    async function checkUserRole() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const email = session?.user?.email || "";

        if (!email) {
          setUserRole("Viewer");
          return;
        }

        // ডাটাবেস থেকে ইউজারের সঠিক রোল ফেচ করা
        const { data, error } = await supabase
          .from("authorized_personnel")
          .select("access_type")
          .eq("email", email)
          .single();

        if (data?.access_type) {
          setUserRole(data.access_type); // যেমন: "Full Admin", "Editor", "Viewer"
        } else if (email.toLowerCase() === "motocharmbdofficial@gmail.com") {
          setUserRole("Full Admin");
        } else {
          setUserRole("Viewer");
        }
      } catch (err) {
        console.error("Role check error:", err);
        setUserRole("Viewer");
      }
    }

    checkUserRole();
  }, []);

  return (
    <aside className="w-64 bg-slate-900 text-white min-h-screen p-4 flex flex-col justify-between">
      <div>
        <h1 className="text-xl font-bold mb-4">Moto Charm BD</h1>

        {/* ডাইনামিক রোল ব্যাজ */}
        <div className="mb-6 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs font-semibold uppercase tracking-wider text-amber-400">
          {userRole}
        </div>

        {/* ন্যাভিগেশন লিংকস */}
        <nav className="space-y-2">
          <Link href="/" className="flex items-center gap-2 p-2 hover:bg-slate-800 rounded-lg">
            🏠 Dashboard
          </Link>
          <Link href="/orders-history" className="flex items-center gap-2 p-2 hover:bg-slate-800 rounded-lg">
            📄 Orders History
          </Link>
          <Link href="/fraud-check" className="flex items-center gap-2 p-2 hover:bg-slate-800 rounded-lg">
            🛡️ Fraud Check
          </Link>
          
          {/* যদি ফুল অ্যাডমিন হয় তবেই টিম ম্যানেজমেন্ট বা পার্সোনেল লিস্ট দেখাবে */}
          {userRole === "Full Admin" && (
            <Link href="/team-management" className="flex items-center gap-2 p-2 hover:bg-slate-800 rounded-lg text-purple-400">
              👥 Team Management
            </Link>
          )}
        </nav>
      </div>
    </aside>
  );
}
