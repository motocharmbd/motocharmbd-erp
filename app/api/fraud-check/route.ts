import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function normalizePhone(value: unknown) {
  const digits = String(value ?? "").replace(/\D/g, "");
  if (digits.startsWith("880") && digits.length === 13) return `0${digits.slice(3)}`;
  return digits;
}

function normalizeStatus(value: unknown) {
  return String(value ?? "").trim().toLowerCase().replace(/\s+/g, "_");
}

function isDelivered(status: string) {
  return ["delivered", "partial_delivered", "completed", "success"].includes(status);
}

function isCancelled(status: string) {
  return ["cancelled", "canceled", "returned", "return", "failed", "rejected"].includes(status);
}

function courierName(row: any) {
  const raw = row?.courier ?? row?.courier_name ?? row?.delivery_courier ?? row?.shipping_courier ?? "";
  const value = String(raw).trim().toLowerCase();
  if (value.includes("stead")) return "Steadfast";
  if (value.includes("pathao")) return "Pathao";
  if (value.includes("carry")) return "CarryBee";
  return raw ? String(raw) : "Our ERP";
}

export async function POST(request: Request) {
  try {
    const { phoneNumber } = await request.json();
    const phone = normalizePhone(phoneNumber);

    if (!/^01\d{9}$/.test(phone)) {
      return NextResponse.json({ error: "Valid 11 digit phone number is required" }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: "ERP database is not configured", score: 0 }, { status: 503 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // Third-party fraud provider is intentionally not used anymore.
    // The score is calculated only from Moto Charm BD's own stored customer history.
    const { data: orders, error } = await supabase
      .from("orders")
      .select("*")
      .eq("phone", phone)
      .order("order_date", { ascending: false });

    if (error) {
      console.error("Own ERP fraud history query failed:", error);
      return NextResponse.json({ error: error.message, score: 0 }, { status: 500 });
    }

    const rows = orders || [];
    const total = rows.length;
    const delivered = rows.filter((row: any) => isDelivered(normalizeStatus(row.status))).length;
    const cancelled = rows.filter((row: any) => isCancelled(normalizeStatus(row.status))).length;
    const processing = Math.max(0, total - delivered - cancelled);
    const score = total > 0 ? Math.round((delivered / total) * 100) : 0;

    const byCourier: Record<string, { name: string; total_parcel: number; success_parcel: number; cancelled_parcel: number; success_ratio: number }> = {};
    for (const row of rows) {
      const name = courierName(row);
      if (!byCourier[name]) {
        byCourier[name] = { name, total_parcel: 0, success_parcel: 0, cancelled_parcel: 0, success_ratio: 0 };
      }
      const bucket = byCourier[name];
      const status = normalizeStatus(row.status);
      bucket.total_parcel += 1;
      if (isDelivered(status)) bucket.success_parcel += 1;
      if (isCancelled(status)) bucket.cancelled_parcel += 1;
    }

    Object.values(byCourier).forEach((bucket) => {
      bucket.success_ratio = bucket.total_parcel
        ? Math.round((bucket.success_parcel / bucket.total_parcel) * 10000) / 100
        : 0;
    });

    const riskLevel = total === 0
      ? "new"
      : score >= 80
        ? "safe"
        : score >= 60
          ? "low"
          : score >= 40
            ? "medium"
            : "high";

    return NextResponse.json({
      status: "success",
      source: "motocharmbd-own-erp",
      phone,
      score,
      risk_level: riskLevel,
      data: {
        summary: {
          total_parcel: total,
          success_parcel: delivered,
          cancelled_parcel: cancelled,
          processing_parcel: processing,
          success_ratio: score,
        },
        ...byCourier,
      },
      reports: [],
      note: "Third-party fraud API disabled. This result uses only customer history stored in Moto Charm BD ERP.",
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error: any) {
    console.error("Own ERP fraud check error:", error);
    return NextResponse.json({ error: error?.message || "Fraud check failed", score: 0 }, { status: 500 });
  }
}
