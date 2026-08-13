import { NextResponse } from 'next/server';

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
    });

    const data = await apiResponse.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("BD Courier API Error:", error);
    return NextResponse.json({ error: "Failed to fetch data from BD Courier" }, { status: 500 });
  }
}