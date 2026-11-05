import { NextResponse } from "next/server";
import { authErrorResponse, requireUser } from "@/lib/server/auth";
import { FamilyPlusEntitlementError, requireFamilyPlusEntitlement } from "@/lib/pets/family-plus-entitlement";
import { PetProfileRepository } from "@/lib/repositories/pet-profile-repository";
import { createPetMealPlan } from "@/lib/pets/meal-plan";
import { isAppLanguage } from "@/lib/i18n";

export async function GET(request: Request) {
  try {
    const user = await requireUser(request);
    await requireFamilyPlusEntitlement(user.userId);
    const pets = await new PetProfileRepository().listForUser(user.userId);
    const candidate = new URL(request.url).searchParams.get("language") ?? "en";
    const language = isAppLanguage(candidate) ? candidate : "en";
    return NextResponse.json({ plans: pets.map((pet) => createPetMealPlan(pet, language)) });
  } catch (error) {
    const auth = authErrorResponse(error);
    if (auth) return auth;
    if (error instanceof FamilyPlusEntitlementError) return NextResponse.json({ error: { code: "FAMILY_PLUS_REQUIRED", message: error.message } }, { status: 403 });
    return NextResponse.json({ error: { code: "PET_MEAL_PLAN_UNAVAILABLE" } }, { status: 503 });
  }
}
