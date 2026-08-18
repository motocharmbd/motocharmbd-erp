import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase"; // আপনার প্রজেক্টের সুপাবেস কানেকশন পাথ অনুযায়ী ঠিক করে নিতে পারেন

export async function POST(request: Request) {
  try {
    const { orderId } = await request.json();

    if (!orderId) {
      return NextResponse.json({ success: false, message: "Order ID is required" }, { status: 400 });
    }

    // ১. সুপাবেস থেকে অর্ডারটি খুঁজে বের করুন
    const { data: order, error: fetchError } = await supabase
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .single();

    if (fetchError || !order) {
      return NextResponse.json({ success: false, message: "Order not found" }, { status: 404 });
    }

    // যদি ইতিমধ্যে ট্র্যাকিং কোড থাকে
    if (order.tracking_code) {
      return NextResponse.json({ success: true, tracking_code: order.tracking_code });
    }

    // ২. এখানে Steadfast API-এ রিকোয়েস্ট পাঠানোর কোড লিখবেন 
    // (আপনার Steadfast API Key এবং Secret ব্যবহার করে কুরিয়ারে অর্ডার প্লেস করবেন)
    
    /* 
    const steadfastRes = await fetch("https://portal.packzy.com/api/v1/create_order", {
      method: "POST",
      headers: {
        "Api-Key": process.env.STEADFAST_API_KEY || "",
        "Secret-Key": process.env.STEADFAST_SECRET_KEY || "",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        invoice: String(order.id),
        recipient_name: order.customer_name,
        recipient_phone: order.phone,
        recipient_address: order.address,
        cod_amount: order.total_amount - (order.advance_amount || 0),
      }),
    });
    const steadfastData = await steadfastRes.json();
    const trackingCode = steadfastData?.consignment?.tracking_code;
    */

    // সাময়িক টেস্ট করার জন্য বা যদি Steadfast API কনফিগার করা না থাকে:
    const trackingCode = `MCB-TRK-${Math.floor(100000 + Math.random() * 900000)}`;

    // ৩. ডাটাবেজে ট্র্যাকিং কোড সেভ করে দিন
    await supabase
      .from("orders")
      .update({ tracking_code: trackingCode, status: "Processing" })
      .eq("id", orderId);

    return NextResponse.json({
      success: true,
      tracking_code: trackingCode,
    });

  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
