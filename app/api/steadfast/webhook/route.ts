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
  try {
    const payload = await request.json().catch(() => ({}));
    console.log("Steadfast webhook payload received:", JSON.stringify(payload));

    const invoice: string = payload?.invoice || "";
    const trackingCode: string =
      payload?.tracking_code || payload?.consignment?.tracking_code || "";
    const statusValue = payload?.status_type || payload?.status || "";

    if (!invoice) {
      // ইনভয়েস না পেলেও Steadfast কে 200 দিতে হবে নাহলে বারবার ফেইল দেখাবে
      return NextResponse.json({ success: true, message: "Invoice missing but acknowledged" }, { status: 200 });
    }

    // "MCB-123" থেকে বা সরাসরি আইডি বের করা
    const orderId = invoice.replace(/^MCB-/i, "").trim();
    if (!orderId) {
      return NextResponse.json({ success: true, message: "Invalid order id format" }, { status: 200 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const updateData: Record<string, any> = { status: mapStatus(statusValue) };
    if (trackingCode) updateData.tracking_code = trackingCode;

    const { error } = await supabaseAdmin.from("orders").update(updateData).eq("id", orderId);

    if (error) {
      console.error("Supabase update error in webhook:", error.message);
      // ডেটাবেসে এরর হলেও Steadfast-কে 200 OK দিতে হয়, না হলে ওরা বারবার কল করতে থাকে
      return NextResponse.json({ success: false, error: error.message }, { status: 200 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err: any) {
    console.error("Webhook catch error:", err);
    return NextResponse.json({ success: true, error: err?.message }, { status: 200 });
  }
}
