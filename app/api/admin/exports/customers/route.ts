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
    const repository = new CrmRepository();
    const { customers } = await repository.listCustomers({ status: safeStatus, limit: 100 });
    const exportRows = customers.map((customer) => ({
      userId: customer.userId,
      plan: customer.plan,
      status: customer.status,
      paymentStatus: customer.paymentStatus,
      paymentChannel: customer.paymentChannel,
      startsAt: customer.startsAt,
      renewsAt: customer.renewsAt,
      checkedAt: customer.checkedAt,
    }));

    await repository.writeAudit({
      actorId: actor.actorId,
      action: "crm.customers.export",
      metadata: { status: safeStatus, rowCount: exportRows.length, dataMinimised: true },
    });

    return NextResponse.json({
      exportedAt: new Date().toISOString(),
      status: safeStatus,
      dataMinimised: true,
      customers: exportRows,
    });
  } catch (error) {
    const adminResponse = adminErrorResponse(error);
    if (adminResponse) return adminResponse;
    return NextResponse.json(
      { error: { code: "CRM_CUSTOMER_EXPORT_FAILED", message: "Unable to export customer list." } },
      { status: 500 }
    );
  }
}

