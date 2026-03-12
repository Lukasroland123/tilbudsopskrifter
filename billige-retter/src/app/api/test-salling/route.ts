import { fetchProductByEan } from "@/lib/salling";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const ean = req.nextUrl.searchParams.get("ean");
  const storeId = req.nextUrl.searchParams.get("storeId");

  if (!ean || !storeId) {
    return NextResponse.json(
      { error: "Mangler ?ean=...&storeId=... i URL" },
      { status: 400 }
    );
  }

  try {
    const product = await fetchProductByEan(ean, storeId);
    if (!product) {
      return NextResponse.json({ ok: false, error: "Produkt ikke fundet" });
    }
    return NextResponse.json({ ok: true, product });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
