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

export function requireAdmin(request: Request): AdminActor {
  const configuredSecret = process.env.ADMIN_SECRET_KEY;
  const authHeader = request.headers.get("authorization");
  const hasAdminCookie = request.headers.get("cookie")?.includes("mama_admin_session=");

  if (!configuredSecret) {
    throw new AdminAuthError("Admin access is not configured.");
  }

  if (!hasAdminCookie && authHeader !== `Bearer ${configuredSecret}`) {
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

