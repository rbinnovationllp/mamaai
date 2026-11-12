import { NextResponse } from "next/server";
import { CustomerDataRepository } from "@/lib/repositories/customer-data-repository";
import { authErrorResponse, requireUser } from "@/lib/server/auth";
import { clearCustomerSessionCookie } from "@/lib/server/customer-session";
import { requireSameOrigin } from "@/lib/server/request-security";
import { z } from "zod";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
 try { requireSameOrigin(request); const user = await requireUser(request); const body = z.object({ confirmation: z.literal("DELETE MY ACCOUNT") }).safeParse(await request.json()); if (!body.success) return NextResponse.json({ error: { code: "DELETION_CONFIRMATION_REQUIRED", message: "Type DELETE MY ACCOUNT to confirm." } }, { status: 400 }); const deletion = await new CustomerDataRepository().deleteApplicationDataForVerifiedUser(user.userId, user.tokenHash); const response = NextResponse.json({ deleted: true, deletion }); clearCustomerSessionCookie(response); return response; }
 catch (error) { const auth = authErrorResponse(error); if (auth) return auth; return NextResponse.json({ error: { code: "DELETION_PREFLIGHT_UNAVAILABLE", message: "Deletion preflight is temporarily unavailable." } }, { status: 503 }); }
}
