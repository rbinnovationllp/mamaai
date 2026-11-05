import { NextResponse } from "next/server";
import { demoFamily, demoMembers } from "@/lib/shared/demo-data";
import { NutritionContextService } from "@/lib/services/nutrition-context-service";
import { MealPlanningService } from "@/lib/services/meal-planning-service";
import { store } from "@/lib/repositories/in-memory-store";
import { isIsolatedFeatureBlocked, isolatedFeatureDisabledResponse } from "@/lib/server/isolated-runtime-safety";

export async function GET() {
  if (isIsolatedFeatureBlocked("MAMA_AI_DEMO_MODE")) {
    return NextResponse.json(isolatedFeatureDisabledResponse("Demo mode"), { status: 503 });
  }

  const nutritionContexts = new NutritionContextService().analyze(demoMembers);
  if (!store.families.some((family) => family.familyId === demoFamily.familyId)) {
    store.families.push(demoFamily);
    store.members.push(...demoMembers);
  }
  let mealPlan = store.mealPlans.find((plan) => plan.familyId === demoFamily.familyId);
  if (!mealPlan) mealPlan = (await new MealPlanningService().generate({ familyId: demoFamily.familyId, planType: "daily" }, true)).mealPlan;
  return NextResponse.json({ family: demoFamily, members: demoMembers, nutritionContexts, mealPlan });
}
