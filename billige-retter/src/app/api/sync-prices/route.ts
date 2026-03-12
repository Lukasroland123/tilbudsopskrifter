// OPEN PUNKT: EAN-numre er ikke tilgængelige i det nuværende datasæt.
// Salling API er godkendt men ikke i brug pt. — priser hentes via screenshot-pipeline.
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    ok: false,
    error: "EAN-baseret prissynkronisering er ikke aktiv. Priser uploades via screenshot-pipeline.",
  });
}
