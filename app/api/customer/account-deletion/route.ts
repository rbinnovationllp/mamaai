import { NextResponse } from "next/server";
import { CustomerDataRepository } from "@/lib/repositories/customer-data-repository";
import { authErrorResponse, requireUser } from "@/lib/server/auth";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
 try { const user = await requireUser(request); const preflight = await new CustomerDataRepository().deletionPreflightForVerifiedUser(user.userId); return NextResponse.json({ deletion: preflight, message: "Deletion has not been performed. Approval of retention rules, session revocation support, and a controlled deletion worker is required." }, { status: 409 }); }
 catch (error) { const auth = authErrorResponse(error); if (auth) return auth; return NextResponse.json({ error: { code: "DELETION_PREFLIGHT_UNAVAILABLE", message: "Deletion preflight is temporarily unavailable." } }, { status: 503 }); }
}
