import { NextResponse } from "next/server";
import { CustomerDataRepository } from "@/lib/repositories/customer-data-repository";
import { authErrorResponse, requireUser } from "@/lib/server/auth";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
 try { const user = await requireUser(request); const data = await new CustomerDataRepository().exportForVerifiedUser(user.userId); return NextResponse.json(data, { headers: { "Content-Disposition": "attachment; filename=\"mamaai-account-data.json\"", "Cache-Control": "no-store" } }); }
 catch (error) { const auth = authErrorResponse(error); if (auth) return auth; return NextResponse.json({ error: { code: "DATA_EXPORT_UNAVAILABLE", message: "Your export is temporarily unavailable." } }, { status: 503 }); }
}
