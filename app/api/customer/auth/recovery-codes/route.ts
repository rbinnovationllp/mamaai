import { NextResponse } from "next/server";
import { z } from "zod";
import { authErrorResponse, requireUser } from "@/lib/server/auth";
import { enforceDurableRateLimit, RateLimitExceededError } from "@/lib/server/durable-rate-limit";
import { requireSameOrigin } from "@/lib/server/request-security";
import { MobilePasswordAuthError, MobilePasswordAuthService } from "@/lib/services/mobile-password-auth-service";

const schema = z.object({ password: z.string().min(1).max(256) });
export async function POST(request: Request) {
  try {
    requireSameOrigin(request); const user = await requireUser(request); const { password } = schema.parse(await request.json());
    await enforceDurableRateLimit({ scope: "auth_password_user", key: user.userId, limit: 3, windowSeconds: 900 });
    const recoveryCodes = await new MobilePasswordAuthService().regenerateRecoveryCodes(user.userId, password);
    return NextResponse.json({ recoveryCodes, displayedOnce: true });
  } catch (error) {
    const auth = authErrorResponse(error); if (auth) return auth;
    const status = error instanceof RateLimitExceededError ? 429 : error instanceof MobilePasswordAuthError ? error.status : error instanceof z.ZodError ? 400 : 500;
    return NextResponse.json({ error: { code: error instanceof MobilePasswordAuthError ? error.code : "RECOVERY_CODES_FAILED", message: error instanceof Error ? error.message : "Unable to regenerate recovery codes." } }, { status });
  }
}
