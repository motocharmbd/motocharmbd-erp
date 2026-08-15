import { NextResponse } from "next/server";

const FINAL_STATUS_VALUES = ["delivered", "partial_delivered", "cancelled"];
const PROCESSING_STATUS_VALUES = [
  "pending",
  "delivered_approval_pending",
  "partial_delivered_approval_pending",
  "cancelled_approval_pending",
  "unknown_approval_pending",
  "hold",
  "in_review",
  "unknown",
];

function normalizeStatus(value: unknown): string {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function findDeliveryStatus(payload: any): string {
  const candidates = [
    payload?.delivery_status,
    payload?.status_type,
    payload?.data?.delivery_status,
    payload?.data?.status_type,
    payload?.data?.data?.delivery_status,
    payload?.data?.data?.status_type,
    payload?.consignment?.delivery_status,
    payload?.consignment?.status_type,
  ];

  for (const value of candidates) {
    const status = normalizeStatus(value);
    if (status && (FINAL_STATUS_VALUES.includes(status) || PROCESSING_STATUS_VALUES.includes(status))) {
      return status;
    }
  }

  return "";
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const trackingCode = searchParams.get("tracking_code")?.trim();

  if (!trackingCode) {
    return NextResponse.json({ error: "Tracking code is required", delivery_status: "" }, { status: 400 });
  }

  const apiKey = process.env.STEADFAST_API_KEY;
  const secretKey = process.env.STEADFAST_SECRET_KEY;
  const baseUrl = (process.env.STEADFAST_BASE_URL || "https://portal.packzy.com/api/v1").replace(/\/$/, "");

  if (!apiKey || !secretKey) {
    return NextResponse.json(
      { error: "Steadfast API credentials are not configured in Vercel environment variables.", delivery_status: "" },
      { status: 500 }
    );
  }

  try {
    const response = await fetch(`${baseUrl}/status_by_trackingcode/${encodeURIComponent(trackingCode)}`, {
      method: "GET",
      headers: {
        "Api-Key": apiKey,
        "Secret-Key": secretKey,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      cache: "no-store",
    });

    const payload = await response.json().catch(() => ({}));
    const deliveryStatus = findDeliveryStatus(payload);

    if (!response.ok) {
      return NextResponse.json(
        {
          ...payload,
          delivery_status: deliveryStatus,
          error: payload?.message || payload?.error || `Steadfast API returned ${response.status}`,
        },
        { status: response.status }
      );
    }

    return NextResponse.json({ ...payload, delivery_status: deliveryStatus });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Steadfast API request failed", delivery_status: "" },
      { status: 500 }
    );
  }
}
