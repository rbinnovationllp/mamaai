import { createId, nowIso } from "@/lib/repositories/in-memory-store";
import type {
  CommonMeal,
  Family,
  FamilyDietPreference,
  FamilyMealPlan,
  FamilyMember,
  Ingredient,
  MealTime,
  MealTimeContext,
  NutritionEstimate,
  PlanType,
  UserPlanningMode
} from "@/lib/shared/contracts";
import { mandatoryDisclaimer } from "@/lib/shared/demo-data";
import { GroceryService } from "@/lib/services/grocery-service";

interface GeneratePlanInput {
  family: Family;
  members: FamilyMember[];
  planType: PlanType;
  mealTime?: MealTime;
  mealTimeContext?: MealTimeContext;
  userPlanningMode?: UserPlanningMode;
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

function pohaIngredients(): Ingredient[] {
  return [
    { name: "Poha", quantity: "3 cups", category: "grains", estimatedCost: money(55) },
    { name: "Peanuts", quantity: "0.5 cup", category: "protein", estimatedCost: money(35) },
    { name: "Onion and peas", quantity: "2 cups", category: "vegetables", estimatedCost: money(55) },
    { name: "Curd", quantity: "500 g", category: "dairy", estimatedCost: money(60) },
    { name: "Lemon and coriander", quantity: "1 small bunch", category: "other", estimatedCost: money(20) }
  ];
}

function rotiDalIngredients(): Ingredient[] {
  return [
    { name: "Whole wheat flour", quantity: "3 cups", category: "grains", estimatedCost: money(55) },
    { name: "Masoor dal", quantity: "1.5 cups", category: "pulses", estimatedCost: money(65) },
    { name: "Seasonal vegetable sabzi", quantity: "4 cups", category: "vegetables", estimatedCost: money(120) },
    { name: "Curd", quantity: "750 g", category: "dairy", estimatedCost: money(80) },
    { name: "Basic spices", quantity: "2 tsp", category: "spices", estimatedCost: money(15) }
  ];
}

function eggCurryIngredients(): Ingredient[] {
  return [
    { name: "Eggs", quantity: "8 pieces", category: "protein", estimatedCost: money(80) },
    { name: "Whole wheat flour", quantity: "3 cups", category: "grains", estimatedCost: money(55) },
    { name: "Seasonal vegetable sabzi", quantity: "4 cups", category: "vegetables", estimatedCost: money(120) },
    { name: "Curd", quantity: "500 g", category: "dairy", estimatedCost: money(60) },
    { name: "Onion tomato masala", quantity: "2 cups", category: "vegetables", estimatedCost: money(60) }
  ];
}

function chickenDalIngredients(): Ingredient[] {
  return [
    { name: "Chicken", quantity: "650 g", category: "protein", estimatedCost: money(210) },
    { name: "Rice", quantity: "1.5 cups", category: "grains", estimatedCost: money(55) },
    { name: "Moong dal", quantity: "1 cup", category: "pulses", estimatedCost: money(40) },
    { name: "Mixed vegetables", quantity: "4 cups", category: "vegetables", estimatedCost: money(110) },
    { name: "Curd", quantity: "500 g", category: "dairy", estimatedCost: money(60) }
  ];
}

function mixedFamilyIngredients(): Ingredient[] {
  return [
    { name: "Masoor dal", quantity: "1.5 cups", category: "pulses", estimatedCost: money(65) },
    { name: "Whole wheat flour", quantity: "3 cups", category: "grains", estimatedCost: money(55) },
    { name: "Seasonal vegetable sabzi", quantity: "4 cups", category: "vegetables", estimatedCost: money(120) },
    { name: "Eggs or chicken add-on", quantity: "4 eggs or 350 g chicken", category: "protein", estimatedCost: money(130) },
    { name: "Curd", quantity: "750 g", category: "dairy", estimatedCost: money(80) }
  ];
}

function nutritionEstimate(values: Omit<NutritionEstimate, "basis" | "dataSource" | "confidence">, basis: string): NutritionEstimate {
  return {
    ...values,
    basis,
    dataSource: "MVP estimate using USDA FoodData Central-style nutrient fields and ICMR/NIN food-group guidance; production should replace with verified ingredient-weight lookup.",
    confidence: "medium"
  };
}

function estimateForDiet(dietPreference: FamilyDietPreference, mealTime: MealTime): NutritionEstimate {
  if (dietPreference === "non_vegetarian") {
    return nutritionEstimate(
      { caloriesKcal: 1850, proteinGrams: 112, carbsGrams: 205, fatGrams: 58, fiberGrams: 28 },
      "Estimated family total for chicken, dal, rice, vegetables, and curd."
    );
  }

  if (dietPreference === "eggetarian") {
    return nutritionEstimate(
      { caloriesKcal: 1660, proteinGrams: 82, carbsGrams: 185, fatGrams: 54, fiberGrams: 24 },
      "Estimated family total for egg curry, roti, vegetables, and curd."
    );
  }

  if (dietPreference === "semi_vegetarian" || dietPreference === "mixed") {
    return nutritionEstimate(
      { caloriesKcal: 1720, proteinGrams: 86, carbsGrams: 215, fatGrams: 49, fiberGrams: 34 },
      "Estimated family total for vegetarian base meal with optional egg or chicken protein add-on."
    );
  }

  if (mealTime === "breakfast") {
    return nutritionEstimate(
      { caloriesKcal: 1280, proteinGrams: 45, carbsGrams: 190, fatGrams: 42, fiberGrams: 22 },
      "Estimated family total for vegetable poha, peanuts, curd, and fruit."
    );
  }

  if (mealTime === "dinner") {
    return nutritionEstimate(
      { caloriesKcal: 1420, proteinGrams: 58, carbsGrams: 210, fatGrams: 38, fiberGrams: 30 },
      "Estimated family total for moong dal khichdi, vegetables, and curd."
    );
  }

  return nutritionEstimate(
    { caloriesKcal: 1540, proteinGrams: 64, carbsGrams: 230, fatGrams: 36, fiberGrams: 36 },
    "Estimated family total for roti, masoor dal, seasonal sabzi, and curd."
  );
}

function mealForDiet(input: GeneratePlanInput, mealId: string, mealTime: MealTime, regionFit: string): CommonMeal | null {
  const dietPreference = input.family.dietPreference ?? "vegetarian";

  if (dietPreference === "non_vegetarian") {
    return {
      mealId,
      name: "Chicken Dal Rice Plate with Vegetables and Curd",
      mealTime,
      description: "A non-vegetarian family meal with chicken protein, dal, vegetables, curd, and member-specific portions.",
      ingredients: chickenDalIngredients(),
      prepTimeMinutes: 40,
      difficulty: "medium",
      regionFit,
      nutritionIntent: "Higher-protein common meal with fiber, curd, and controlled grain portions.",
      nutritionEstimate: estimateForDiet(dietPreference, mealTime)
    };
  }

  if (dietPreference === "eggetarian") {
    return {
      mealId,
      name: "Egg Curry with Roti, Seasonal Sabzi and Curd",
      mealTime,
      description: "An eggetarian family meal with egg protein, roti, vegetables, and curd that can be portion-adjusted for each member.",
      ingredients: eggCurryIngredients(),
      prepTimeMinutes: 35,
      difficulty: "easy",
      regionFit,
      nutritionIntent: "Protein-forward eggetarian meal with vegetables, curd, and adaptable portions.",
      nutritionEstimate: estimateForDiet(dietPreference, mealTime)
    };
  }

  if (dietPreference === "semi_vegetarian" || dietPreference === "mixed") {
    return {
      mealId,
      name: "Family Dal-Roti-Sabzi with Optional Egg or Chicken Add-On",
      mealTime,
      description: "A shared vegetarian base meal with optional egg or chicken protein for members who eat it, keeping one family table.",
      ingredients: mixedFamilyIngredients(),
      prepTimeMinutes: 38,
      difficulty: "medium",
      regionFit,
      nutritionIntent: "One flexible common meal that respects mixed family food preferences without forcing separate cooking.",
      nutritionEstimate: estimateForDiet(dietPreference, mealTime)
    };
  }

  return null;
}

function mealForTime(input: GeneratePlanInput, mealId: string): CommonMeal {
  const mealTime = input.mealTime ?? "lunch";
  const localContext = input.mealTimeContext?.timeZone ? `, timed for ${input.mealTimeContext.timeZone}` : "";
  const regionFit = `${input.family.city}, ${input.family.state} friendly${localContext}`;
  const dietMeal = mealForDiet(input, mealId, mealTime, regionFit);
  if (dietMeal) return dietMeal;

  if (input.replacement) {
    return {
      mealId,
      name: mealTime === "breakfast" ? "Ragi Dosa with Vegetable Sambar and Curd" : "Ragi Dosa with Vegetable Sambar and Paneer Side",
      mealTime,
      description: "A familiar South Indian family meal with millet base, vegetable sambar, curd, and optional paneer support.",
      ingredients: milletDosaIngredients(),
      prepTimeMinutes: 35,
      difficulty: "medium",
      regionFit,
      nutritionIntent: "Preserve balanced carbohydrates, pulse protein, vegetables, and family adaptability.",
      nutritionEstimate: estimateForDiet(input.family.dietPreference, mealTime)
    };
  }

  if (mealTime === "breakfast") {
    return {
      mealId,
      name: "Vegetable Poha with Curd and Fruit",
      mealTime,
      description: "A quick Indian breakfast that can be softened, portion-controlled, or protein-supported by member need.",
      ingredients: pohaIngredients(),
      prepTimeMinutes: 20,
      difficulty: "easy",
      regionFit,
      nutritionIntent: "Light family breakfast with vegetables, curd, and member-specific portions.",
      nutritionEstimate: estimateForDiet(input.family.dietPreference, mealTime)
    };
  }

  if (mealTime === "dinner") {
    return {
      mealId,
      name: "Vegetable Moong Dal Khichdi with Curd",
      mealTime,
      description: "A soft, affordable, Indian dinner that can be adjusted for age, activity, and diabetes-aware portions.",
      ingredients: khichdiIngredients(),
      prepTimeMinutes: 30,
      difficulty: "easy",
      regionFit,
      nutritionIntent: "One common dinner with digestibility, pulse protein, vegetables, and controlled grain portions.",
      nutritionEstimate: estimateForDiet(input.family.dietPreference, mealTime)
    };
  }

  return {
    mealId,
    name: "Roti, Masoor Dal, Seasonal Sabzi and Curd",
    mealTime: "lunch",
    description: "A practical Indian lunch plate that keeps one common family meal while adapting portions for each member.",
    ingredients: rotiDalIngredients(),
    prepTimeMinutes: 35,
    difficulty: "easy",
    regionFit,
    nutritionIntent: "Balanced lunch with grains, dal protein, vegetables, curd, and member-specific portion guidance.",
    nutritionEstimate: estimateForDiet(input.family.dietPreference, "lunch")
  };
}

export class AIService {
  generateFamilyMealPlan(input: GeneratePlanInput): FamilyMealPlan {
    const timestamp = nowIso();
    const mealId = createId(input.replacement ? "replacement-meal" : "meal");
    const commonMeal = mealForTime(input, mealId);

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
        "Known allergies and doctor restrictions must be reviewed before cooking.",
        input.userPlanningMode === "returning_user_weekly_editable"
          ? "Returning-user mode should reuse editable weekly planning to control AI cost and avoid unnecessary regeneration."
          : "New-user mode generates a focused next-meal plan for onboarding and demo clarity."
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
