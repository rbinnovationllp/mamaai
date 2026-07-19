import { createId, nowIso } from "@/lib/repositories/in-memory-store";
import type { CommonMeal, Family, FamilyMealPlan, FamilyMember, Ingredient, PlanType } from "@/lib/shared/contracts";
import { mandatoryDisclaimer } from "@/lib/shared/demo-data";
import { GroceryService } from "@/lib/services/grocery-service";

interface GeneratePlanInput {
  family: Family;
  members: FamilyMember[];
  planType: PlanType;
  targetDate: string;
  replacement?: boolean;
}

const groceryService = new GroceryService();

function money(amount: number) {
  return { amount, currency: "INR" as const };
}

function khichdiIngredients(): Ingredient[] {
  return [
    { name: "Moong dal", quantity: "1.5 cups", category: "pulses", estimatedCost: money(55) },
    { name: "Rice", quantity: "1.25 cups", category: "grains", estimatedCost: money(45) },
    { name: "Mixed vegetables", quantity: "4 cups", category: "vegetables", estimatedCost: money(110) },
    { name: "Curd", quantity: "750 g", category: "dairy", estimatedCost: money(80) },
    { name: "Cumin and turmeric", quantity: "2 tsp", category: "spices", estimatedCost: money(15) }
  ];
}

function milletDosaIngredients(): Ingredient[] {
  return [
    { name: "Ragi flour", quantity: "2 cups", category: "grains", estimatedCost: money(65) },
    { name: "Urad dal", quantity: "0.75 cup", category: "pulses", estimatedCost: money(45) },
    { name: "Vegetable sambar mix", quantity: "4 cups", category: "vegetables", estimatedCost: money(120) },
    { name: "Paneer", quantity: "250 g", category: "protein", estimatedCost: money(110) },
    { name: "Curd", quantity: "500 g", category: "dairy", estimatedCost: money(60) }
  ];
}

export class AIService {
  generateFamilyMealPlan(input: GeneratePlanInput): FamilyMealPlan {
    const timestamp = nowIso();
    const mealId = createId(input.replacement ? "replacement-meal" : "meal");
    const commonMeal: CommonMeal = input.replacement
      ? {
          mealId,
          name: "Ragi Dosa with Vegetable Sambar and Paneer Side",
          mealTime: "dinner",
          description: "A familiar South Indian family meal with millet base, vegetable sambar, curd, and paneer support.",
          ingredients: milletDosaIngredients(),
          prepTimeMinutes: 35,
          difficulty: "medium",
          regionFit: `${input.family.city}, ${input.family.state} friendly`,
          nutritionIntent: "Preserve balanced carbohydrates, pulse protein, vegetables, and family adaptability."
        }
      : {
          mealId,
          name: "Vegetable Moong Dal Khichdi with Curd",
          mealTime: "dinner",
          description: "A soft, affordable, Indian family meal that can be adjusted for age, activity, and diabetes-aware portions.",
          ingredients: khichdiIngredients(),
          prepTimeMinutes: 30,
          difficulty: "easy",
          regionFit: `${input.family.city}, ${input.family.state} friendly`,
          nutritionIntent: "One common meal with digestibility, pulse protein, vegetables, and controlled grain portions."
        };

    const groceryItems = groceryService.fromCommonMeal(commonMeal);
    const totalCost = groceryService.totalCost(groceryItems);

    return {
      mealPlanId: createId("meal-plan"),
      familyId: input.family.familyId,
      planType: input.planType,
      targetDate: input.targetDate,
      commonMeal,
      memberCustomizations: input.members.map((member) => this.customizeMember(member, input.replacement)),
      fruits: input.members.map((member) => this.fruitForMember(member)),
      hydration: input.members.map((member) => this.hydrationForMember(member)),
      estimatedCost: {
        mealCost: money(totalCost),
        dailyCost: money(totalCost + 160)
      },
      groceryItems,
      familySatisfactionScore: {
        score: input.replacement ? 86 : 89,
        explanation: "Score balances taste familiarity, health fit, affordability, local availability, and cooking effort."
      },
      warnings: [
        "Nutrition values are estimates and should not be treated as medical advice.",
        "Known allergies and doctor restrictions must be reviewed before cooking."
      ],
      disclaimer: mandatoryDisclaimer,
      createdAt: timestamp,
      updatedAt: timestamp
    };
  }

