// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
    const path = request.nextUrl.pathname;

    // Protect Admin Routes & APIs
    if (path.startsWith("/admin") || path.startsWith("/api/admin")) {
        const adminToken = request.cookies.get("mamaai_admin_token")?.value;
        if (!adminToken) {
            if (path.startsWith("/api/")) {
                return NextResponse.json({ error: "Unauthorized access." }, { status: 401 });
            }
            return NextResponse.redirect(new URL("/admin/login", request.url));
        }
        // Cryptographic validation happens in route/edge context
    }
    return NextResponse.next();
}

export const config = {
    matcher: ["/admin/:path*", "/api/admin/:path*"],
};