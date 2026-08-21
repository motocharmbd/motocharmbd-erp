import { NextResponse } from "next/server";

function normalizeStatus(value: unknown): string {
  const s = String(value ?? "").trim().toLowerCase();
  if (!s) return "";
  if (s.includes("deliver") && !s.includes("return")) return "Delivered";
  if (s.includes("cancel")) return "Cancelled";
  if (s.includes("return")) return "Returned";
  return "Processing";
}

function baseUrl() {
  return (process.env.PATHAO_BASE_URL || "https://api-hermes.pathao.com").replace(/\/+$/, "");
}

async function steadfast(code: string) {
  const apiKey = process.env.STEADFAST_API_KEY;
  const secretKey = process.env.STEADFAST_SECRET_KEY;
  if (!apiKey || !secretKey) throw new Error("Steadfast credentials are not configured");
  const response = await fetch(`https://portal.steadfast.com.bd/api/v1/status_by_trackingcode/${encodeURIComponent(code)}`, {
    headers: { "Api-Key": apiKey, "Secret-Key": secretKey, Accept: "application/json" },
    cache: "no-store",
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(`Steadfast returned ${response.status}`);
  const raw = payload?.delivery_status ?? payload?.status ?? payload?.data?.delivery_status ?? payload?.data?.status;
  return { courier: "Steadfast", delivery_status: normalizeStatus(raw), raw_status: raw ?? "" };
}

async function pathao(code: string) {
  const clientId = process.env.PATHAO_CLIENT_ID;
  const clientSecret = process.env.PATHAO_CLIENT_SECRET;
  const refreshToken = process.env.PATHAO_REFRESH_TOKEN;
  if (!clientId || !clientSecret || !refreshToken) throw new Error("Pathao credentials are not configured");

  const root = baseUrl();
  const tokenResponse = await fetch(`${root}/aladdin/api/v1/issue-token`, {
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
  const token = await tokenResponse.json().catch(() => ({}));
  if (!tokenResponse.ok || !token?.access_token) {
    throw new Error(`Pathao token request failed (${tokenResponse.status})`);
  }

  const response = await fetch(`${root}/aladdin/api/v1/orders/${encodeURIComponent(code)}`, {
    headers: {
      Authorization: `Bearer ${token.access_token}`,
      Accept: "application/json",
    },
    cache: "no-store",
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(`Pathao returned ${response.status}`);

  const raw = payload?.data?.order_status ?? payload?.data?.status ?? payload?.order_status ?? payload?.status;
  return {
    courier: "Pathao",
    delivery_status: normalizeStatus(raw),
    raw_status: raw ?? "",
    consignment_id: payload?.data?.consignment_id ?? payload?.consignment_id ?? code,
  };
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("tracking_code")?.trim();
  const courier = url.searchParams.get("courier")?.trim().toLowerCase();
  if (!code) return NextResponse.json({ error: "Tracking code is required", delivery_status: "" }, { status: 400 });

  try {
    if (courier === "steadfast") return NextResponse.json(await steadfast(code), { headers: { "Cache-Control": "no-store" } });
    if (courier === "pathao") return NextResponse.json(await pathao(code), { headers: { "Cache-Control": "no-store" } });

    if (/^SFR/i.test(code)) return NextResponse.json(await steadfast(code), { headers: { "Cache-Control": "no-store" } });

    try {
      return NextResponse.json(await pathao(code), { headers: { "Cache-Control": "no-store" } });
    } catch (pathaoError) {
      try {
        return NextResponse.json(await steadfast(code), { headers: { "Cache-Control": "no-store" } });
      } catch {
        throw pathaoError;
      }
    }
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Courier tracking request failed", delivery_status: "" },
      { status: 502, headers: { "Cache-Control": "no-store" } }
    );
  }
}
