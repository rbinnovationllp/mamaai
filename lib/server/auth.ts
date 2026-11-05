import * as crypto from "crypto";
import { NextResponse } from "next/server";
import { CUSTOMER_SESSION_COOKIE, verifyCustomerSession } from "./customer-session";
import { DynamoDbSessionRepository } from "@/lib/repositories/session-repository";
import { MobilePasswordAuthService } from "@/lib/services/mobile-password-auth-service";

export interface AuthenticatedUser { userId: string; source: "signed_header" | "customer_session"; tokenHash?: string; deviceId?: string; deviceActivationVersion?: number; passwordVersion?: number; }
export class AuthError extends Error { constructor(public code: string, message: string, public status = 401) { super(message); } }
function verifySignedUserHeader(request: Request): AuthenticatedUser | undefined {
  const userId = request.headers.get("x-mamaai-user-id")?.trim(); const signature = request.headers.get("x-mamaai-user-signature")?.trim(); const secret = process.env.AUTH_SECRET;
  if (!userId || !signature || !secret) return undefined;
  const expected = crypto.createHmac("sha256", secret).update(userId).digest("hex"); const expectedBuffer = Buffer.from(expected); const providedBuffer = Buffer.from(signature);
  if (expectedBuffer.length !== providedBuffer.length || !crypto.timingSafeEqual(expectedBuffer, providedBuffer)) throw new AuthError("INVALID_USER_SIGNATURE", "User authentication signature is invalid.");
  return { userId, source: "signed_header" };
}
function cookieValue(request: Request) { return request.headers.get("cookie")?.split(";").map((part) => part.trim()).find((part) => part.startsWith(`${CUSTOMER_SESSION_COOKIE}=`))?.slice(CUSTOMER_SESSION_COOKIE.length + 1); }
export async function requireUser(request: Request): Promise<AuthenticatedUser> {
  const signedUser = verifySignedUserHeader(request); if (signedUser) return signedUser;
  try { const session = await verifyCustomerSession(cookieValue(request), new DynamoDbSessionRepository()); if (session) { const browserDevice = request.headers.get("cookie")?.split(";").map(item => item.trim()).find(item => item.startsWith("mamaai_device="))?.slice("mamaai_device=".length); if (session.deviceId && browserDevice !== session.deviceId) throw new AuthError("SESSION_DEVICE_MISMATCH", "Please verify this device before continuing."); const active = await new MobilePasswordAuthService().isSessionDeviceActive(session.userId, session.deviceId, session.deviceActivationVersion, session.passwordVersion); if (!active) throw new AuthError("SESSION_REVOKED", "This device session is no longer active."); return { ...session, source: "customer_session" }; } }
  catch (error) { if (error instanceof AuthError) throw error; throw new AuthError("SESSION_UNAVAILABLE", "Session verification is temporarily unavailable.", 503); }
  throw new AuthError("AUTHENTICATION_REQUIRED", "Please sign in before using customer data features.");
}
export function authErrorResponse(error: unknown) { return error instanceof AuthError ? NextResponse.json({ error: { code: error.code, message: error.message } }, { status: error.status }) : undefined; }
