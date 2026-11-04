import { AuthError } from "@/lib/server/auth";

/** Reject browser cross-site mutations. SameSite cookies are defence in depth, not authorization. */
export function requireSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return;
  const requestUrl = new URL(request.url);
  const allowedOrigins = (process.env.MAMA_AI_ALLOWED_ORIGINS ?? "").split(",").map((value) => value.trim()).filter(Boolean);
  const normalizedOrigin = new URL(origin).origin;
  if (normalizedOrigin !== requestUrl.origin && !allowedOrigins.includes(normalizedOrigin)) {
    throw new AuthError("CSRF_ORIGIN_REJECTED", "This request was rejected because its origin is not trusted.", 403);
  }
}
