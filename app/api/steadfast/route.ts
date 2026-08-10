import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const trackingCode = searchParams.get("tracking_code");

  if (!trackingCode) {
    return NextResponse.json({ error: "Tracking code is required" }, { status: 400 });
  }

  const apiKey = process.env.STEADFAST_API_KEY || "0ocu3vpovq1ymvdhtpuz0jys4uhzuga3";
  const secretKey = process.env.STEADFAST_SECRET_KEY || "kqx3xtby4mhsenzih2qwtci6";

  try {
    // Steadfast status API endpoint
    const steadfastUrl = `https://portal.packzy.com/api/v1/status_by_trackingcode/${trackingCode}`;
    
    const response = await fetch(steadfastUrl, {
      method: "GET",
      headers: {
        "Api-Key": apiKey,
        "Secret-Key": secretKey,
        "api-key": apiKey,
        "secret-key": secretKey,
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
    });

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}