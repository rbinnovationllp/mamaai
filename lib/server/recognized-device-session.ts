import type { NextResponse } from "next/server";
import { DynamoDbSessionRepository } from "@/lib/repositories/session-repository";
import { hashSessionToken, setCustomerSessionCookie, TRUSTED_DEVICE_SESSION_MAX_AGE_SECONDS } from "./customer-session";
import { AuthError, type AuthenticatedUser } from "./auth";

/** Called only after requireUser has validated the account/device/password versions. */
export async function renewRecognizedDeviceSession(request: Request, response: NextResponse, user: AuthenticatedUser, repository = new DynamoDbSessionRepository(), now = new Date()) {
  response.headers.set("Cache-Control", "private, no-store");
  if (user.source !== "customer_session" || !user.tokenHash) return response;
  const record = await repository.get(user.tokenHash);
  const cookie = (name: string) => request.headers.get("cookie")?.split(";").map(s => s.trim()).find(s => s.startsWith(`${name}=`))?.slice(name.length + 1);
  if (!record || record.revokedAt || new Date(record.expiresAt).getTime() <= now.getTime()) throw new AuthError("SESSION_REVOKED", "Please sign in again.");
  if (!record.rememberDevice || !record.deviceId || cookie("mamaai_device") !== record.deviceId) return response;
  const token = cookie("mamaai_customer_session");
  if (!token || hashSessionToken(token) !== user.tokenHash) throw new AuthError("SESSION_DEVICE_MISMATCH", "Please verify this device.");
  let expiresAt = new Date(record.expiresAt);
  if (expiresAt.getTime() - now.getTime() < 45 * 24 * 60 * 60 * 1000) {
    expiresAt = new Date(now.getTime() + TRUSTED_DEVICE_SESSION_MAX_AGE_SECONDS * 1000);
    await repository.renew(user.tokenHash, record.expiresAt, expiresAt.toISOString(), now.toISOString());
  }
  setCustomerSessionCookie(response, token, expiresAt, true);
  response.cookies.set("mamaai_device", record.deviceId, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: TRUSTED_DEVICE_SESSION_MAX_AGE_SECONDS });
  return response;
}
