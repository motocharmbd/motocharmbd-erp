"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";

const COMMISSION_PER_ORDER = 15;
const STORAGE_KEY = "mcb_order_confirmed_by";
const MODERATORS = ["Sakin", "Ruhi", "Anik"] as const;

export default function SakinCommissionDisplay() {
  const pathname = usePathname();
  useEffect(() => {
    if (pathname !== "/orders-history") return;
    let cancelled = false;
    async function updateCommission() {
      if (cancelled) return;
      let assignments: Record<string, string> = {};
      try { const saved = localStorage.getItem(STORAGE_KEY); assignments = saved ? JSON.parse(saved) : {}; } catch { assignments = {}; }
      const ids = Object.entries(assignments).filter(([, person]) => MODERATORS.includes(person as any)).map(([id]) => Number(id)).filter(Number.isFinite);
      const counts: Record<string, { orders:number; delivered:number; cancelled:number; commission:number }> = {};
      MODERATORS.forEach(name => { counts[name] = { orders:0, delivered:0, cancelled:0, commission:0 }; });
      if (ids.length) {
        const { data, error } = await supabase.from("orders").select("id,status").in("id", ids);
        if (!error && data) data.forEach(row => { const person=assignments[String(row.id)]; if (!counts[person]) return; const status=String(row.status||"").toLowerCase(); counts[person].orders++; if(status==="delivered") counts[person].delivered++; if(status==="cancelled") counts[person].cancelled++; if(status!=="cancelled") counts[person].commission+=COMMISSION_PER_ORDER; });
      }
      const root = Array.from(document.querySelectorAll("div")).find(el => el.textContent?.trim().startsWith("Sakin Total Orders:") && el.parentElement?.textContent?.includes("Order Confirmed:"));
      if (!root?.parentElement) return;
      const parent = root.parentElement as HTMLElement;
      parent.querySelectorAll("[data-moderator-summary]").forEach(el => el.remove());
      const summary = document.createElement("div"); summary.setAttribute("data-moderator-summary","true"); summary.className="mt-2 flex flex-wrap gap-2";
      MODERATORS.forEach(name => { const item=counts[name]; const el=document.createElement("div"); el.className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-sm"; el.textContent=`${name}: ${item.orders} orders · ${item.delivered} delivered · ${item.cancelled} cancelled · ৳${item.commission.toLocaleString("en-BD")} commission`; summary.appendChild(el); });
      parent.appendChild(summary);
    }
    updateCommission(); const interval=window.setInterval(updateCommission,1500); return()=>{cancelled=true;window.clearInterval(interval);};
  }, [pathname]);
  return null;
}
