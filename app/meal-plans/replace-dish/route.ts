import { NextResponse } from "next/server";

// This legacy endpoint is retired. Keeping it dependency-free ensures importing it has no external-service setup.
export async function POST() {
  return NextResponse.json(
    { error: { code: "GONE", message: "Use the authenticated meal replacement endpoint." } },
    { status: 410 }
  );
}
