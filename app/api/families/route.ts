import { authErrorResponse, requireUser } from "@/lib/server/auth";
import { requireSameOrigin } from "@/lib/server/request-security";
import { NextResponse } from "next/server";
import { FamilyService } from "@/lib/services/family-service";
import { createFamilyRequestSchema } from "@/lib/shared/schemas";

export async function POST(request: Request) {
  try {
    requireSameOrigin(request);
    const user = await requireUser(request);
    const body = await request.json();
    const parsed = createFamilyRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "Family payload is invalid.", details: parsed.error.issues } },
        { status: 400 }
      );
    }

    if (parsed.data.userId !== user.userId) return NextResponse.json({ error: { code: "FORBIDDEN" } }, { status: 403 });
    const result = await new FamilyService().createFamily({ ...parsed.data, userId: user.userId });
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    const auth = authErrorResponse(error);
    if (auth) return auth;
    return NextResponse.json(
      { error: { code: "FAMILY_CREATE_FAILED", message: error instanceof Error ? error.message : "Unable to create family." } },
      { status: 500 }
    );
  }
}


