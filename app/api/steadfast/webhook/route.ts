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
      payload?.tracking_id || payload?.tracking_code || payload?.consignment?.tracking_code || "";
    const consignmentId = payload?.consignment_id || "";
    const statusValue = payload?.status_type || payload?.status || "";

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    let orderId = "";

    // ১. যদি ইনভয়েস থাকে তবে সেখান থেকে আইডি বের করো
    if (invoice) {
      orderId = invoice.replace(/^MCB-/i, "").trim();
    } 
    // ২. যদি ইনভয়েস না থাকে, তবে consignment_id বা tracking_id দিয়ে ডেটাবেস থেকে অর্ডার খুঁজে বের করো
    else if (consignmentId || trackingCode) {
      let query = supabaseAdmin.from("orders").select("id");
      
      if (consignmentId) {
        query = query.eq("consignment_id", consignmentId); // ডেটাবেসে consignment_id কলাম থাকতে হবে
      } else if (trackingCode) {
        query = query.eq("tracking_code", trackingCode);
      }

      const { data: foundOrders } = await query;
      if (foundOrders && foundOrders.length > 0) {
        orderId = foundOrders[0].id;
      }
    }

    if (!orderId) {
      // অর্ডার আইডি না পাওয়া গেলেও Steadfast-কে 200 দিতে হবে যাতে কল ফেইল না দেখায়
      return NextResponse.json({ success: true, message: "Order could not be matched, but acknowledged" }, { status: 200 });
    }

    const updateData: Record<string, any> = { status: mapStatus(statusValue) };
    if (trackingCode) updateData.tracking_code = trackingCode;
    if (consignmentId) updateData.consignment_id = consignmentId;

    const { error } = await supabaseAdmin.from("orders").update(updateData).eq("id", orderId);

    if (error) {
      console.error("Supabase update error in webhook:", error.message);
      return NextResponse.json({ success: false, error: error.message }, { status: 200 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err: any) {
    console.error("Webhook catch error:", err);
    return NextResponse.json({ success: true, error: err?.message }, { status: 200 });
  }
}
