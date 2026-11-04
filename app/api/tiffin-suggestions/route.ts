import { NextResponse } from "next/server";
import { z } from "zod";
import { authErrorResponse, requireUser } from "@/lib/server/auth";
import { CustomerProfileRepository } from "@/lib/repositories/customer-profile-repository";
import { PantryRepository } from "@/lib/repositories/pantry-repository";
import { generateSmartTiffinSuggestions } from "@/lib/services/smart-tiffin-service";

const schema = z.object({
  type: z.enum(["school_tiffin", "office_tiffin", "general"]),
  memberId: z.string().min(1).optional(),
  manualIngredients: z.array(z.string().trim().min(1).max(80)).max(30).default([]),
  maxMinutes: z.union([z.literal(5), z.literal(10), z.literal(15)]).default(10),
  onlyAvailable: z.boolean().default(false),
});

export async function POST(request: Request) {
  try {
    const user = await requireUser(request);
    const input = schema.parse(await request.json());
    const profile = await new CustomerProfileRepository().getFamilyProfile(user.userId);
    const member = input.memberId ? profile?.members.find((candidate) => candidate.id === input.memberId) : undefined;
    if (input.memberId && !member) return NextResponse.json({ error: { code: "MEMBER_NOT_FOUND", message: "That family member does not belong to your household." } }, { status: 404 });
    if (input.type === "school_tiffin" && member?.scheduleRole && member.scheduleRole !== "school_going") return NextResponse.json({ error: { code: "MEMBER_NOT_ELIGIBLE", message: "Select a saved school-going member for a school tiffin." } }, { status: 400 });
    if (input.type === "office_tiffin" && member?.scheduleRole && member.scheduleRole !== "working") return NextResponse.json({ error: { code: "MEMBER_NOT_ELIGIBLE", message: "Select a saved working member for an office tiffin." } }, { status: 400 });
    const pantry = await new PantryRepository().listForUser(user.userId);
    const suggestions = generateSmartTiffinSuggestions({
      type: input.type,
      member,
      pantry,
      manualIngredients: input.manualIngredients,
      maxMinutes: input.maxMinutes,
      onlyAvailable: input.onlyAvailable,
    });
    return NextResponse.json({ suggestions, pantryReadOnly: true });
  } catch (error) {
    const auth = authErrorResponse(error);
    if (auth) return auth;
    if (error instanceof z.ZodError) return NextResponse.json({ error: { code: "TIFFIN_INPUT_INVALID", message: "Check the tiffin options and try again." } }, { status: 400 });
    return NextResponse.json({ error: { code: "TIFFIN_SUGGESTIONS_FAILED", message: "Unable to prepare tiffin suggestions." } }, { status: 500 });
  }
}
