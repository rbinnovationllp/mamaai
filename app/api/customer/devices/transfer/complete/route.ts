import * as crypto from "crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { setCustomerSessionCookie } from "@/lib/server/customer-session";
import { enforceDurableRateLimit, RateLimitExceededError, requestIpAddress } from "@/lib/server/durable-rate-limit";
import { requireSameOrigin } from "@/lib/server/request-security";
import { MobilePasswordAuthError, MobilePasswordAuthService, normaliseMobile } from "@/lib/services/mobile-password-auth-service";

const schema = z.object({ mobile: z.string().min(8).max(32), password: z.string().min(1).max(256), authorizationCode: z.string().min(20).max(128), deviceLabel: z.string().trim().max(80).optional() });
function deviceCookie(request: Request) { return request.headers.get("cookie")?.split(";").map((item) => item.trim()).find((item) => item.startsWith("mamaai_device="))?.slice("mamaai_device=".length); }
export async function POST(request: Request) {
  try {
    requireSameOrigin(request); const body = schema.parse(await request.json()); const mobile = normaliseMobile(body.mobile);
    await Promise.all([enforceDurableRateLimit({ scope: "auth_login_ip", key: requestIpAddress(request), limit: 5, windowSeconds: 900 }), enforceDurableRateLimit({ scope: "auth_login_mobile", key: mobile, limit: 5, windowSeconds: 900 })]);
    const deviceId = deviceCookie(request) ?? crypto.randomUUID();
    const result = await new MobilePasswordAuthService().completeAuthorizedTransfer({ mobile, password: body.password, authorizationCode: body.authorizationCode, deviceId, deviceLabel: body.deviceLabel ?? "New primary device" });
    const response = NextResponse.json({ transferred: true, confirmationPending: result.confirmationPending });
    setCustomerSessionCookie(response, result.token, result.expiresAt);
    response.cookies.set("mamaai_device", deviceId, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 24 * 365 });
    return response;
  } catch (error) {
    const status = error instanceof RateLimitExceededError ? 429 : error instanceof MobilePasswordAuthError ? error.status : error instanceof z.ZodError ? 400 : 500;
    return NextResponse.json({ error: { code: error instanceof MobilePasswordAuthError ? error.code : "TRANSFER_COMPLETION_FAILED", message: error instanceof Error ? error.message : "Unable to complete transfer." } }, { status });
  }
}
