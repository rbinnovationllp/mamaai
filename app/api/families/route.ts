import { NextResponse } from "next/server";
import { FamilyService } from "@/lib/services/family-service";
import { createFamilyRequestSchema } from "@/lib/shared/schemas";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = createFamilyRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "Family payload is invalid.", details: parsed.error.issues } },
        { status: 400 }
      );
    }

    const result = new FamilyService().createFamily(parsed.data);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: { code: "FAMILY_CREATE_FAILED", message: error instanceof Error ? error.message : "Unable to create family." } },
      { status: 500 }
    );
  }
}
