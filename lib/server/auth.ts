import crypto from "crypto";
import { NextResponse } from "next/server";
import { CUSTOMER_SESSION_COOKIE, parseCustomerSession } from "./customer-session";

export interface AuthenticatedUser {
  userId: string;
  source: "signed_header" | "customer_session" | "demo_compatibility";
}

export class AuthError extends Error {
  constructor(
    public code: string,
    message: string,
    public status = 401
  ) {
    super(message);
  }
}

function isDemoAllowed() {
  return process.env.MAMA_AI_ALLOW_DEMO_IDENTITY === "true" || process.env.NODE_ENV !== "production";
}

function verifySignedUserHeader(request: Request) {
  const userId = request.headers.get("x-mamaai-user-id")?.trim();
  const signature = request.headers.get("x-mamaai-user-signature")?.trim();
  const secret = process.env.AUTH_SECRET;

  if (!userId || !signature || !secret) return undefined;

  const expected = crypto.createHmac("sha256", secret).update(userId).digest("hex");
  const expectedBuffer = Buffer.from(expected);
  const providedBuffer = Buffer.from(signature);
  if (expectedBuffer.length !== providedBuffer.length || !crypto.timingSafeEqual(expectedBuffer, providedBuffer)) {
    throw new AuthError("INVALID_USER_SIGNATURE", "User authentication signature is invalid.");
  }

  return { userId, source: "signed_header" as const };
}

function verifyCustomerSessionCookie(request: Request) {
  const cookieHeader = request.headers.get("cookie") ?? "";
  const cookieValue = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${CUSTOMER_SESSION_COOKIE}=`))
    ?.slice(CUSTOMER_SESSION_COOKIE.length + 1);

  const session = parseCustomerSession(cookieValue);
  if (!session) return undefined;
  return { userId: session.userId, source: "customer_session" as const };
}

export function requireUser(request: Request, fallbackUserId?: string): AuthenticatedUser {
  const signedUser = verifySignedUserHeader(request);
  if (signedUser) return signedUser;

  const customerSession = verifyCustomerSessionCookie(request);
  if (customerSession) return customerSession;

  if (isDemoAllowed() && fallbackUserId) {
    return { userId: fallbackUserId, source: "demo_compatibility" };
  }

  throw new AuthError(
    "AUTHENTICATION_REQUIRED",
    "Please sign in before using subscription or customer data features."
  );
}

export function authErrorResponse(error: unknown) {
  if (error instanceof AuthError) {
    return NextResponse.json(
      { error: { code: error.code, message: error.message } },
      { status: error.status }
    );
  }
  return undefined;
}
