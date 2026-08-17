import { NextResponse } from "next/server";
import { CrmRepository, type CustomerStatus } from "@/lib/repositories/crm-repository";
import { adminErrorResponse, requireAdmin } from "@/lib/server/admin";

const allowedStatuses: CustomerStatus[] = ["active", "trialing", "past_due", "cancelled", "expired"];

export async function GET(request: Request) {
  try {
    const actor = requireAdmin(request);
    const url = new URL(request.url);
    const status = url.searchParams.get("status") as CustomerStatus | null;
    const safeStatus = status && allowedStatuses.includes(status) ? status : "active";
    const limit = Number(url.searchParams.get("limit") ?? "25");
    const cursor = url.searchParams.get("cursor");
    const repository = new CrmRepository();

    const result = await repository.listCustomers({ status: safeStatus, limit, cursor });
    await repository.writeAudit({
      actorId: actor.actorId,
      action: "crm.customers.list",
      metadata: { status: safeStatus, resultCount: result.customers.length },
    });

    return NextResponse.json({ status: safeStatus, ...result });
  } catch (error) {
    const adminResponse = adminErrorResponse(error);
    if (adminResponse) return adminResponse;
    return NextResponse.json(
      { error: { code: "CRM_CUSTOMER_LIST_FAILED", message: "Unable to list CRM customers." } },
      { status: 500 }
    );
  }
}

