import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function mapStatus(value: unknown): string {
  const status = String(value || "").trim().toLowerCase();
  if (["delivered", "partial_delivered"].includes(status)) return "Delivered";
  if (status === "cancelled") return "Cancelled";
  if (status.includes("return")) return "Returned";
  return "Processing";
}

export async function POST(request: Request) {
  // Steadfast Bearer token diye request verify kora
  const authHeader = request.headers.get("authorization") || "";
  const expectedToken = process.env.STEADFAST_WEBHOOK_TOKEN;
  if (!expectedToken || authHeader !== `Bearer ${expectedToken}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = await request.json().catch(() => ({}));
  console.log("Steadfast webhook payload:", JSON.stringify(payload)); // prothom kicchudin log dekhe field name confirm koro

  const invoice: string = payload?.invoice || "";
  const trackingCode: string =
    payload?.tracking_code || payload?.consignment?.tracking_code || "";
  const statusValue = payload?.status_type || payload?.status || "";

  if (!invoice) {
    return NextResponse.json({ error: "invoice missing in payload" }, { status: 400 });
  }

  // "MCB-123" theke "123" ber kora
  const orderId = invoice.replace(/^MCB-/i, "").trim();
  if (!orderId) {
    return NextResponse.json({ error: "Could not parse order id" }, { status: 400 });
  }

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const updateData: Record<string, any> = { status: mapStatus(statusValue) };
  if (trackingCode) updateData.tracking_code = trackingCode;

  const { error } = await supabaseAdmin.from("orders").update(updateData).eq("id", orderId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
