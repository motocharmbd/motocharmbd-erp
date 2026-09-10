import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

export const dynamic = "force-dynamic";

const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL || "", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "");
const PATHAO_BASE_URL = (process.env.PATHAO_BASE_URL || "https://api-hermes.pathao.com").replace(/\/$/, "");
const STEADFAST_BASE_URL = (process.env.STEADFAST_BASE_URL || "https://portal.packzy.com/api/v1").replace(/\/$/, "");
const CARRYBEE_BASE_URL = (process.env.CARRYBEE_BASE_URL || "https://developers.carrybee.com").replace(/\/$/, "");
const REQUEST_TIMEOUT_MS = 8000;

type Bucket = "success" | "cancel" | "pending" | "unknown";
type Stats = { name:string; success:number; cancel:number; pending:number; total:number; success_ratio:number; configured:boolean; source:string; error?:string };

function normalizePhone(v:unknown){const r=String(v??"").replace(/\D/g,"");if(/^8801[3-9]\d{8}$/.test(r))return `0${r.slice(3)}`;return r;}
function bucket(v:unknown):Bucket{const s=String(v||"").toLowerCase().replace(/[ _-]+/g,"");if(["delivered","partialdelivered","deliveredapprovalpending","partialdeliveredapprovalpending","paid","completed","success"].includes(s))return"success";if(["cancelled","cancel","rejected","decline"].includes(s))return"cancel";if(["pending","processing","awaiting","hold"].includes(s))return"pending";return"unknown";}
function makeStats(name:string,configured:boolean,source:string):Stats{return{name,success:0,cancel:0,pending:0,total:0,success_ratio:0,configured,source};}
function withTimeout<T>(promise:Promise<T>,ms=REQUEST_TIMEOUT_MS):Promise<T>{return Promise.race([promise,new Promise<T>((_,reject)=>setTimeout(()=>reject(new Error("Courier API timeout")),ms))]);
}

async function getPathaoToken(){const clientId=process.env.PATHAO_CLIENT_ID,clientSecret=process.env.PATHAO_CLIENT_SECRET,refreshToken=process.env.PATHAO_REFRESH_TOKEN,username=process.env.PATHAO_PASSWORD;if(!clientId||!clientSecret||!refreshToken)return null;try{const r=await withTimeout(fetch(`${PATHAO_BASE_URL}/aladdin/api/v1/issue-token`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({client_id:clientId,client_secret:clientSecret,username,password:process.env.PATHAO_PASSWORD,grant_type:"password"})}));if(!r.ok)return null;const j=await r.json();return j?.access_token||null;}catch{return null;}}
async function checkPathao(code:string,token:string|null):Promise<Bucket>{if(!token)return"unknown";const r=await withTimeout(fetch(`${PATHAO_BASE_URL}/aladdin/api/v1/orders/${encodeURIComponent(code)}`,{headers:{"Authorization":`Bearer ${token}`}}));if(!r.ok)return"unknown";const j=await r.json();return bucket(j?.data?.status);}
async function checkSteadfast(code:string):Promise<Bucket>{const key=process.env.STEADFAST_API_KEY,secret=process.env.STEADFAST_SECRET_KEY;if(!key||!secret)return"unknown";const r=await withTimeout(fetch(`${STEADFAST_BASE_URL}/status_by_code/${encodeURIComponent(code)}?api_key=${key}&secret_key=${secret}`));if(!r.ok)return"unknown";const j=await r.json();return bucket(j?.status);}
async function checkCarryBee(code:string):Promise<Bucket>{const id=process.env.CARRYBEE_CLIENT_ID||process.env.CARRYBEE_API_KEY,secret=process.env.CARRYBEE_CLIENT_SECRET||process.env.CARRYBEE_API_SECRET;if(!id||!secret)return"unknown";const h=crypto.createHmac("sha256",secret).update(code).digest("hex");const r=await withTimeout(fetch(`${CARRYBEE_BASE_URL}/api/shipments/${encodeURIComponent(code)}`,{headers:{"X-Client-Id":id,"X-Signature":h}}));if(!r.ok)return"unknown";const j=await r.json();return bucket(j?.status);}
function courierForCode(code:string){const v=String(code||"").trim();if(/^SFR/i.test(v))return"Steadfast";if(/^F[0-9A-Z]/i.test(v))return"CarryBee";if(v)return"Pathao";return null;}
function apply(item:Stats,result:Bucket){if(result==="success")item.success++;else if(result==="cancel")item.cancel++;else if(result==="pending")item.pending++;}

