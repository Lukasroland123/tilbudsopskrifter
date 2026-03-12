import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const brand = req.nextUrl.searchParams.get("brand") ?? "netto";

  const url = `https://api.sallinggroup.com/v2/stores?brand=${brand}&country=dk&zip=8000`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${process.env.SALLING_STORES_API_KEY}`,
    },
  });

  if (!res.ok) {
    return NextResponse.json(
      { error: `Salling Stores API fejl: ${res.status}` },
      { status: 500 }
    );
  }

  const data = await res.json();

  return NextResponse.json({
    total: data.length,
    stores: data.map((s: { id: string; name: string; address: { street: string; city: string; zip: string } }) => ({
      id: s.id,
      name: s.name,
      street: s.address.street,
      city: s.address.city,
      zip: s.address.zip,
    })),
  });
}
