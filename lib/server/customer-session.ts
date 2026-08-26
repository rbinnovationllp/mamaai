import crypto from "crypto";
import type { NextResponse } from "next/server";

export const CUSTOMER_SESSION_COOKIE = "mamaai_customer_session";

export interface CustomerSession {
  userId: string;
  signature: string;
}

function authSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("AUTH_SECRET is required for customer sessions.");
  }
  return secret;
}

export function customerUserIdFromIdentity(identity: string) {
  const normalized = identity.trim().toLowerCase();
  const hash = crypto.createHash("sha256").update(normalized).digest("hex").slice(0, 24);
  return `customer_${hash}`;
}

export function signCustomerUserId(userId: string) {
  return crypto.createHmac("sha256", authSecret()).update(userId).digest("hex");
}

export function serializeCustomerSession(userId: string) {
  return Buffer.from(
    JSON.stringify({
      userId,
      signature: signCustomerUserId(userId),
    })
  ).toString("base64url");
}

export function parseCustomerSession(value?: string | null): CustomerSession | undefined {
  if (!value) return undefined;
  try {
    const parsed = JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as CustomerSession;
    if (!parsed.userId || !parsed.signature) return undefined;
    const expected = signCustomerUserId(parsed.userId);
    const expectedBuffer = Buffer.from(expected);
    const providedBuffer = Buffer.from(parsed.signature);
    if (
      expectedBuffer.length !== providedBuffer.length ||
      !crypto.timingSafeEqual(expectedBuffer, providedBuffer)
    ) {
      return undefined;
    }
    return parsed;
  } catch {
    return undefined;
  }
}

export function setCustomerSessionCookie(response: NextResponse, userId: string) {
  response.cookies.set(CUSTOMER_SESSION_COOKIE, serializeCustomerSession(userId), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 180,
  });
}