// New: Check Steadfast for phone number fraud history
async function checkSteadfastPhoneFraud(phone:string):Promise<{success:boolean;data?:any;error?:string}>{
  const key=process.env.STEADFAST_API_KEY,secret=process.env.STEADFAST_SECRET_KEY;
  if(!key||!secret)return{success:false,error:"Steadfast API not configured"};
  
  try{
    const r=await withTimeout(fetch(`${STEADFAST_BASE_URL}/get_balance?api_key=${key}&secret_key=${secret}`));
    if(!r.ok)throw new Error("Steadfast authentication failed");
    
    // Since Steadfast API doesn't have direct phone lookup, we'll use the orders approach
    // This is a placeholder for when API endpoint becomes available
    return{success:true,data:{source:"steadfast_api"}};
  }catch(e:any){
    return{success:false,error:e?.message};
  }
}

export async function POST(request:Request){
  try{
    const body=await request.json();
    const phone=normalizePhone(body?.phoneNumber??body?.phone);
    
    if(!/^01[3-9]\d{8}$/.test(phone))
      return NextResponse.json({success:false,error:"Invalid phone number format"},{ status:400});
    
    // First try to get orders from Supabase
    const {data:orders,error}=await db.from("orders").select("id,phone,status,tracking_code,order_date,total_amount,qty").eq("phone",phone).order("id",{ascending:false}).limit(100);
    
    if(error)throw error;
    
    const stats:Record<string,Stats>={
      Steadfast:makeStats("Steadfast",Boolean(process.env.STEADFAST_API_KEY&&process.env.STEADFAST_SECRET_KEY),"steadfast_api"),
      Pathao:makeStats("Pathao",Boolean(process.env.PATHAO_CLIENT_ID&&process.env.PATHAO_CLIENT_SECRET),"pathao_api"),
      CarryBee:makeStats("CarryBee",Boolean(process.env.CARRYBEE_CLIENT_ID||process.env.CARRYBEE_API_KEY),"carrybee_api")
    };
    
    const tracked=(orders||[]).map(o=>({order:o,code:String(o.tracking_code||"").trim(),courier:courierForCode(o.tracking_code||"")})).filter(x=>x.code&&x.courier).slice(0,30);
    
    let pathaoToken:string|null=null;
    if(tracked.some(x=>x.courier==="Pathao")){
      try{pathaoToken=await getPathaoToken();}catch(e:any){stats.Pathao.error=e?.message||"Pathao authentication failed";}
    }
    
    const results=await Promise.all(tracked.map(async ({order,code,courier})=>{
      const item=stats[courier];
      if(!item)return null;
      try{
        const result=courier==="Steadfast"?await checkSteadfast(code):courier==="Pathao"?await checkPathao(code,pathaoToken):await checkCarryBee(code);
        return{order,code,courier,result};
      }catch(e:any){
        item.error=e?.message;
        return null;
      }
    }));
    
    for(const row of results){
      if(!row)continue;
      apply(stats[row.courier],row.result);
    }
    
    // Handle orders without tracking codes
    for(const order of (orders||[]).filter(o=>!String(o.tracking_code||"").trim())){
      const local="Moto Charm BD";
      if(!stats[local])stats[local]=makeStats(local,true,"erp_history");
      apply(stats[local],bucket(order.status));
    }
    
    // Calculate success ratios
    for(const item of Object.values(stats)){
      item.total=item.success+item.cancel+item.pending;
      item.success_ratio=item.success+item.cancel?Number(((item.success/(item.success+item.cancel))*100).toFixed(2)):0;
    }
    
    const totalOrders=Object.values(stats).reduce((s,x)=>s+x.total,0);
    const totalDelivered=Object.values(stats).reduce((s,x)=>s+x.success,0);
    const totalCancelled=Object.values(stats).reduce((s,x)=>s+x.cancel,0);
    const score=totalOrders===0?0:Number(((totalDelivered/(totalDelivered+totalCancelled))*100).toFixed(2))||0;
    
    return NextResponse.json({
      success:true,
      source:"motocharmbd_erp_direct_courier_apis",
      third_party_fallback:false,
      phone,
      score,
      data:{
        summary:{
          total_parcel:totalOrders,
          success_parcel:totalDelivered,
          cancelled_parcel:totalCancelled,
          success_ratio:score
        },
        ...Object.fromEntries(Object.entries(stats).map(([k,v])=>[k.toLowerCase(),v]))
      }
    });
  }catch(e:any){
    console.error("Fraud check error:",e);
    return NextResponse.json({
      success:false,
      error:e?.message||"Internal server error"
    },{ status:500});
  }
}
