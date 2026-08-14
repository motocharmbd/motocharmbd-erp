"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";

const COMMISSION_PER_ORDER = 15;
const STORAGE_KEY = "mcb_order_confirmed_by";

export default function SakinCommissionDisplay() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname !== "/orders-history") return;

    let cancelled = false;

    async function updateCommission() {
      if (cancelled) return;

      let assignments: Record<string, string> = {};
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        assignments = saved ? JSON.parse(saved) : {};
      } catch {
        assignments = {};
      }

      const sakinIds = Object.entries(assignments)
        .filter(([, person]) => person === "Sakin")
        .map(([id]) => Number(id))
        .filter(Number.isFinite);

      let commission = 0;

      if (sakinIds.length > 0) {
        const { data, error } = await supabase
          .from("orders")
          .select("id,status")
          .in("id", sakinIds);

        if (!error && data) {
          commission =
            data.filter(
              (row) => String(row.status || "").toLowerCase() !== "cancelled"
            ).length * COMMISSION_PER_ORDER;
        }
      }

      const summary = Array.from(document.querySelectorAll("div")).find(
        (element) =>
          element.textContent?.trim().startsWith("Sakin Total Orders:") &&
          element.parentElement?.textContent?.includes("Order Confirmed:")
      );

      if (!summary?.parentElement) return;

      let commissionEl = summary.parentElement.querySelector<HTMLElement>(
        "[data-sakin-commission]"
      );

      if (!commissionEl) {
        commissionEl = document.createElement("div");
        commissionEl.setAttribute("data-sakin-commission", "true");
        commissionEl.className =
          "rounded-lg bg-emerald-100 px-4 py-2 text-sm font-bold text-emerald-700";
        summary.parentElement.appendChild(commissionEl);
      }

      const text = `Sakin Commission: ৳${commission.toLocaleString("en-BD")}`;
      if (commissionEl.textContent !== text) commissionEl.textContent = text;
    }

    updateCommission();
    const interval = window.setInterval(updateCommission, 1500);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [pathname]);

  return null;
}
