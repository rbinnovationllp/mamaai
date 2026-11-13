import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

function isAuthorizedAdmin(request: NextRequest, configuredSecret: string) {
  const adminToken = request.cookies.get("mama_admin_session")?.value;
  const authHeader = request.headers.get("authorization");

  return adminToken === configuredSecret || authHeader === `Bearer ${configuredSecret}`;
}

export function proxy(request: NextRequest) {
  if (process.env.MAMAAI_SAMPLE_DATA_DEMO === "true") {
    const path = request.nextUrl.pathname;
    if (path.startsWith("/api/")) {
      return NextResponse.json({ error: { code: "SAMPLE_DEMO_READ_ONLY", message: "This sample demo does not accept accounts, personal data, uploads, payments, or AI requests." } }, { status: 403 });
    }
    if (path.startsWith("/account") || path.startsWith("/profile") || path.startsWith("/planner") || path.startsWith("/pantry") || path.startsWith("/subscription")) {
      return NextResponse.redirect(new URL("/demo", request.url));
    }
  }
  const isAdminApi = request.nextUrl.pathname.startsWith("/api/admin");
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

  if (!isAuthorizedAdmin(request, configuredSecret)) {
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
