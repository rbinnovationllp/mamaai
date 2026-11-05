import { NextResponse } from "next/server";
import { z } from "zod";
import { adminErrorResponse, requireAdmin } from "@/lib/server/admin";
import { CustomerProfileRepository } from "@/lib/repositories/customer-profile-repository";
import { CrmRepository } from "@/lib/repositories/crm-repository";
import { SubscriptionRepository } from "@/lib/repositories/subscription-repository";
import { BetaEntitlementConfigurationError, betaEntitlementConfiguration, buildBetaEntitlement } from "@/lib/services/beta-entitlement-service";

const requestSchema = z.object({ action: z.enum(["grant", "revoke"]), userId: z.string().trim().min(1).max(160) });

export async function POST(request: Request) {
  try {
    const actor = requireAdmin(request);
    const input = requestSchema.parse(await request.json());
    const configuration = betaEntitlementConfiguration();
    const customers = new CustomerProfileRepository();
    if (!await customers.getCustomer(input.userId)) return NextResponse.json({ error: { code: "BETA_TESTER_NOT_FOUND", message: "The approved beta account was not found." } }, { status: 404 });
    const subscriptions = new SubscriptionRepository();
    if (input.action === "revoke") {
      const revoked = await subscriptions.revokeBetaEntitlement(input.userId);
      await new CrmRepository().writeAudit({ actorId: actor.actorId, action: "beta_entitlement.revoke", targetUserId: input.userId, metadata: { revoked } });
      return NextResponse.json({ success: true, action: "revoke", revoked, actorId: actor.actorId });
    }
    const subscription = await subscriptions.grantBetaEntitlement(buildBetaEntitlement(input.userId, configuration));
    await new CrmRepository().writeAudit({ actorId: actor.actorId, action: "beta_entitlement.grant", targetUserId: input.userId, metadata: { plan: subscription.plan, expiresAt: subscription.expiresAt } });
    return NextResponse.json({ success: true, action: "grant", entitlement: { plan: subscription.plan, memberLimit: subscription.memberLimit, expiresAt: subscription.expiresAt, source: subscription.source }, actorId: actor.actorId }, { status: 201 });
  } catch (error) {
    const adminResponse = adminErrorResponse(error);
    if (adminResponse) return adminResponse;
    if (error instanceof BetaEntitlementConfigurationError) return NextResponse.json({ error: { code: "BETA_ACCESS_UNAVAILABLE", message: "Beta access is unavailable in this environment." } }, { status: 503 });
    if (error instanceof z.ZodError) return NextResponse.json({ error: { code: "VALIDATION_ERROR", message: "Beta entitlement request is invalid." } }, { status: 400 });
    return NextResponse.json({ error: { code: "BETA_ENTITLEMENT_UNAVAILABLE", message: "Unable to update beta access." } }, { status: 503 });
  }
}
