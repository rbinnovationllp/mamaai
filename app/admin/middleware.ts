// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith('/admin')) {
    const adminToken = req.cookies.get('mama_admin_session')?.value;
    const authHeader = req.headers.get('authorization');

    // Verify session token or administrative basic auth
    if (!adminToken && authHeader !== `Bearer ${process.env.ADMIN_SECRET_KEY}`) {
      return NextResponse.redirect(new URL('/login', req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};