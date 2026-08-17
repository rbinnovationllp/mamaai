import { NextResponse } from "next/server";
import { z } from "zod";
import { CrmRepository } from "@/lib/repositories/crm-repository";
import { adminErrorResponse, requireAdmin } from "@/lib/server/admin";

interface RouteContext {
  params: Promise<{ userId: string }>;
}

const noteSchema = z.object({
  note: z.string().min(2).max(2000),
});

export async function GET(request: Request, context: RouteContext) {
  try {
    const actor = requireAdmin(request);
    const { userId } = await context.params;
    const repository = new CrmRepository();
    const notes = await repository.listSupportNotes(userId);
    await repository.writeAudit({ actorId: actor.actorId, action: "crm.support_notes.list", targetUserId: userId });
    return NextResponse.json({ userId, notes });
  } catch (error) {
    const adminResponse = adminErrorResponse(error);
    if (adminResponse) return adminResponse;
    return NextResponse.json(
      { error: { code: "CRM_SUPPORT_NOTES_READ_FAILED", message: "Unable to read support notes." } },
      { status: 500 }
    );
  }
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const actor = requireAdmin(request);
    const { userId } = await context.params;
    const parsed = noteSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "Support note is invalid." } },
        { status: 400 }
      );
    }

    const repository = new CrmRepository();
    const note = await repository.addSupportNote({
      userId,
      note: parsed.data.note,
      authorId: actor.actorId,
    });
    await repository.writeAudit({ actorId: actor.actorId, action: "crm.support_notes.create", targetUserId: userId });
    return NextResponse.json({ note }, { status: 201 });
  } catch (error) {
    const adminResponse = adminErrorResponse(error);
    if (adminResponse) return adminResponse;
    return NextResponse.json(
      { error: { code: "CRM_SUPPORT_NOTE_CREATE_FAILED", message: "Unable to create support note." } },
      { status: 500 }
    );
  }
}

