import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const trackingCode = url.searchParams.get("tracking_code")?.trim();
  if (!trackingCode) {
    return NextResponse.json({ error: "Tracking code is required", delivery_status: "" }, { status: 400 });
  }

  // Keep the existing /api/steadfast URL used by Order History, but route the
  // lookup through the unified courier tracker. SFR codes are detected as
  // Steadfast; other codes are tried against Pathao automatically.
  const target = new URL("/api/tracking", url.origin);
  target.searchParams.set("tracking_code", trackingCode);

  try {
    const response = await fetch(target, { cache: "no-store" });
    const payload = await response.json().catch(() => ({}));
    return NextResponse.json(payload, {
      status: response.status,
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Courier tracking request failed", delivery_status: "" },
      { status: 502, headers: { "Cache-Control": "no-store" } }
    );
  }
}
