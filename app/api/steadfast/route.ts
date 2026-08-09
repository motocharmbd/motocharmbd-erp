import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Steadfast API credentials from environment variables
    const apiKey = process.env.STEADFAST_API_KEY;
    const secretKey = process.env.STEADFAST_SECRET_KEY;

    if (!apiKey || !secretKey) {
      return NextResponse.json(
        { error: "Steadfast API credentials missing in environment variables" },
        { status: 400 }
      );
    }

    // Call Steadfast Courier API endpoint for creating order/consignment
    const response = await fetch("https://portal.packzy.com/api/v1/create_order", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Api-Key": apiKey,
        "Secret-Key": secretKey,
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Something went wrong with Steadfast API" },
      { status: 500 }
    );
  }
}