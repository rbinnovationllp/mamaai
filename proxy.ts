import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const isAdminApi = request.nextUrl.pathname.startsWith("/api/admin");
  const adminToken = request.cookies.get("mama_admin_session")?.value;
  const authHeader = request.headers.get("authorization");
  const configuredSecret = process.env.ADMIN_SECRET_KEY;

  if (!configuredSecret) {
    if (isAdminApi) {
      return NextResponse.json(
        { error: { code: "ADMIN_AUTH_NOT_CONFIGURED", message: "Admin access is not configured." } },
        { status: 403 }
      );
    }
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (!adminToken && authHeader !== `Bearer ${configuredSecret}`) {
    if (isAdminApi) {
      return NextResponse.json(
        { error: { code: "ADMIN_UNAUTHORIZED", message: "Admin authorization is required." } },
        { status: 401 }
      );
    }
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
