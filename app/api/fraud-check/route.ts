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

function findNumber(value: any, keys: string[]): number | null {
  if (!value || typeof value !== "object") return null;
  for (const key of keys) {
    const n = Number(value?.[key]);
    if (Number.isFinite(n)) return n;
  }
  for (const child of Object.values(value)) {
    const found = findNumber(child, keys);
    if (found !== null) return found;
  }
  return null;
}

function findPathaoStats(payload: any) {
  const successRate = findNumber(payload, ["success_rate", "successRate", "success_ratio", "successRatio"]);
  const total = findNumber(payload, ["total", "total_parcel", "total_orders", "total_order"]);
  const success = findNumber(payload, ["success", "success_parcel", "delivered", "delivered_parcel"]);
  const cancel = findNumber(payload, ["cancel", "cancelled", "cancelled_parcel", "cancelled_orders"]);
  const calculatedRate = successRate !== null
    ? successRate
    : total !== null && total > 0 && success !== null
      ? (success / total) * 100
      : null;
  return {
    total: total ?? 0,
    success: success ?? 0,
    cancel: cancel ?? 0,
    successRate: calculatedRate === null ? 0 : Math.max(0, Math.min(100, Math.round(calculatedRate * 100) / 100)),
  };
}

async function getPathaoSuccessRate(phone: string) {
  const clientId = process.env.PATHAO_CLIENT_ID;
  const clientSecret = process.env.PATHAO_CLIENT_SECRET;
  const refreshToken = process.env.PATHAO_REFRESH_TOKEN;
  const baseUrl = (process.env.PATHAO_BASE_URL || "https://api-hermes.pathao.com").replace(/\/$/, "");

  if (!clientId || !clientSecret || !refreshToken) {
    return { configured: false, error: "Pathao credentials are not fully configured" };
  }

  const tokenResponse = await fetch(`${baseUrl}/aladdin/api/v1/issue-token`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
    cache: "no-store",
  });
  const tokenPayload = await tokenResponse.json().catch(() => ({}));
  if (!tokenResponse.ok) {
    return { configured: true, error: tokenPayload?.message || tokenPayload?.error || `Pathao token request failed (${tokenResponse.status})` };
  }

  const accessToken = tokenPayload?.access_token || tokenPayload?.data?.access_token;
  if (!accessToken) return { configured: true, error: "Pathao access token was not returned" };

  const response = await fetch(`${baseUrl}/api/v1/user/success`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ phone }),
    cache: "no-store",
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    return { configured: true, error: payload?.message || payload?.error || `Pathao success API failed (${response.status})` };
  }

  const stats = findPathaoStats(payload);
  return { configured: true, ...stats, raw: payload };
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

    const supabase = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data: orders, error } = await supabase.from("orders").select("*").eq("phone", phone).order("order_date", { ascending: false });
    if (error) return NextResponse.json({ error: error.message, score: 0 }, { status: 500 });

    const rows = orders || [];
    const ownTotal = rows.length;
    const ownDelivered = rows.filter((row: any) => isDelivered(normalizeStatus(row.status))).length;
    const ownCancelled = rows.filter((row: any) => isCancelled(normalizeStatus(row.status))).length;

    // First native courier integration: Pathao phone success API.
    // Steadfast and CarryBee remain intentionally paused until their native phone-history
    // endpoints/permissions are verified; no third-party fraud service is called.
    let pathao: any;
    try {
      pathao = await getPathaoSuccessRate(phone);
    } catch (error: any) {
      pathao = { configured: true, error: error?.message || "Pathao request failed" };
    }

    const courierStats = {
      Pathao: {
        name: "Pathao",
        total_parcel: pathao?.total ?? 0,
        success_parcel: pathao?.success ?? 0,
        cancelled_parcel: pathao?.cancel ?? 0,
        success_ratio: pathao?.successRate ?? 0,
        source: "pathao_native_api",
        configured: Boolean(pathao?.configured),
        error: pathao?.error || null,
      },
      Steadfast: {
        name: "Steadfast",
        total_parcel: 0,
        success_parcel: 0,
        cancelled_parcel: 0,
        success_ratio: 0,
        source: "paused_native_phone_lookup",
        configured: Boolean(process.env.STEADFAST_API_KEY && process.env.STEADFAST_SECRET_KEY),
        error: "Paused until native phone-history endpoint is verified",
      },
      CarryBee: {
        name: "CarryBee",
        total_parcel: 0,
        success_parcel: 0,
        cancelled_parcel: 0,
        success_ratio: 0,
        source: "paused_native_phone_lookup",
        configured: Boolean(process.env.CARRYBEE_API_KEY && process.env.CARRYBEE_API_SECRET),
        error: "Paused until native phone-history endpoint is verified",
      },
    };

    const pathaoHasData = Number(pathao?.total || 0) > 0 || Number(pathao?.successRate || 0) > 0;
    const score = pathaoHasData ? Number(pathao.successRate || 0) : ownTotal > 0 ? Math.round((ownDelivered / ownTotal) * 100) : 0;
    const total = pathaoHasData ? Number(pathao.total || 0) : ownTotal;
    const delivered = pathaoHasData ? Number(pathao.success || 0) : ownDelivered;
    const cancelled = pathaoHasData ? Number(pathao.cancel || 0) : ownCancelled;

    const riskLevel = total === 0 ? "new" : score >= 80 ? "safe" : score >= 60 ? "low" : score >= 40 ? "medium" : "high";

    return NextResponse.json({
      status: "success",
      source: "motocharmbd-native-courier-api",
      phone,
      score,
      risk_level: riskLevel,
      data: {
        summary: { total_parcel: total, success_parcel: delivered, cancelled_parcel: cancelled, success_ratio: score },
        own_erp: { total_parcel: ownTotal, success_parcel: ownDelivered, cancelled_parcel: ownCancelled },
        ...courierStats,
      },
      reports: [],
      integrations: { pathao: pathao?.configured ? "active" : "not_configured", steadfast: "paused", carrybee: "paused" },
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error: any) {
    console.error("Native courier fraud check error:", error);
    return NextResponse.json({ error: error?.message || "Fraud check failed", score: 0 }, { status: 500 });
  }
}
