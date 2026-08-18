import { NextResponse } from "next/server";

const PATHAO_BASE_URL = (process.env.PATHAO_BASE_URL || "https://courier-api.pathao.com").replace(/\/$/, "");
const CARRYBEE_BASE_URL = (process.env.CARRYBEE_BASE_URL || "https://api-merchant.carrybee.com").replace(/\/$/, "");

type CourierStats = {
  name: string;
  success: number;
  cancel: number;
  total: number;
  success_ratio: number;
  configured: boolean;
  error?: string;
};

function emptyStats(name: string, error: string): CourierStats {
  return { name, success: 0, cancel: 0, total: 0, success_ratio: 0, configured: false, error };
}

function normalizePhone(value: unknown): string {
  const raw = String(value ?? "").replace(/\D/g, "");
  if (/^8801[3-9]\d{8}$/.test(raw)) return `0${raw.slice(3)}`;
  return raw;
}

function makeStats(name: string, success: number, cancel: number, configured = true): CourierStats {
  const safeSuccess = Math.max(0, Number(success) || 0);
  const safeCancel = Math.max(0, Number(cancel) || 0);
  const total = safeSuccess + safeCancel;
  return {
    name,
    success: safeSuccess,
    cancel: safeCancel,
    total,
    success_ratio: total ? Number(((safeSuccess / total) * 100).toFixed(2)) : 0,
    configured,
  };
}

