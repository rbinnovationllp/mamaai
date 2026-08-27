import { NextResponse } from "next/server";

export interface AdminActor {
  actorId: string;
  role: "admin";
}

export class AdminAuthError extends Error {
  constructor(message = "Admin authorization is required.") {
    super(message);
  }
}

function isAuthorizedAdmin(request: Request, configuredSecret: string) {
  const authHeader = request.headers.get("authorization");
  const cookieHeader = request.headers.get("cookie") ?? "";
  const adminCookie = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith("mama_admin_session="))
    ?.slice("mama_admin_session=".length);

  return authHeader === `Bearer ${configuredSecret}` || adminCookie === configuredSecret;
}

export function requireAdmin(request: Request): AdminActor {
  const configuredSecret = process.env.ADMIN_SECRET_KEY;

  if (!configuredSecret) {
    throw new AdminAuthError("Admin access is not configured.");
  }

  if (!isAuthorizedAdmin(request, configuredSecret)) {
    throw new AdminAuthError();
  }

  return {
    actorId: request.headers.get("x-admin-actor") ?? "admin",
    role: "admin",
  };
}

export function adminErrorResponse(error: unknown) {
  if (error instanceof AdminAuthError) {
    return NextResponse.json(
      { error: { code: "ADMIN_UNAUTHORIZED", message: error.message } },
      { status: 401 }
    );
  }
  return undefined;
}
