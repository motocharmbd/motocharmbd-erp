import { NextResponse } from 'next/server';

function toNumber(value: unknown) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function findSummary(value: any): any | null {
  if (!value || typeof value !== 'object') return null;
  if (value.summary && typeof value.summary === 'object') return value.summary;
  for (const child of Object.values(value)) {
    const found = findSummary(child);
    if (found) return found;
  }
  return null;
}

export async function POST(request: Request) {
  try {
    const { phoneNumber } = await request.json();

    if (!phoneNumber) {
      return NextResponse.json({ error: "Phone number is required" }, { status: 400 });
    }

    const apiResponse = await fetch('https://api.bdcourier.com/courier-check', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer I68ktyQueEk4GGzgiJwIHN6xLnZDRq6t6mqXqse9kw7YHfQKMfgdAVTeD9bl',
      },
      body: JSON.stringify({ phone: phoneNumber }),
      cache: 'no-store',
    });

    const data = await apiResponse.json();
    const summary = findSummary(data);
    const total = toNumber(summary?.total_parcel);
    const successful = toNumber(summary?.success_parcel);
    const score = total > 0 ? Math.max(0, Math.min(100, Math.round((successful / total) * 100))) : 0;

    return NextResponse.json({ ...data, score }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error("BD Courier API Error:", error);
    return NextResponse.json({ error: "Failed to fetch data from BD Courier", score: 0 }, { status: 500 });
  }
}