async function pathaoStats(phone: string): Promise<CourierStats> {
  const clientId = process.env.PATHAO_CLIENT_ID;
  const clientSecret = process.env.PATHAO_CLIENT_SECRET;
  const refreshToken = process.env.PATHAO_REFRESH_TOKEN;
  const username = process.env.PATHAO_USERNAME;
  const password = process.env.PATHAO_PASSWORD;

  if (!clientId || !clientSecret || (!refreshToken && (!username || !password))) {
    return emptyStats("Pathao", "Pathao credentials are not completely configured.");
  }

  try {
    let tokenBody: Record<string, string>;
    if (refreshToken) {
      tokenBody = {
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: "refresh_token",
        refresh_token: refreshToken,
      };
    } else {
      tokenBody = {
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: "password",
        username: username!,
        password: password!,
      };
    }

    const tokenResponse = await fetch(`${PATHAO_BASE_URL}/aladdin/api/v1/issue-token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(tokenBody),
      cache: "no-store",
    });
    const tokenData = await tokenResponse.json().catch(() => ({}));
    const accessToken = String(tokenData?.access_token || "").trim();
    if (!tokenResponse.ok || !accessToken) {
      return emptyStats("Pathao", `Pathao authentication failed (${tokenResponse.status}).`);
    }

    const response = await fetch("https://merchant.pathao.com/api/v1/user/success", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ phone }),
      cache: "no-store",
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      return emptyStats("Pathao", `Pathao customer lookup failed (${response.status}).`);
    }

    const customer = data?.data?.customer || data?.customer || {};
    const success = Number(customer.successful_delivery ?? customer.success ?? 0);
    const total = Number(customer.total_delivery ?? customer.total ?? 0);
    return makeStats("Pathao", success, Math.max(0, total - success));
  } catch (error: any) {
    return emptyStats("Pathao", error?.message || "Pathao request failed.");
  }
}

async function carrybeeStats(phone: string): Promise<CourierStats> {
  // CarryBee's merchant fraud endpoint currently authenticates through the merchant
  // session. Keep the credentials server-side and never expose them to the browser.
  const carryPhone = process.env.CARRYBEE_PHONE;
  const carryPassword = process.env.CARRYBEE_PASSWORD;

  if (!carryPhone || !carryPassword) {
    return emptyStats(
      "CarryBee",
      "CarryBee phone/password credentials are not configured. API key/secret alone does not document a phone fraud lookup endpoint."
    );
  }

  try {
    const csrfResponse = await fetch(`${CARRYBEE_BASE_URL.replace("api-merchant.carrybee.com", "merchant.carrybee.com")}/api/auth/csrf`, {
      cache: "no-store",
      headers: { Accept: "application/json" },
    });
    const csrfData = await csrfResponse.json().catch(() => ({}));
    const csrfToken = csrfData?.csrfToken;
    if (!csrfResponse.ok || !csrfToken) return emptyStats("CarryBee", "CarryBee authentication token could not be obtained.");

    const cookie = csrfResponse.headers.get("set-cookie") || "";
    const loginResponse = await fetch(`${CARRYBEE_BASE_URL.replace("api-merchant.carrybee.com", "merchant.carrybee.com")}/api/auth/callback/login?`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
        ...(cookie ? { Cookie: cookie } : {}),
      },
      body: new URLSearchParams({
        phone: `+88${carryPhone.replace(/^\+?88/, "")}`,
        password: carryPassword,
        csrfToken,
        callbackUrl: "https://merchant.carrybee.com/login",
      }).toString(),
      redirect: "manual",
      cache: "no-store",
    });

    const loginCookie = loginResponse.headers.get("set-cookie") || cookie;
    const sessionResponse = await fetch("https://merchant.carrybee.com/api/auth/session", {
      headers: { Accept: "application/json", ...(loginCookie ? { Cookie: loginCookie } : {}) },
      cache: "no-store",
    });
    const session = await sessionResponse.json().catch(() => ({}));
    const accessToken = session?.accessToken;
    const businessId = session?.user?.selectedBusinessId;
    if (!accessToken || !businessId) return emptyStats("CarryBee", "CarryBee merchant authentication failed.");

    const response = await fetch(`${CARRYBEE_BASE_URL}/api/v2/businesses/${businessId}/fraud-check/${phone}`, {
      headers: { Accept: "application/json", Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || payload?.error) return emptyStats("CarryBee", `CarryBee customer lookup failed (${response.status}).`);

    const data = payload?.data || {};
    const total = Number(data.total_order ?? data.total_orders ?? 0);
    const cancel = Number(data.cancelled_order ?? data.cancelled_orders ?? 0);
    return makeStats("CarryBee", Math.max(0, total - cancel), cancel);
  } catch (error: any) {
    return emptyStats("CarryBee", error?.message || "CarryBee request failed.");
  }
}

async function steadfastStats(): Promise<CourierStats> {
  // Steadfast's documented merchant API exposes consignment/tracking operations,
  // not a phone-number fraud-history endpoint. Do not fake a score with zeros.
  const apiKey = process.env.STEADFAST_API_KEY;
  const secretKey = process.env.STEADFAST_SECRET_KEY;
  if (!apiKey || !secretKey) return emptyStats("Steadfast", "Steadfast API credentials are not configured.");
  return emptyStats("Steadfast", "Steadfast API does not expose phone fraud-history lookup; tracking API is configured separately.");
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const phone = normalizePhone(body?.phoneNumber ?? body?.phone);

    if (!/^01[3-9]\d{8}$/.test(phone)) {
      return NextResponse.json({ error: "Valid 11-digit Bangladeshi phone number is required." }, { status: 400 });
    }

    const [pathao, steadfast, carrybee] = await Promise.all([
      pathaoStats(phone),
      steadfastStats(),
      carrybeeStats(phone),
    ]);

    const couriers = [pathao, steadfast, carrybee];
    const usable = couriers.filter((item) => item.configured && !item.error);
    const totalOrders = usable.reduce((sum, item) => sum + item.total, 0);
    const totalDelivered = usable.reduce((sum, item) => sum + item.success, 0);
    const totalCancelled = usable.reduce((sum, item) => sum + item.cancel, 0);
    const score = totalOrders ? Math.round((totalDelivered / totalOrders) * 100) : 0;

    return NextResponse.json({
      success: true,
      phone,
      score,
      data: {
        phone,
        summary: {
          total_parcel: totalOrders,
          success_parcel: totalDelivered,
          cancelled_parcel: totalCancelled,
          success_ratio: score,
        },
        pathao,
        steadfast,
        carrybee,
      },
      reports: [],
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error: any) {
    console.error("Direct courier fraud check error:", error);
    return NextResponse.json({ error: error?.message || "Fraud check failed." }, { status: 500 });
  }
}
