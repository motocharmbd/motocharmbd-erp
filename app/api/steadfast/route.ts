import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const trackingCode = searchParams.get("tracking_code")?.trim();

  if (!trackingCode) {
    return NextResponse.json({ error: "Tracking code is required" }, { status: 400 });
  }

  const apiKey = process.env.STEADFAST_API_KEY || "0ocu3vpovq1ymvdhtpuz0jys4uhzuga3";
  const secretKey = process.env.STEADFAST_SECRET_KEY || "kqx3xtby4mhsenzih2qwtci6";

  try {
    const steadfastUrl = `https://portal.packzy.com/api/v1/status_by_trackingcode/${encodeURIComponent(trackingCode)}`;

    const response = await fetch(steadfastUrl, {
      method: "GET",
      headers: {
        "Api-Key": apiKey,
        "Secret-Key": secretKey,
        "api-key": apiKey,
        "secret-key": secretKey,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      cache: "no-store",
    });

    const payload = await response.json();

    // Steadfast responses can be wrapped in data/data. Normalize the status
    // so the Order History page always receives delivery_status at the root.
    const candidates = [
      payload?.delivery_status,
      payload?.status,
      payload?.data?.delivery_status,
      payload?.data?.status,
      payload?.data?.data?.delivery_status,
      payload?.data?.data?.status,
    ];

    const deliveryStatus = candidates.find(
      (value) => typeof value === "string" && value.trim().length > 0
    );

    if (!response.ok) {
      return NextResponse.json(
        {
          ...payload,
          delivery_status: deliveryStatus || "",
          error: payload?.message || payload?.error || `Steadfast API returned ${response.status}`,
        },
        { status: response.status }
      );
    }

    return NextResponse.json({
      ...payload,
      delivery_status: deliveryStatus || "",
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Steadfast API request failed", delivery_status: "" },
      { status: 500 }
    );
  }
}
