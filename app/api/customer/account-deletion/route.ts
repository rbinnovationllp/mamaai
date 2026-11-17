import { NextResponse } from "next/server";
import { CustomerDataRepository } from "@/lib/repositories/customer-data-repository";
import { authErrorResponse, requireUser } from "@/lib/server/auth";
import { clearCustomerSessionCookie } from "@/lib/server/customer-session";
import { requireSameOrigin } from "@/lib/server/request-security";
import { z } from "zod";
export const dynamic = "force-dynamic";

function deletionFailure(error: unknown) {
 const name = error && typeof error === "object" && "name" in error && typeof error.name === "string" ? error.name : "UnknownError";
 if (name === "AccessDeniedException" || name === "UnauthorizedException") return { code: "DELETION_STORAGE_PERMISSION_DENIED", message: "Deletion is temporarily unavailable. Your account has not been deleted." };
 if (name === "ResourceNotFoundException") return { code: "DELETION_STORAGE_UNAVAILABLE", message: "Deletion storage is temporarily unavailable. Your account has not been deleted." };
 if (name === "TimeoutError" || name === "AbortError") return { code: "DELETION_STORAGE_TIMEOUT", message: "Deletion is taking too long. Your account has not been confirmed as deleted." };
 if (name === "ValidationException") return { code: "DELETION_STORAGE_CONFIGURATION_ERROR", message: "Deletion storage is temporarily unavailable. Your account has not been deleted." };
 return { code: "DELETION_PREFLIGHT_UNAVAILABLE", message: "Deletion preflight is temporarily unavailable." };
}
export async function POST(request: Request) {
 try { requireSameOrigin(request); const user = await requireUser(request); const body = z.object({ confirmation: z.literal("DELETE MY ACCOUNT") }).safeParse(await request.json()); if (!body.success) return NextResponse.json({ error: { code: "DELETION_CONFIRMATION_REQUIRED", message: "Type DELETE MY ACCOUNT to confirm." } }, { status: 400 }); const deletion = await new CustomerDataRepository().deleteApplicationDataForVerifiedUser(user.userId, user.tokenHash); const response = NextResponse.json({ deleted: true, deletion }); clearCustomerSessionCookie(response); return response; }
 catch (error) { const auth = authErrorResponse(error); if (auth) return auth; const failure = deletionFailure(error); console.error("ACCOUNT_DELETION_FAILED", { category: failure.code }); return NextResponse.json({ error: failure }, { status: 503 }); }
}
