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

function findSuccessRatio(value: any): number | null {
  if (!value || typeof value !== 'object') return null;
  const ratio = Number(value.success_ratio);
  if (Number.isFinite(ratio)) return ratio;
  for (const child of Object.values(value)) {
    const found = findSuccessRatio(child);
    if (found !== null) return found;
  }
  return null;
}

export async function POST(request: Request) {
  try {
    const { phoneNumber } = await request.json();

    if (!phoneNumber) {
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400 });
    }

    const token = process.env.BD_COURIER_BEARER_TOKEN;
    if (!token) {
      console.error('BD_COURIER_BEARER_TOKEN is not configured');
      return NextResponse.json(
        { error: 'Fraud checker is not configured. Add BD_COURIER_BEARER_TOKEN to the deployment environment.' },
        { status: 503, headers: { 'Cache-Control': 'no-store' } }
      );
    }

    const apiResponse = await fetch('https://api.bdcourier.com/courier-check', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ phone: String(phoneNumber).trim() }),
      cache: 'no-store',
    });

    const data = await apiResponse.json().catch(() => ({}));

    if (!apiResponse.ok) {
      console.error('BD Courier API returned', apiResponse.status, data);
      return NextResponse.json(
        { error: 'BD Courier API authentication/request failed', upstreamStatus: apiResponse.status },
        { status: apiResponse.status, headers: { 'Cache-Control': 'no-store' } }
      );
    }

    const summary = findSummary(data);
    const ratio = findSuccessRatio(data);
    const total = toNumber(summary?.total_parcel);
    const successful = toNumber(summary?.success_parcel);
    const score = ratio !== null
      ? Math.max(0, Math.min(100, Math.round(ratio)))
      : total > 0
        ? Math.max(0, Math.min(100, Math.round((successful / total) * 100)))
        : 0;

    return NextResponse.json({ ...data, score }, {
      status: 200,
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    console.error('BD Courier API Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch data from BD Courier', score: 0 },
      { status: 500, headers: { 'Cache-Control': 'no-store' } }
    );
  }
}
