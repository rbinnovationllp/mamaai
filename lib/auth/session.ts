// lib/auth/session.ts
import crypto from "crypto";
import { cookies } from "next/headers";

const SESSION_SECRET = process.env.AUTH_SECRET || "mamaai-production-secret-key-32chars!";
const SESSION_COOKIE_NAME = "mamaai_session";

export interface UserSession {
    userId: string;
    email: string;
    role: "user" | "admin";
    entitlement: "trial" | "active" | "judge" | "expired";
    trialEndsAt?: string;
    subscriptionPlan?: "starter" | "premium" | "plus";
}

export function signToken(payload: object): string {
    const data = Buffer.from(JSON.stringify(payload)).toString("base64url");
    const signature = crypto.createHmac("sha256", SESSION_SECRET).update(data).digest("base64url");
    return `${data}.${signature}`;
}

export function verifyToken<T>(token: string): T | null {
    if (!token || !token.includes(".")) return null;
    const [data, signature] = token.split(".");
    const expectedSig = crypto.createHmac("sha256", SESSION_SECRET).update(data).digest("base64url");
    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig))) {
        return null;
    }
    return JSON.parse(Buffer.from(data, "base64url").toString("utf-8"));
}

export async function getSession(): Promise<UserSession | null> {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (!token) return null;
    return verifyToken<UserSession>(token);
}