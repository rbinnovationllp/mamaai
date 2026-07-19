import { NextResponse } from "next/server";
import { revenueCatWebhookSchema } from "@/lib/shared/schemas";

export async function POST(request: Request) {
  const configuredSecret = process.env.REVENUECAT_WEBHOOK_SECRET;
  const providedSecret = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");

  if (configuredSecret && providedSecret !== configuredSecret) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "RevenueCat webhook authorization failed." } },
      { status: 401 }
    );
  }

  const body = await request.json();
  const parsed = revenueCatWebhookSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: "RevenueCat webhook payload is invalid.", details: parsed.error.issues } },
      { status: 400 }
    );
  }

  return NextResponse.json({
    received: true,
    persisted: false,
    message: "RevenueCat webhook contract is ready. Persist entitlement changes after DynamoDB subscription repository is connected."
  });
}
