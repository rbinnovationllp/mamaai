import { NextResponse } from "next/server";
import { z } from "zod";
import { PasswordRecoveryError, PasswordRecoveryService } from "@/lib/services/password-recovery-service";
import { MobilePasswordAuthError } from "@/lib/services/mobile-password-auth-service";
import { clearCustomerSessionCookie } from "@/lib/server/customer-session";
import { requireSameOrigin } from "@/lib/server/request-security";
import { authErrorResponse } from "@/lib/server/auth";
import { enforceDurableRateLimit, requestIpAddress, stableRateLimitKey, RateLimitExceededError } from "@/lib/server/durable-rate-limit";
const contact = { method: z.enum(["mobile", "email"]), identifier: z.string().trim().min(3).max(254) };
const schema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("request"), ...contact }),
  z.object({ action: z.literal("verify"), challengeId: z.string().uuid(), code: z.string().regex(/^\d{6}$/), newPassword: z.string().min(12).max(256) }),
  z.object({ action: z.literal("recovery_code"), ...contact, recoveryCode: z.string().trim().min(8).max(64), newPassword: z.string().min(12).max(256) }),
]);
export async function POST(request: Request) {
  try {
    requireSameOrigin(request);
    await enforceDurableRateLimit({ scope: "auth_recovery_ip", key: requestIpAddress(request), limit: 10, windowSeconds: 900 });
    const raw = z.object({}).passthrough().parse(await request.json());
    // Retain old mobile+saved-code callers without introducing an email requirement.
    const input = schema.parse(raw.action ? raw : { ...raw, action: "recovery_code", method: "mobile", identifier: raw.mobile });
    const contactKey = input.action === "verify" ? input.challengeId : `${input.method}:${input.identifier.normalize("NFKC").trim().toLowerCase().replace(/[\s()-]/g, "")}`;
    await enforceDurableRateLimit({ scope: "auth_recovery_mobile", key: stableRateLimitKey(contactKey), limit: input.action === "request" ? 3 : 5, windowSeconds: 900 });
    const service = new PasswordRecoveryService();
    if (input.action === "request") return NextResponse.json({ accepted: true, ...(await service.request(input.method, input.identifier)) }, { status: 202 });
    if (input.action === "verify") await service.verify(input.challengeId, input.code, input.newPassword);
    else await service.savedCode(input.method, input.identifier, input.recoveryCode, input.newPassword);
    const response = NextResponse.json({ reset: true, signInRequired: true });
    clearCustomerSessionCookie(response);
    response.cookies.set("mamaai_device", "", { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 0 });
    response.cookies.set("mamaai_session", "", { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 0 });
    return response;
  } catch (error) {
    const auth = authErrorResponse(error); if (auth) return auth;
    if (error instanceof RateLimitExceededError) return NextResponse.json({ error: { code: "RECOVERY_RATE_LIMITED" } }, { status: 429, headers: { "Retry-After": String(error.retryAfterSeconds) } });
    const unavailable = error instanceof PasswordRecoveryError && error.code === "RECOVERY_DELIVERY_UNAVAILABLE";
    const status = unavailable ? 503 : error instanceof PasswordRecoveryError || error instanceof MobilePasswordAuthError || error instanceof z.ZodError ? 400 : 503;
    return NextResponse.json({ error: { code: unavailable ? "RECOVERY_DELIVERY_UNAVAILABLE" : status === 503 ? "RECOVERY_UNAVAILABLE" : "RECOVERY_INVALID", message: "Recovery could not be completed." } }, { status });
  }
}
