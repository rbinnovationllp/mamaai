import { NextResponse } from "next/server";
import { demoFamily, demoMembers } from "@/lib/shared/demo-data";
import { NutritionContextService } from "@/lib/services/nutrition-context-service";
import { MealPlanningService } from "@/lib/services/meal-planning-service";
import { store } from "@/lib/repositories/in-memory-store";

export async function GET() {
  const nutritionContexts = new NutritionContextService().analyze(demoMembers);

  if (!store.families.some((family) => family.familyId === demoFamily.familyId)) {
    store.families.push(demoFamily);
    store.members.push(...demoMembers);
  }

  let mealPlan = store.mealPlans.find((plan) => plan.familyId === demoFamily.familyId);

  if (!mealPlan) {
    const generated = await new MealPlanningService().generate({
      familyId: demoFamily.familyId,
      planType: "daily",
    });
    mealPlan = generated.mealPlan;
  }

  return NextResponse.json({
    family: demoFamily,
    members: demoMembers,
    nutritionContexts,
    mealPlan,
  });
}
