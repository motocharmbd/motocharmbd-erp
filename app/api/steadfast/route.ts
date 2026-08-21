import { NextResponse } from "next/server";

function normalizeStatus(value: unknown): string {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function findStatus(payload: any): string {
  const candidates = [
    payload?.data?.order_status,
    payload?.data?.status,
    payload?.order_status,
    payload?.status,
    payload?.data?.data?.order_status,
    payload?.data?.data?.status,
  ];

  for (const value of candidates) {
    const status = normalizeStatus(value);
    if (!status) continue;
    if (status.includes("deliver") && !status.includes("return")) return "delivered";
    if (status.includes("cancel")) return "cancelled";
    if (status.includes("return") || status.includes("returned")) return "returned";
    return "processing";
  }
  return "";
}

async function getPathaoAccessToken() {
  const clientId = process.env.PATHAO_CLIENT_ID;
  const clientSecret = process.env.PATHAO_CLIENT_SECRET;
  const refreshToken = process.env.PATHAO_REFRESH_TOKEN;
  const username = process.env.PATHAO_USERNAME;
  const password = process.env.PATHAO_PASSWORD;

  if (!clientId || !clientSecret) {
    throw new Error("Pathao Client ID/Client Secret are not configured in Vercel.");
  }

  const body: Record<string, string> = {
    client_id: clientId,
    client_secret: clientSecret,
  };

  if (refreshToken) {
    body.grant_type = "refresh_token";
    body.refresh_token = refreshToken;
  } else if (username && password) {
    body.grant_type = "password";
    body.username = username;
    body.password = password;
  } else {
    throw new Error("Pathao Refresh Token is missing. Add PATHAO_REFRESH_TOKEN to Vercel.");
  }

  const response = await fetch("https://api-hermes.pathao.com/aladdin/api/v1/issue-token", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload?.access_token) {
    throw new Error(payload?.message || payload?.error || `Pathao token request failed (${response.status})`);
  }

  return payload.access_token as string;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const trackingCode = searchParams.get("tracking_code")?.trim();

  if (!trackingCode) {
    return NextResponse.json({ error: "Tracking code is required", delivery_status: "" }, { status: 400 });
  }

  try {
    const accessToken = await getPathaoAccessToken();
    const response = await fetch(
      `https://api-hermes.pathao.com/aladdin/api/v1/orders/${encodeURIComponent(trackingCode)}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/json",
        },
        cache: "no-store",
      }
    );

    const payload = await response.json().catch(() => ({}));
    const deliveryStatus = findStatus(payload);

    if (!response.ok) {
      return NextResponse.json(
        {
          ...payload,
          delivery_status: deliveryStatus,
          error: payload?.message || payload?.error || `Pathao API returned ${response.status}`,
        },
        { status: response.status, headers: { "Cache-Control": "no-store" } }
      );
    }

    return NextResponse.json(
      { ...payload, delivery_status: deliveryStatus },
      { status: 200, headers: { "Cache-Control": "no-store" } }
    );
  } catch (error: any) {
    console.error("Pathao tracking API error:", error);
    return NextResponse.json(
      { error: error?.message || "Pathao API request failed", delivery_status: "" },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}