  private customizeMember(member: FamilyMember, replacement?: boolean) {
    const hasDiabetes = member.healthConditions.some((condition) => condition.toLowerCase().includes("diabetes"));
    const isChild = member.age < 13;
    const isSenior = member.age > 65 || member.specialStatuses.some((status) => status.toLowerCase().includes("senior"));
    const highActivity = member.activityLevel === "heavy" || member.activityLevel === "athlete";

    if (hasDiabetes) {
      return {
        memberId: member.memberId,
        memberName: member.name,
        modification: replacement ? "Use more sambar vegetables, moderate dosa count, and avoid sweet beverages." : "Keep khichdi grain portion controlled and add extra vegetables and curd.",
        portionGuidance: replacement ? "2 medium dosas with 1.5 cups sambar and unsweetened curd." : "1 medium bowl khichdi, 1 cup vegetables, and 0.5 cup curd.",
        safetyNotes: ["Diabetes-aware portion guidance; follow doctor-provided carbohydrate instructions if stricter."]
      };
    }

    if (isSenior) {
      return {
        memberId: member.memberId,
        memberName: member.name,
        modification: replacement ? "Serve dosa softer with extra sambar, less spice, and small pieces." : "Cook khichdi softer with mild spices and extra moisture.",
        portionGuidance: replacement ? "1 soft dosa with 1 cup sambar, served warm and easy to chew." : "1 small soft bowl with curd if tolerated.",
        safetyNotes: ["Watch chewing comfort and digestion."]
      };
    }

    if (highActivity) {
      return {
        memberId: member.memberId,
        memberName: member.name,
        modification: replacement ? "Add paneer side and extra sambar dal for protein support." : "Add paneer or extra dal topping for protein support.",
        portionGuidance: replacement ? "3 dosas, 2 cups sambar, and paneer side." : "2 bowls khichdi with extra dal or paneer side.",
        safetyNotes: []
      };
    }

    if (isChild) {
      return {
        memberId: member.memberId,
        memberName: member.name,
        modification: replacement ? "Serve smaller dosa pieces with mild sambar and curd." : "Serve mild khichdi with curd and colorful vegetables.",
        portionGuidance: replacement ? "1 small dosa, 0.75 cup sambar, and curd." : "1 child-size bowl with curd.",
        safetyNotes: ["Child nutrition needs are individualized; consult a pediatric professional for specific concerns."]
      };
    }

    return {
      memberId: member.memberId,
      memberName: member.name,
      modification: replacement ? "Standard family serving with balanced sambar and curd." : "Standard balanced portion with vegetables and curd.",
      portionGuidance: replacement ? "2 dosas, 1.5 cups sambar, and 0.5 cup curd." : "1.5 bowls khichdi with 0.5 cup curd.",
      safetyNotes: []
    };
  }

  private fruitForMember(member: FamilyMember) {
    const hasDiabetes = member.healthConditions.some((condition) => condition.toLowerCase().includes("diabetes"));
    return {
      memberId: member.memberId,
      memberName: member.name,
      fruit: hasDiabetes ? "Guava" : member.age < 13 ? "Banana" : "Papaya",
      portion: hasDiabetes ? "1 small guava" : member.age < 13 ? "1 small banana" : "1 bowl",
      timing: "Mid-morning or evening, away from the main meal if preferred.",
      alternatives: hasDiabetes ? ["Apple", "Pear"] : ["Orange", "Seasonal melon"],
      caution: hasDiabetes ? "Prefer whole fruit and avoid juice unless a clinician has advised otherwise." : undefined
    };
  }

  private hydrationForMember(member: FamilyMember) {
    const kidneyConcern = member.healthConditions.some((condition) => condition.toLowerCase().includes("kidney"));
    return {
      memberId: member.memberId,
      memberName: member.name,
      guidance: kidneyConcern ? "Follow doctor-specified fluid limits." : member.age < 13 ? "Small frequent water servings through the day." : "Sip water steadily across the day.",
      suitableBeverages: kidneyConcern ? ["Doctor-approved fluids"] : ["Water", "Unsweetened buttermilk"],
      caution: kidneyConcern ? "Kidney-related fluid and potassium restrictions need professional guidance." : undefined
    };
  }
}
