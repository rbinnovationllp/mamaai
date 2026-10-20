import { NextResponse } from "next/server";
import { clearCustomerSessionCookie, CUSTOMER_SESSION_COOKIE, verifyCustomerSession } from "@/lib/server/customer-session";
import { DynamoDbSessionRepository } from "@/lib/repositories/session-repository";

function cookieValue(request: Request, name: string): string | undefined {
  const cookie = request.headers.get("cookie") || "";
  const match = cookie.split(";").map((part) => part.trim()).find((part) => part.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.slice(name.length + 1)) : undefined;
}

export async function POST(request: Request) {
  const repository = new DynamoDbSessionRepository();
  try {
    const session = await verifyCustomerSession(cookieValue(request, CUSTOMER_SESSION_COOKIE), repository);
    if (!session) return NextResponse.json({ error: "AUTHENTICATION_REQUIRED" }, { status: 401 });
    const revoked = await repository.revoke(session.tokenHash, new Date().toISOString());
    if (!revoked) return NextResponse.json({ error: "SESSION_LOGOUT_FAILED" }, { status: 409 });
    const response = NextResponse.json({ loggedOut: true });
    clearCustomerSessionCookie(response);
    return response;
  } catch {
    return NextResponse.json({ error: "SESSION_LOGOUT_FAILED" }, { status: 503 });
  }
}
