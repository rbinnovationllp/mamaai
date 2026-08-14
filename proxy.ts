import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const adminToken = request.cookies.get("mama_admin_session")?.value;
  const authHeader = request.headers.get("authorization");
  const configuredSecret = process.env.ADMIN_SECRET_KEY;

  if (!configuredSecret) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (!adminToken && authHeader !== `Bearer ${configuredSecret}`) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
