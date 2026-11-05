import * as crypto from "crypto";
import type { NextResponse } from "next/server";
import type { SessionRepository } from "@/lib/repositories/session-repository";
import { DynamoDbSessionRepository } from "@/lib/repositories/session-repository";
export const CUSTOMER_SESSION_COOKIE = "mamaai_customer_session";
export const CUSTOMER_SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;
export const TRUSTED_DEVICE_SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;
const tokenPattern = /^[A-Za-z0-9_-]{43}$/;
/**
 * Do not derive an account identifier from an email address or phone number.
 * Possession of a contact value is not proof of account ownership. A future
 * verified login provider must supply the stable user id before a session can
 * be issued.
 */
export function customerUserIdFromIdentity(_identity: string): never {
  throw new Error("IDENTITY_DERIVATION_DISABLED");
}
export function createOpaqueSessionToken() { return crypto.randomBytes(32).toString("base64url"); }
export function hashSessionToken(token: string) { return crypto.createHash("sha256").update(token).digest("hex"); }
export async function createCustomerSession(userId: string, repository: SessionRepository = new DynamoDbSessionRepository(), device?: { id: string; activationVersion: number; label?: string }) { const token = createOpaqueSessionToken(); const createdAt = new Date(); const expiresAt = new Date(createdAt.getTime() + CUSTOMER_SESSION_MAX_AGE_SECONDS * 1000); await repository.create({ userId, tokenHash: hashSessionToken(token), createdAt: createdAt.toISOString(), expiresAt: expiresAt.toISOString(), expiresAtEpoch: Math.floor(expiresAt.getTime() / 1000), deviceId: device?.id, deviceActivationVersion: device?.activationVersion, metadata: device?.label ? { deviceLabel: device.label } : undefined }); return { token, expiresAt }; }
export function setCustomerSessionCookie(response: NextResponse, token: string, expiresAt: Date, persistent = true) { response.cookies.set(CUSTOMER_SESSION_COOKIE, token, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", ...(persistent ? { expires: expiresAt, maxAge: Math.max(0, Math.floor((expiresAt.getTime() - Date.now()) / 1000)) } : {}) }); }
export function clearCustomerSessionCookie(response: NextResponse) { response.cookies.set(CUSTOMER_SESSION_COOKIE, "", { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 0 }); }
export async function verifyCustomerSession(value: string | undefined, repository: SessionRepository = new DynamoDbSessionRepository()) { if (!value || !tokenPattern.test(value)) return undefined; const record = await repository.get(hashSessionToken(value)); if (!record || record.revokedAt || new Date(record.expiresAt).getTime() <= Date.now()) return undefined; return { userId: record.userId, tokenHash: record.tokenHash, deviceId: record.deviceId, deviceActivationVersion: record.deviceActivationVersion, passwordVersion: record.passwordVersion }; }


