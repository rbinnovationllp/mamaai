import { createId, nowIso } from "@/lib/repositories/in-memory-store";
import type {
  CommonMeal,
  Family,
  FamilyDietPreference,
  FamilyMealPlan,
  FamilyMember,
  HighTeaPreference,
  Ingredient,
  MealAttendanceEntry,
  MealTime,
  MealTimeContext,
  NutritionEstimate,
  PlanType,
  PreferenceResolution,
  RecipeDetails,
  UserPlanningMode
} from "@/lib/shared/contracts";
import { mandatoryDisclaimer } from "@/lib/shared/demo-data";
import { GroceryService } from "@/lib/services/grocery-service";
import { QuantityPlanningService } from "@/lib/services/quantity-planning-service";
import { detailedMealPlanExpiresAt, retentionPolicy } from "@/lib/services/meal-retention-service";

interface GeneratePlanInput {
  family: Family;
  members: FamilyMember[];
  planType: PlanType;
  mealTime?: MealTime;
  mealTimeContext?: MealTimeContext;
  mealAttendance?: MealAttendanceEntry[];
  highTeaPreference?: HighTeaPreference;
  userPlanningMode?: UserPlanningMode;
  targetDate: string;
  replacement?: boolean;
}

const groceryService = new GroceryService();
const quantityPlanningService = new QuantityPlanningService();

function money(amount: number) {
  return { amount, currency: "INR" as const };
}

type CommonMealDraft = Omit<CommonMeal, "recipe">;

function normalize(value: string) {
  return value.trim().toLowerCase();
}

function memberHardRestrictions(member: FamilyMember) {
  return [
    ...member.allergies,
    ...member.foodAllergies,
    ...member.ingredientAllergies,
    ...member.excludedIngredients,
    ...member.dietaryRestrictions,
    ...member.doctorRestrictions
  ].filter(Boolean);
}

function memberSoftDislikes(member: FamilyMember) {
  return [...member.dislikes, ...member.foodDislikes, ...member.dislikedMeals].filter(Boolean);
}

function ingredientConflicts(meal: Pick<CommonMeal, "ingredients">, terms: string[]) {
  const ingredientNames = meal.ingredients.map((ingredient) => normalize(ingredient.name));
  return terms.filter((term) => {
    const normalized = normalize(term);
    return ingredientNames.some((ingredient) => ingredient.includes(normalized) || normalized.includes(ingredient));
  });
}

function mealNameConflicts(meal: Pick<CommonMeal, "name">, terms: string[]) {
  const mealName = normalize(meal.name);
  return terms.filter((term) => mealName.includes(normalize(term)));
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

function highTeaIngredients(): Ingredient[] {
  return [
    { name: "Besan", quantity: "1.5 cups", category: "pulses", estimatedCost: money(45) },
    { name: "Mixed grated vegetables", quantity: "2 cups", category: "vegetables", estimatedCost: money(65) },
    { name: "Curd", quantity: "500 g", category: "dairy", estimatedCost: money(60) },
    { name: "Seasonal fruit", quantity: "5 pieces", category: "fruits", estimatedCost: money(90) },
    { name: "Unsweetened tea or herbal infusion", quantity: "5 cups", category: "other", estimatedCost: money(35) }
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

function veganDalIngredients(): Ingredient[] {
  return [
    { name: "Masoor dal", quantity: "1.5 cups", category: "pulses", estimatedCost: money(65) },
    { name: "Brown rice or millet", quantity: "1.5 cups", category: "grains", estimatedCost: money(75) },
    { name: "Seasonal vegetable sabzi", quantity: "5 cups", category: "vegetables", estimatedCost: money(140) },
    { name: "Roasted peanuts or sesame chutney", quantity: "0.5 cup", category: "protein", estimatedCost: money(45) },
    { name: "Basic spices and lemon", quantity: "2 tsp spices + 2 lemons", category: "spices", estimatedCost: money(25) }
  ];
}

function veganHighTeaIngredients(): Ingredient[] {
  return [
    { name: "Besan", quantity: "1.5 cups", category: "pulses", estimatedCost: money(45) },
    { name: "Mixed grated vegetables", quantity: "2 cups", category: "vegetables", estimatedCost: money(65) },
    { name: "Peanut or coconut chutney", quantity: "1 cup", category: "protein", estimatedCost: money(55) },
    { name: "Seasonal fruit", quantity: "5 pieces", category: "fruits", estimatedCost: money(90) },
    { name: "Herbal infusion or lemon water", quantity: "5 cups", category: "other", estimatedCost: money(30) }
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

function totalIngredientCost(ingredients: Ingredient[]) {
  return ingredients.reduce((total, ingredient) => total + ingredient.estimatedCost.amount, 0);
}

function recipeSteps(mealName: string) {
  const name = normalize(mealName);
  if (name.includes("khichdi")) {
    return [
      "Wash rice and moong dal until the water runs mostly clear.",
      "Add rice, dal, chopped vegetables, cumin, turmeric, and water to a pressure cooker.",
      "Cook until soft; use extra water for elderly members who need a softer texture.",
      "Whisk curd separately and serve on the side so members with restrictions can skip it.",
      "Finish individual bowls with portion changes listed in the MAMA Family Table."
    ];
  }
  if (name.includes("dosa")) {
    return [
      "Prepare or use ready ragi dosa batter and keep vegetable sambar warm.",
      "Cook thin dosas on a lightly greased tawa.",
      "Serve sambar and curd on the side so member-specific portions can be controlled.",
      "For softer needs, soak dosa pieces briefly in warm sambar.",
      "Add paneer only for members who need and tolerate extra protein."
    ];
  }
  if (name.includes("poha")) {
    return [
      "Rinse poha briefly and rest until soft, not mushy.",
      "Cook onion, peas, and mild spices in a pan.",
      "Fold in poha and cook on low heat until warm and fluffy.",
      "Serve curd and fruit on the side for member-specific portions.",
      "Avoid any disliked or allergy-triggering toppings for affected members."
    ];
  }
  if (name.includes("high tea") || name.includes("chilla")) {
    return [
      "Mix besan with water, mild spices, and grated vegetables to make a pourable batter.",
      "Cook small chillas on a lightly oiled tawa until both sides are firm and golden.",
      "Keep curd, fruit, and tea separate so portions can be adjusted for each member.",
      "Serve unsweetened tea or herbal infusion, especially for members avoiding sugar.",
      "For fasting members, skip regular chilla and use the fasting alternative shown by MAMA."
    ];
  }
  if (name.includes("egg")) {
    return [
      "Boil eggs, peel them, and prepare onion tomato masala with mild spices.",
      "Simmer the eggs in the masala and keep the gravy medium-thick.",
      "Prepare roti and seasonal sabzi alongside the curry.",
      "Serve egg only to members who eat and tolerate egg.",
      "Use dal or paneer as the vegetarian protein alternative when needed."
    ];
  }
  if (name.includes("chicken")) {
    return [
      "Cook chicken with onion tomato masala until fully done.",
      "Prepare dal, rice, and vegetables separately so portions can be adjusted.",
      "Keep curd on the side for members who tolerate dairy.",
      "Serve chicken only to members who eat non-vegetarian food.",
      "Use dal, curd, paneer, or soy as an alternative protein for other members."
    ];
  }
  return [
    "Prepare dal with mild spices and enough water for the family texture preference.",
    "Cook roti and seasonal vegetable sabzi separately.",
    "Keep curd and optional protein add-ons on the side.",
    "Remove or replace any ingredient flagged in a member adjustment.",
    "Serve member-specific portions using the MAMA Family Table."
  ];
}

function recipeForMeal(meal: CommonMealDraft): RecipeDetails {
  return {
    title: meal.name,
    servings: 5,
    prepTimeMinutes: Math.max(10, Math.round(meal.prepTimeMinutes * 0.4)),
    cookTimeMinutes: Math.max(10, Math.round(meal.prepTimeMinutes * 0.6)),
    difficulty: meal.difficulty,
    ingredients: meal.ingredients,
    steps: recipeSteps(meal.name),
    estimatedNutrition: meal.nutritionEstimate,
    estimatedCost: money(totalIngredientCost(meal.ingredients)),
    familyAdjustments: [
      "Use the MAMA Family Table portions for each member.",
      "Keep curd, paneer, egg, chicken, and other optional protein add-ons separate when family preferences differ.",
      "Do not serve any listed allergy or never-include ingredient to the affected member."
    ],
    alternativeIngredients: [
      "Rice can be replaced with millet, roti, or extra vegetables depending on the meal.",
      "Paneer can be replaced with dal, soy, curd, egg, or chicken based on the family food pattern.",
      "Curd can be skipped or replaced with a tolerated side when dairy is unsuitable."
    ],
    videoRecommendation: {
      label: `Search YouTube for ${meal.name}`,
      note: "YouTube integration is planned; for now, use this as a safe search recommendation and verify ingredients against family restrictions."
    }
  };
}

function completeMeal(meal: CommonMealDraft): CommonMeal {
  return {
    ...meal,
    recipe: recipeForMeal(meal)
  };
}

function simpleAlternativeFor(member: FamilyMember, commonMeal: CommonMeal, conflicts: string[]) {
  const lowerMeal = normalize(commonMeal.name);
  const conflictText = conflicts.join(", ");
  if (lowerMeal.includes("paneer") || conflictText.toLowerCase().includes("paneer")) {
    return "Dal, curd, soy, or egg/chicken protein side depending on this member's diet pattern.";
  }
  if (lowerMeal.includes("egg") || conflictText.toLowerCase().includes("egg")) {
    return "Dal, paneer, curd, tofu, or a vegetable protein side.";
  }
  if (lowerMeal.includes("chicken") || conflictText.toLowerCase().includes("chicken")) {
    return "Extra dal, paneer, tofu, curd, or egg if suitable.";
  }
  if (lowerMeal.includes("khichdi") || conflictText.toLowerCase().includes("khichdi")) {
    return "Soft roti with dal and vegetable sabzi, using the same dal/vegetable base.";
  }
  return `A simple member-only portion without ${conflictText}, using dal, roti, vegetables, curd, paneer, egg, or chicken as suitable.`;
}

function preferenceResolutionFor(members: FamilyMember[], commonMeal: CommonMeal): PreferenceResolution | undefined {
  const affectedMembers = members
    .map((member) => {
      const conflicts = [...ingredientConflicts(commonMeal, memberSoftDislikes(member)), ...mealNameConflicts(commonMeal, memberSoftDislikes(member))];
      return {
        memberId: member.memberId,
        memberName: member.name,
        conflicts: [...new Set(conflicts)],
        suggestedAlternative: simpleAlternativeFor(member, commonMeal, conflicts)
      };
    })
    .filter((member) => member.conflicts.length > 0);

  if (!affectedMembers.length) return undefined;

  return {
    hasSoftConflict: true,
    prompt:
      "One family member does not prefer this meal/ingredient, while it is suitable for the rest of the family. Would you be comfortable preparing a separate simple alternative for this family member?",
    affectedMembers,
    recommendedOptionId: affectedMembers.length === 1 ? "two_compatible_options" : "one_common_meal",
    options: [
      {
        optionId: "separate_alternative",
        label: "Yes, prepare a separate alternative",
        description: "Keep the preferred common meal for the rest of the family and serve a nutritionally appropriate simple alternative to the affected member.",
        cookingImpact: "Highest family satisfaction, with one small extra preparation."
      },
      {
        optionId: "one_common_meal",
        label: "No, keep only one common family meal",
        description: "Find another common meal that is reasonably suitable and acceptable to all family members.",
        cookingImpact: "Lowest cooking effort, but may reduce satisfaction for members who preferred the original meal."
      },
      {
        optionId: "two_compatible_options",
        label: "Suggest two compatible options",
        description: "Keep the main family meal and add a simple second dish or alternative component for the affected member.",
        cookingImpact: "Balanced option: minimal extra cooking while protecting the main family meal."
      }
    ],
    minimumCookingStrategy:
      "Do not remove a popular common meal only because one member dislikes one ingredient. First try a portion-level swap, side dish, or simple second component."
  };
}

function estimateForDiet(dietPreference: FamilyDietPreference, mealTime: MealTime): NutritionEstimate {
  if (mealTime === "high_tea" || mealTime === "evening_snack" || mealTime === "snack") {
    if (dietPreference === "vegan") {
      return nutritionEstimate(
        { caloriesKcal: 940, proteinGrams: 38, carbsGrams: 122, fatGrams: 30, fiberGrams: 24 },
        "Estimated family total for vegan high tea with vegetable chilla, peanut chutney, fruit, and herbal infusion."
      );
    }
    return nutritionEstimate(
      { caloriesKcal: 980, proteinGrams: 42, carbsGrams: 118, fatGrams: 34, fiberGrams: 18 },
      "Estimated family total for high tea with vegetable chilla, curd, fruit, and unsweetened tea."
    );
  }

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

  if (dietPreference === "vegan") {
    return nutritionEstimate(
      { caloriesKcal: 1500, proteinGrams: 62, carbsGrams: 230, fatGrams: 34, fiberGrams: 42 },
      "Estimated family total for vegan dal, millet or rice, vegetables, and nut/seed chutney."
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

function mealForDiet(input: GeneratePlanInput, mealId: string, mealTime: MealTime, regionFit: string): CommonMealDraft | null {
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

  if (dietPreference === "vegan") {
    return {
      mealId,
      name: "Vegan Dal, Millet-Rice and Seasonal Sabzi Plate",
      mealTime,
      description: "A fully plant-based family meal with dal, vegetables, millet or rice, and nut/seed chutney. It avoids meat, fish, eggs, milk, paneer, butter, ghee, curd and other dairy.",
      ingredients: veganDalIngredients(),
      prepTimeMinutes: 35,
      difficulty: "easy",
      regionFit,
      nutritionIntent: "Plant-based family meal that keeps protein, fiber and practical home cooking visible without animal-derived ingredients.",
      nutritionEstimate: estimateForDiet(dietPreference, mealTime)
    };
  }

  return null;
}

function mealAttendanceFor(input: GeneratePlanInput, mealTime: MealTime) {
  return (
    input.mealAttendance?.find((entry) => entry.enabled && entry.mealTime === mealTime) ??
    quantityPlanningService.defaultAttendance(mealTime, input.members)
  );
}

function mealForTime(input: GeneratePlanInput, mealId: string): CommonMeal {
  const mealTime = input.mealTime ?? "lunch";
  const localContext = input.mealTimeContext?.timeZone ? `, timed for ${input.mealTimeContext.timeZone}` : "";
  const cuisineFit = input.family.cuisinePreferences.length ? ` with ${input.family.cuisinePreferences.join(", ")} food-culture fit` : "";
  const regionFit = `${input.family.city}, ${input.family.state}, ${input.family.country} friendly${cuisineFit}${localContext}`;

  if (mealTime === "high_tea" || mealTime === "evening_snack" || mealTime === "snack") {
    if (input.family.dietPreference === "vegan") {
      return completeMeal({
        mealId,
        name: "Vegan High Tea: Vegetable Chilla with Peanut Chutney and Fruit",
        mealTime,
        description: "A vegan high-tea plate using besan, vegetables, chutney, fruit and herbal beverage without dairy or eggs.",
        ingredients: veganHighTeaIngredients(),
        prepTimeMinutes: 25,
        difficulty: "easy",
        regionFit,
        nutritionIntent: "Light plant-based snack with pulse protein, fruit, hydration, and no animal-derived ingredients.",
        nutritionEstimate: estimateForDiet(input.family.dietPreference, mealTime)
      });
    }
    return completeMeal({
      mealId,
      name: "High Tea: Vegetable Chilla with Curd, Fruit and Unsweetened Tea",
      mealTime,
      description: "A light family high-tea plate that supports children, adults, seniors, and diabetes-aware beverage choices.",
      ingredients: highTeaIngredients(),
      prepTimeMinutes: 25,
      difficulty: "easy",
      regionFit,
      nutritionIntent: "Avoid heavy evening snacking while keeping protein, fruit, hydration, and portion control visible.",
      nutritionEstimate: estimateForDiet(input.family.dietPreference, mealTime)
    });
  }

  const dietMeal = mealForDiet(input, mealId, mealTime, regionFit);
  if (dietMeal) return completeMeal(dietMeal);

  if (input.replacement) {
    return completeMeal({
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
    });
  }

  if (mealTime === "breakfast") {
    return completeMeal({
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
    });
  }

  if (mealTime === "dinner") {
    return completeMeal({
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
    });
  }

  return completeMeal({
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
  });
}

function budgetWarning(family: Family, estimatedMealCost: number, estimatedDailyCost: number) {
  const budget = family.budget;
  if (budget.type === "none" || !budget.amount) {
    return "No fixed food budget was set; use the estimated meal and grocery costs as planning guidance.";
  }

  const estimatedCost = budget.type === "per_meal" ? estimatedMealCost : estimatedDailyCost;
  const limit =
    budget.type === "per_meal"
      ? budget.amount
      : budget.type === "daily"
        ? budget.amount
        : budget.type === "weekly"
          ? budget.amount / 7
          : budget.amount / 30;
  const status = estimatedCost <= limit ? "within" : "above";
  const priority = budget.priority === "strict" ? "strict" : "flexible";
  const lowCost = budget.preferLowCostMeals ? " Low-cost meal preference is enabled." : "";

  return `Budget check: this estimate is ${status} the ${priority} ${budget.type.replace("_", " ")} budget target.${lowCost}`;
}

type OutputLanguage = "en" | "hi" | "kn";

function outputLanguage(locale?: string): OutputLanguage {
  if (locale === "hi" || locale === "kn") return locale;
  return "en";
}

const mealNameTranslations = {
  hi: {
    "Chicken Dal Rice Plate with Vegetables and Curd": "सब्जियों और दही के साथ चिकन-दाल-चावल प्लेट",
    "Egg Curry with Roti, Seasonal Sabzi and Curd": "रोटी, मौसमी सब्जी और दही के साथ अंडा करी",
    "Family Dal-Roti-Sabzi with Optional Egg or Chicken Add-On": "वैकल्पिक अंडा या चिकन के साथ पारिवारिक दाल-रोटी-सब्जी",
    "Vegan Dal, Millet-Rice and Seasonal Sabzi Plate": "वीगन दाल, मिलेट-चावल और मौसमी सब्जी की थाली",
    "Vegan High Tea: Vegetable Chilla with Peanut Chutney and Fruit": "वीगन हाई टी: मूंगफली चटनी और फल के साथ सब्जी चीला",
    "High Tea: Vegetable Chilla with Curd, Fruit and Unsweetened Tea": "हाई टी: दही, फल और बिना चीनी वाली चाय के साथ सब्जी चीला",
    "Ragi Dosa with Vegetable Sambar and Curd": "सब्जी सांभर और दही के साथ रागी डोसा",
    "Ragi Dosa with Vegetable Sambar and Paneer Side": "सब्जी सांभर और पनीर साइड के साथ रागी डोसा",
    "Vegetable Poha with Curd and Fruit": "दही और फल के साथ सब्जी पोहा",
    "Vegetable Moong Dal Khichdi with Curd": "दही के साथ सब्जियों वाली मूंग दाल खिचड़ी",
    "Roti, Masoor Dal, Seasonal Sabzi and Curd": "रोटी, मसूर दाल, मौसमी सब्जी और दही"
  },
  kn: {
    "Chicken Dal Rice Plate with Vegetables and Curd": "ತರಕಾರಿ ಮತ್ತು ಮೊಸರು ಜೊತೆಗೆ ಚಿಕನ್-ದಾಲ್-ಅಕ್ಕಿ ತಟ್ಟೆ",
    "Egg Curry with Roti, Seasonal Sabzi and Curd": "ರೊಟ್ಟಿ, ಋತುಮಾನ ತರಕಾರಿ ಮತ್ತು ಮೊಸರು ಜೊತೆಗೆ ಮೊಟ್ಟೆ ಕರಿ",
    "Family Dal-Roti-Sabzi with Optional Egg or Chicken Add-On": "ಐಚ್ಛಿಕ ಮೊಟ್ಟೆ ಅಥವಾ ಚಿಕನ್ ಜೊತೆ ಕುಟುಂಬದ ದಾಲ್-ರೊಟ್ಟಿ-ತರಕಾರಿ",
    "Vegan Dal, Millet-Rice and Seasonal Sabzi Plate": "ವೀಗನ್ ದಾಲ್, ಮಿಲ್ಲೆಟ್-ಅಕ್ಕಿ ಮತ್ತು ಋತುಮಾನ ತರಕಾರಿ ತಟ್ಟೆ",
    "Vegan High Tea: Vegetable Chilla with Peanut Chutney and Fruit": "ವೀಗನ್ ಹೈ ಟೀ: ಕಡಲೆಕಾಯಿ ಚಟ್ನಿ ಮತ್ತು ಹಣ್ಣು ಜೊತೆಗೆ ತರಕಾರಿ ಚಿಲ್ಲಾ",
    "High Tea: Vegetable Chilla with Curd, Fruit and Unsweetened Tea": "ಹೈ ಟೀ: ಮೊಸರು, ಹಣ್ಣು ಮತ್ತು ಸಕ್ಕರೆರಹಿತ ಚಹಾ ಜೊತೆಗೆ ತರಕಾರಿ ಚಿಲ್ಲಾ",
    "Ragi Dosa with Vegetable Sambar and Curd": "ತರಕಾರಿ ಸಾಂಬಾರ್ ಮತ್ತು ಮೊಸರು ಜೊತೆಗೆ ರಾಗಿ ದೋಸೆ",
    "Ragi Dosa with Vegetable Sambar and Paneer Side": "ತರಕಾರಿ ಸಾಂಬಾರ್ ಮತ್ತು ಪನೀರ್ ಸೈಡ್ ಜೊತೆಗೆ ರಾಗಿ ದೋಸೆ",
    "Vegetable Poha with Curd and Fruit": "ಮೊಸರು ಮತ್ತು ಹಣ್ಣು ಜೊತೆಗೆ ತರಕಾರಿ ಪೊಹಾ",
    "Vegetable Moong Dal Khichdi with Curd": "ಮೊಸರು ಜೊತೆಗೆ ತರಕಾರಿ ಮೂಂಗ್ ದಾಲ್ ಖಿಚಡಿ",
    "Roti, Masoor Dal, Seasonal Sabzi and Curd": "ರೊಟ್ಟಿ, ಮಸೂರ್ ದಾಲ್, ಋತುಮಾನ ತರಕಾರಿ ಮತ್ತು ಮೊಸರು"
  }
} satisfies Record<Exclude<OutputLanguage, "en">, Record<string, string>>;

const ingredientTranslations = {
  hi: {
    "Moong dal": "मूंग दाल",
    "Rice": "चावल",
    "Mixed vegetables": "मिली-जुली सब्जियां",
    "Curd": "दही",
    "Cumin and turmeric": "जीरा और हल्दी",
    "Ragi flour": "रागी आटा",
    "Urad dal": "उड़द दाल",
    "Vegetable sambar mix": "सब्जी सांभर सामग्री",
    "Paneer": "पनीर",
    "Poha": "पोहा",
    "Peanuts": "मूंगफली",
    "Onion and peas": "प्याज और मटर",
    "Lemon and coriander": "नींबू और धनिया",
    "Whole wheat flour": "गेहूं का आटा",
    "Masoor dal": "मसूर दाल",
    "Seasonal vegetable sabzi": "मौसमी सब्जी",
    "Basic spices": "बेसिक मसाले",
    "Besan": "बेसन",
    "Mixed grated vegetables": "कद्दूकस की हुई मिली-जुली सब्जियां",
    "Seasonal fruit": "मौसमी फल",
    "Unsweetened tea or herbal infusion": "बिना चीनी की चाय या हर्बल पेय",
    "Eggs": "अंडे",
    "Onion tomato masala": "प्याज-टमाटर मसाला",
    "Chicken": "चिकन",
    "Eggs or chicken add-on": "अंडा या चिकन ऐड-ऑन",
    "Brown rice or millet": "ब्राउन राइस या मिलेट",
    "Roasted peanuts or sesame chutney": "भुनी मूंगफली या तिल की चटनी",
    "Basic spices and lemon": "बेसिक मसाले और नींबू",
    "Peanut or coconut chutney": "मूंगफली या नारियल चटनी",
    "Herbal infusion or lemon water": "हर्बल पेय या नींबू पानी"
  },
  kn: {
    "Moong dal": "ಮೂಂಗ್ ದಾಲ್",
    "Rice": "ಅಕ್ಕಿ",
    "Mixed vegetables": "ಮಿಶ್ರ ತರಕಾರಿಗಳು",
    "Curd": "ಮೊಸರು",
    "Cumin and turmeric": "ಜೀರಿಗೆ ಮತ್ತು ಅರಿಶಿನ",
    "Ragi flour": "ರಾಗಿ ಹಿಟ್ಟು",
    "Urad dal": "ಉದ್ದಿನ ಬೇಳೆ",
    "Vegetable sambar mix": "ತರಕಾರಿ ಸಾಂಬಾರ್ ಸಾಮಗ್ರಿ",
    "Paneer": "ಪನೀರ್",
    "Poha": "ಪೊಹಾ",
    "Peanuts": "ಕಡಲೆಕಾಯಿ",
    "Onion and peas": "ಈರುಳ್ಳಿ ಮತ್ತು ಬಟಾಣಿ",
    "Lemon and coriander": "ನಿಂಬೆ ಮತ್ತು ಕೊತ್ತಂಬರಿ",
    "Whole wheat flour": "ಗೋಧಿ ಹಿಟ್ಟು",
    "Masoor dal": "ಮಸೂರ್ ದಾಲ್",
    "Seasonal vegetable sabzi": "ಋತುಮಾನ ತರಕಾರಿ",
    "Basic spices": "ಮೂಲ ಮಸಾಲೆಗಳು",
    "Besan": "ಬೇಸನ್",
    "Mixed grated vegetables": "ತುರಿದ ಮಿಶ್ರ ತರಕಾರಿಗಳು",
    "Seasonal fruit": "ಋತುಮಾನ ಹಣ್ಣು",
    "Unsweetened tea or herbal infusion": "ಸಕ್ಕರೆರಹಿತ ಚಹಾ ಅಥವಾ ಹರ್ಬಲ್ ಪಾನೀಯ",
    "Eggs": "ಮೊಟ್ಟೆಗಳು",
    "Onion tomato masala": "ಈರುಳ್ಳಿ-ಟೊಮೇಟೊ ಮಸಾಲೆ",
    "Chicken": "ಚಿಕನ್",
    "Eggs or chicken add-on": "ಮೊಟ್ಟೆ ಅಥವಾ ಚಿಕನ್ ಐಚ್ಛಿಕ ಸೇರಿಕೆ",
    "Brown rice or millet": "ಬ್ರೌನ್ ರೈಸ್ ಅಥವಾ ಮಿಲ್ಲೆಟ್",
    "Roasted peanuts or sesame chutney": "ಹುರಿದ ಕಡಲೆಕಾಯಿ ಅಥವಾ ಎಳ್ಳು ಚಟ್ನಿ",
    "Basic spices and lemon": "ಮೂಲ ಮಸಾಲೆಗಳು ಮತ್ತು ನಿಂಬೆ",
    "Peanut or coconut chutney": "ಕಡಲೆಕಾಯಿ ಅಥವಾ ತೆಂಗಿನ ಚಟ್ನಿ",
    "Herbal infusion or lemon water": "ಹರ್ಬಲ್ ಪಾನೀಯ ಅಥವಾ ನಿಂಬೆ ನೀರು"
  }
} satisfies Record<Exclude<OutputLanguage, "en">, Record<string, string>>;

function translateIngredientName(name: string, language: OutputLanguage) {
  if (language === "en") return name;
  return ingredientTranslations[language][name] ?? name;
}

function translateMealName(name: string, language: OutputLanguage) {
  if (language === "en") return name;
  return mealNameTranslations[language][name] ?? name;
}

function translateText(text: string | undefined, language: OutputLanguage): string | undefined {
  if (!text || language === "en") return text;

  const hi: Record<string, string> = {
    "A soft, affordable, Indian dinner that can be adjusted for age, activity, and diabetes-aware portions.":
      "एक हल्का, किफायती भारतीय भोजन, जिसे परिवार के सदस्यों की उम्र, गतिविधि और भोजन संबंधी आवश्यकताओं के अनुसार समायोजित किया जा सकता है।",
    "A quick Indian breakfast that can be softened, portion-controlled, or protein-supported by member need.":
      "एक जल्दी बनने वाला भारतीय नाश्ता, जिसे सदस्य की जरूरत के अनुसार नरम, नियंत्रित हिस्से वाला या प्रोटीन-समर्थित बनाया जा सकता है।",
    "A practical Indian lunch plate that keeps one common family meal while adapting portions for each member.":
      "एक व्यावहारिक भारतीय दोपहर का भोजन, जिसमें परिवार के लिए एक साझा भोजन रहता है और हर सदस्य के हिस्से अलग से समायोजित होते हैं।",
    "A fully plant-based family meal with dal, vegetables, millet or rice, and nut/seed chutney. It avoids meat, fish, eggs, milk, paneer, butter, ghee, curd and other dairy.":
      "दाल, सब्जियों, मिलेट या चावल और मेवा/बीज की चटनी वाला पूरी तरह पौधों पर आधारित पारिवारिक भोजन। इसमें मांस, मछली, अंडा, दूध, पनीर, मक्खन, घी, दही और अन्य डेयरी शामिल नहीं हैं।",
    "A non-vegetarian family meal with chicken protein, dal, vegetables, curd, and member-specific portions.":
      "चिकन प्रोटीन, दाल, सब्जियों, दही और सदस्य-विशेष हिस्सों वाला पारिवारिक नॉन-वेज भोजन।",
    "An eggetarian family meal with egg protein, roti, vegetables, and curd that can be portion-adjusted for each member.":
      "अंडे के प्रोटीन, रोटी, सब्जियों और दही वाला एगेटेरियन पारिवारिक भोजन, जिसे हर सदस्य के हिस्से के अनुसार बदला जा सकता है।",
    "A shared vegetarian base meal with optional egg or chicken protein for members who eat it, keeping one family table.":
      "एक साझा शाकाहारी बेस भोजन, जिसमें जो सदस्य खाते हैं उनके लिए वैकल्पिक अंडा या चिकन प्रोटीन जोड़ा जा सकता है।",
    "A vegan high-tea plate using besan, vegetables, chutney, fruit and herbal beverage without dairy or eggs.":
      "बिना डेयरी या अंडे के बेसन, सब्जियों, चटनी, फल और हर्बल पेय वाली वीगन हाई टी प्लेट।",
    "A light family high-tea plate that supports children, adults, seniors, and diabetes-aware beverage choices.":
      "बच्चों, वयस्कों, वरिष्ठ सदस्यों और डायबिटीज-अनुकूल पेय विकल्पों को ध्यान में रखकर बनाई गई हल्की पारिवारिक हाई टी प्लेट।",
    "A familiar South Indian family meal with millet base, vegetable sambar, curd, and optional paneer support.":
      "मिलेट बेस, सब्जी सांभर, दही और वैकल्पिक पनीर के साथ परिचित दक्षिण भारतीय पारिवारिक भोजन।",
    "One common dinner with digestibility, pulse protein, vegetables, and controlled grain portions.":
      "एक साझा रात का भोजन, जिसमें पाचन-सुलभता, दाल का प्रोटीन, सब्जियां और नियंत्रित अनाज हिस्से शामिल हैं।",
    "Light family breakfast with vegetables, curd, and member-specific portions.":
      "सब्जियों, दही और सदस्य-विशेष हिस्सों वाला हल्का पारिवारिक नाश्ता।",
    "Balanced lunch with grains, dal protein, vegetables, curd, and member-specific portion guidance.":
      "अनाज, दाल प्रोटीन, सब्जियों, दही और सदस्य-विशेष हिस्सों के मार्गदर्शन वाला संतुलित दोपहर का भोजन।",
    "Plant-based family meal that keeps protein, fiber and practical home cooking visible without animal-derived ingredients.":
      "पौधों पर आधारित पारिवारिक भोजन, जिसमें पशु-जनित सामग्री के बिना प्रोटीन, फाइबर और व्यावहारिक घर का खाना शामिल है।",
    "Nutrition values are estimates and should not be treated as medical advice.":
      "पोषण संबंधी आंकड़े अनुमान हैं और इन्हें चिकित्सा सलाह नहीं माना जाना चाहिए।",
    "Known allergies and doctor restrictions must be reviewed before cooking.":
      "खाना बनाने से पहले ज्ञात एलर्जी और डॉक्टर की पाबंदियां अवश्य जांचें।",
    "New-user mode generates a focused next-meal plan for onboarding and demo clarity.":
      "नए उपयोगकर्ता मोड में शुरुआत और डेमो को स्पष्ट रखने के लिए अगले भोजन की केंद्रित योजना बनती है।",
    "Score balances taste familiarity, health fit, affordability, local availability, and cooking effort.":
      "यह स्कोर स्वाद की परिचितता, स्वास्थ्य-उपयुक्तता, किफायत, स्थानीय उपलब्धता और पकाने के प्रयास का संतुलन दिखाता है।",
    [mandatoryDisclaimer]:
      "MAMAAI भोजन योजना में मदद करता है, लेकिन यह डॉक्टर, डाइटीशियन या पशु-चिकित्सक की सलाह का विकल्प नहीं है। एलर्जी, बीमारी, गर्भावस्था, बच्चों, बुजुर्गों और पालतू सदस्यों के लिए आवश्यक होने पर विशेषज्ञ से सलाह लें।"
  };

  const kn: Record<string, string> = {
    "A soft, affordable, Indian dinner that can be adjusted for age, activity, and diabetes-aware portions.":
      "ಕುಟುಂಬ ಸದಸ್ಯರ ವಯಸ್ಸು, ಚಟುವಟಿಕೆ ಮತ್ತು ಮಧುಮೇಹ-ಜಾಗೃತ ಭಾಗಗಳಿಗೆ ಹೊಂದಿಸಬಹುದಾದ ಮೃದುವಾದ, ಕೈಗೆಟುಕುವ ಭಾರತೀಯ ಊಟ.",
    "A quick Indian breakfast that can be softened, portion-controlled, or protein-supported by member need.":
      "ಸದಸ್ಯರ ಅಗತ್ಯಕ್ಕೆ ಅನುಗುಣವಾಗಿ ಮೃದುವಾಗಿಸಬಹುದಾದ, ಭಾಗ ನಿಯಂತ್ರಿಸಬಹುದಾದ ಅಥವಾ ಪ್ರೋಟೀನ್ ಬೆಂಬಲ ಸೇರಿಸಬಹುದಾದ ತ್ವರಿತ ಭಾರತೀಯ ಉಪಹಾರ.",
    "A practical Indian lunch plate that keeps one common family meal while adapting portions for each member.":
      "ಒಂದು ಸಾಮಾನ್ಯ ಕುಟುಂಬದ ಊಟವನ್ನು ಉಳಿಸಿಕೊಂಡು ಪ್ರತಿಯೊಬ್ಬ ಸದಸ್ಯರ ಭಾಗಗಳನ್ನು ಹೊಂದಿಸುವ ಪ್ರಾಯೋಗಿಕ ಭಾರತೀಯ ಮಧ್ಯಾಹ್ನದ ಊಟ.",
    "A fully plant-based family meal with dal, vegetables, millet or rice, and nut/seed chutney. It avoids meat, fish, eggs, milk, paneer, butter, ghee, curd and other dairy.":
      "ದಾಲ್, ತರಕಾರಿಗಳು, ಮಿಲ್ಲೆಟ್ ಅಥವಾ ಅಕ್ಕಿ ಮತ್ತು ಕಾಯಿ/ಬೀಜದ ಚಟ್ನಿಯೊಂದಿಗಿನ ಸಂಪೂರ್ಣ ಸಸ್ಯಾಧಾರಿತ ಕುಟುಂಬದ ಊಟ. ಇದರಲ್ಲಿ ಮಾಂಸ, ಮೀನು, ಮೊಟ್ಟೆ, ಹಾಲು, ಪನೀರ್, ಬೆಣ್ಣೆ, ತುಪ್ಪ, ಮೊಸರು ಮತ್ತು ಇತರ ಡೈರಿ ಪದಾರ್ಥಗಳಿಲ್ಲ.",
    "A non-vegetarian family meal with chicken protein, dal, vegetables, curd, and member-specific portions.":
      "ಚಿಕನ್ ಪ್ರೋಟೀನ್, ದಾಲ್, ತರಕಾರಿಗಳು, ಮೊಸರು ಮತ್ತು ಸದಸ್ಯರಿಗನುಗುಣ ಭಾಗಗಳಿರುವ ನಾನ್-ವೆಜ್ ಕುಟುಂಬದ ಊಟ.",
    "An eggetarian family meal with egg protein, roti, vegetables, and curd that can be portion-adjusted for each member.":
      "ಮೊಟ್ಟೆ ಪ್ರೋಟೀನ್, ರೊಟ್ಟಿ, ತರಕಾರಿಗಳು ಮತ್ತು ಮೊಸರು ಹೊಂದಿರುವ, ಪ್ರತಿಯೊಬ್ಬ ಸದಸ್ಯರ ಭಾಗಕ್ಕೆ ಹೊಂದಿಸಬಹುದಾದ ಎಗ್ಗೆಟೇರಿಯನ್ ಕುಟುಂಬದ ಊಟ.",
    "A shared vegetarian base meal with optional egg or chicken protein for members who eat it, keeping one family table.":
      "ಒಂದು ಕುಟುಂಬದ ಊಟವನ್ನು ಉಳಿಸಿಕೊಂಡು, ತಿನ್ನುವ ಸದಸ್ಯರಿಗೆ ಐಚ್ಛಿಕ ಮೊಟ್ಟೆ ಅಥವಾ ಚಿಕನ್ ಪ್ರೋಟೀನ್ ಸೇರಿಸಬಹುದಾದ ಹಂಚಿಕೊಂಡ ಸಸ್ಯಾಹಾರಿ ಬೇಸ್ ಊಟ.",
    "A vegan high-tea plate using besan, vegetables, chutney, fruit and herbal beverage without dairy or eggs.":
      "ಡೈರಿ ಅಥವಾ ಮೊಟ್ಟೆಯಿಲ್ಲದೆ ಬೇಸನ್, ತರಕಾರಿಗಳು, ಚಟ್ನಿ, ಹಣ್ಣು ಮತ್ತು ಹರ್ಬಲ್ ಪಾನೀಯದಿಂದ ಮಾಡಿದ ವೀಗನ್ ಹೈ ಟೀ ತಟ್ಟೆ.",
    "A light family high-tea plate that supports children, adults, seniors, and diabetes-aware beverage choices.":
      "ಮಕ್ಕಳು, ವಯಸ್ಕರು, ಹಿರಿಯರು ಮತ್ತು ಮಧುಮೇಹ-ಜಾಗೃತ ಪಾನೀಯ ಆಯ್ಕೆಗಳನ್ನು ಗಮನದಲ್ಲಿಟ್ಟುಕೊಂಡ ಹಗುರವಾದ ಕುಟುಂಬದ ಹೈ ಟೀ ತಟ್ಟೆ.",
    "A familiar South Indian family meal with millet base, vegetable sambar, curd, and optional paneer support.":
      "ಮಿಲ್ಲೆಟ್ ಬೇಸ್, ತರಕಾರಿ ಸಾಂಬಾರ್, ಮೊಸರು ಮತ್ತು ಐಚ್ಛಿಕ ಪನೀರ್ ಬೆಂಬಲದೊಂದಿಗೆ ಪರಿಚಿತ ದಕ್ಷಿಣ ಭಾರತೀಯ ಕುಟುಂಬದ ಊಟ.",
    "One common dinner with digestibility, pulse protein, vegetables, and controlled grain portions.":
      "ಜೀರ್ಣಕ್ಕೆ ಸುಲಭವಾದ, ಬೇಳೆ ಪ್ರೋಟೀನ್, ತರಕಾರಿಗಳು ಮತ್ತು ನಿಯಂತ್ರಿತ ಧಾನ್ಯ ಭಾಗಗಳಿರುವ ಒಂದು ಸಾಮಾನ್ಯ ರಾತ್ರಿ ಊಟ.",
    "Light family breakfast with vegetables, curd, and member-specific portions.":
      "ತರಕಾರಿಗಳು, ಮೊಸರು ಮತ್ತು ಸದಸ್ಯರಿಗನುಗುಣ ಭಾಗಗಳಿರುವ ಹಗುರವಾದ ಕುಟುಂಬದ ಉಪಹಾರ.",
    "Balanced lunch with grains, dal protein, vegetables, curd, and member-specific portion guidance.":
      "ಧಾನ್ಯಗಳು, ದಾಲ್ ಪ್ರೋಟೀನ್, ತರಕಾರಿಗಳು, ಮೊಸರು ಮತ್ತು ಸದಸ್ಯರಿಗನುಗುಣ ಭಾಗ ಮಾರ್ಗದರ್ಶನದೊಂದಿಗೆ ಸಮತೋಲನ ಮಧ್ಯಾಹ್ನದ ಊಟ.",
    "Plant-based family meal that keeps protein, fiber and practical home cooking visible without animal-derived ingredients.":
      "ಪ್ರಾಣಿ ಮೂಲದ ಪದಾರ್ಥಗಳಿಲ್ಲದೆ ಪ್ರೋಟೀನ್, ಫೈಬರ್ ಮತ್ತು ಪ್ರಾಯೋಗಿಕ ಮನೆಯ ಅಡುಗೆಯನ್ನು ಒಳಗೊಂಡ ಸಸ್ಯಾಧಾರಿತ ಕುಟುಂಬದ ಊಟ.",
    "Nutrition values are estimates and should not be treated as medical advice.":
      "ಪೋಷಕಾಂಶದ ಮೌಲ್ಯಗಳು ಅಂದಾಜುಗಳು; ಅವನ್ನು ವೈದ್ಯಕೀಯ ಸಲಹೆಯಾಗಿ ಪರಿಗಣಿಸಬಾರದು.",
    "Known allergies and doctor restrictions must be reviewed before cooking.":
      "ಅಡುಗೆ ಮಾಡುವ ಮೊದಲು ತಿಳಿದಿರುವ ಅಲರ್ಜಿಗಳು ಮತ್ತು ವೈದ್ಯರ ನಿರ್ಬಂಧಗಳನ್ನು ಅವಶ್ಯವಾಗಿ ಪರಿಶೀಲಿಸಿ.",
    "New-user mode generates a focused next-meal plan for onboarding and demo clarity.":
      "ಹೊಸ ಬಳಕೆದಾರ ಮೋಡ್ ಆರಂಭ ಮತ್ತು ಡೆಮೊ ಸ್ಪಷ್ಟತೆಗೆ ಮುಂದಿನ ಊಟದ ಕೇಂದ್ರೀಕೃತ ಯೋಜನೆಯನ್ನು ರಚಿಸುತ್ತದೆ.",
    "Score balances taste familiarity, health fit, affordability, local availability, and cooking effort.":
      "ಈ ಸ್ಕೋರ್ ರುಚಿಯ ಪರಿಚಿತತೆ, ಆರೋಗ್ಯ ಹೊಂದಾಣಿಕೆ, ಕೈಗೆಟುಕುವಿಕೆ, ಸ್ಥಳೀಯ ಲಭ್ಯತೆ ಮತ್ತು ಅಡುಗೆ ಶ್ರಮದ ಸಮತೋಲನವನ್ನು ತೋರಿಸುತ್ತದೆ.",
    [mandatoryDisclaimer]:
      "MAMAAI ಊಟದ ಯೋಜನೆಗೆ ಸಹಾಯ ಮಾಡುತ್ತದೆ; ಆದರೆ ಇದು ವೈದ್ಯರು, ಡೈಟಿಷಿಯನ್ ಅಥವಾ ಪಶುವೈದ್ಯರ ಸಲಹೆಗೆ ಪರ್ಯಾಯವಲ್ಲ. ಅಲರ್ಜಿ, ಕಾಯಿಲೆ, ಗರ್ಭಧಾರಣೆ, ಮಕ್ಕಳು, ಹಿರಿಯರು ಮತ್ತು ಪೆಟ್ ಸದಸ್ಯರಿಗೆ ಅಗತ್ಯವಿದ್ದರೆ ತಜ್ಞರನ್ನು ಸಂಪರ್ಕಿಸಿ."
  };

  return (language === "hi" ? hi[text] : kn[text]) ?? translateCommonText(text, language);
}

function translateCommonText(text: string, language: Exclude<OutputLanguage, "en">) {
  const replacements: Array<[RegExp, string]> =
    language === "hi"
      ? [
          [/Wash rice and moong dal until the water runs mostly clear\./g, "चावल और मूंग दाल को तब तक धोएं जब तक पानी लगभग साफ न हो जाए।"],
          [/Add rice, dal, chopped vegetables, cumin, turmeric, and water to a pressure cooker\./g, "प्रेशर कुकर में चावल, दाल, कटी सब्जियां, जीरा, हल्दी और पानी डालें।"],
          [/Cook until soft; use extra water for elderly members who need a softer texture\./g, "नरम होने तक पकाएं; जिन बुजुर्ग सदस्यों को ज्यादा नरम बनावट चाहिए, उनके लिए थोड़ा ज्यादा पानी रखें।"],
          [/Whisk curd separately and serve on the side so members with restrictions can skip it\./g, "दही को अलग से फेंटकर साइड में दें ताकि जिन सदस्यों को परहेज है वे इसे छोड़ सकें।"],
          [/Finish individual bowls with portion changes listed in the MAMA Family Table\./g, "हर कटोरी में MAMA Family Table के अनुसार हिस्से और बदलाव करें।"],
          [/Use the MAMA Family Table portions for each member\./g, "हर सदस्य के लिए MAMA Family Table वाले हिस्से इस्तेमाल करें।"],
          [/Do not serve any listed allergy or never-include ingredient to the affected member\./g, "जिस सदस्य को एलर्जी या सख्त परहेज है, उसे वह सामग्री बिल्कुल न दें।"],
          [/Keep curd, paneer, egg, chicken, and other optional protein add-ons separate when family preferences differ\./g, "जब परिवार की पसंद अलग-अलग हो, तो दही, पनीर, अंडा, चिकन और अन्य वैकल्पिक प्रोटीन अलग रखें।"],
          [/Rice can be replaced with millet, roti, or extra vegetables depending on the meal\./g, "भोजन के अनुसार चावल की जगह मिलेट, रोटी या अतिरिक्त सब्जियां ली जा सकती हैं।"],
          [/Paneer can be replaced with dal, soy, curd, egg, or chicken based on the family food pattern\./g, "परिवार के भोजन पैटर्न के अनुसार पनीर की जगह दाल, सोया, दही, अंडा या चिकन लिया जा सकता है।"],
          [/Curd can be skipped or replaced with a tolerated side when dairy is unsuitable\./g, "यदि डेयरी उपयुक्त नहीं है, तो दही छोड़ा जा सकता है या सहन होने वाली साइड डिश से बदला जा सकता है।"],
          [/Search YouTube for /g, "YouTube पर खोजें: "],
          [/YouTube integration is planned; for now, use this as a safe search recommendation and verify ingredients against family restrictions\./g, "YouTube integration planned है; अभी इसे सुरक्षित search suggestion की तरह use करें और ingredients को family restrictions से मिलाकर जांचें।"],
          [/Regular balanced portion with vegetables and curd\./g, "सब्जियों और दही के साथ नियमित संतुलित हिस्सा।"],
          [/1\.5 bowls khichdi with 0\.5 cup curd\./g, "1.5 कटोरी खिचड़ी और 0.5 कप दही।"],
          [/Sip water steadily across the day\./g, "दिन भर नियमित अंतराल पर पानी पिएं।"],
          [/Small frequent water servings through the day\./g, "दिन भर थोड़ी-थोड़ी मात्रा में बार-बार पानी दें।"],
          [/Mid-morning or evening, away from the main meal if preferred\./g, "जरूरत हो तो मुख्य भोजन से अलग, मध्य-सुबह या शाम को दें।"],
          [/Prefer whole fruit and avoid juice unless a clinician has advised otherwise\./g, "पूरा फल बेहतर है; डॉक्टर ने न कहा हो तो जूस से बचें।"],
          [/Guava/g, "अमरूद"],
          [/Banana/g, "केला"],
          [/Papaya/g, "पपीता"],
          [/Apple/g, "सेब"],
          [/Pear/g, "नाशपाती"],
          [/Orange/g, "संतरा"],
          [/Seasonal melon/g, "मौसमी खरबूजा"],
          [/Water/g, "पानी"],
          [/Unsweetened buttermilk/g, "बिना चीनी की छाछ"]
        ]
      : [
          [/Wash rice and moong dal until the water runs mostly clear\./g, "ಅಕ್ಕಿ ಮತ್ತು ಮೂಂಗ್ ದಾಲ್ ಅನ್ನು ನೀರು ಬಹುತೇಕ ಸ್ವಚ್ಛವಾಗುವವರೆಗೆ ತೊಳೆಯಿರಿ."],
          [/Add rice, dal, chopped vegetables, cumin, turmeric, and water to a pressure cooker\./g, "ಪ್ರೆಶರ್ ಕುಕ್ಕರ್‌ಗೆ ಅಕ್ಕಿ, ದಾಲ್, ಕತ್ತರಿಸಿದ ತರಕಾರಿಗಳು, ಜೀರಿಗೆ, ಅರಿಶಿನ ಮತ್ತು ನೀರು ಹಾಕಿ."],
          [/Cook until soft; use extra water for elderly members who need a softer texture\./g, "ಮೃದುವಾಗುವವರೆಗೆ ಬೇಯಿಸಿ; ಹೆಚ್ಚು ಮೃದುವಾದ ತಿನಿಸು ಬೇಕಾದ ಹಿರಿಯರಿಗೆ ಸ್ವಲ್ಪ ಹೆಚ್ಚು ನೀರು ಬಳಸಿ."],
          [/Whisk curd separately and serve on the side so members with restrictions can skip it\./g, "ಮೊಸರನ್ನು ಪ್ರತ್ಯೇಕವಾಗಿ ಕಲಸಿ ಸೈಡ್‌ನಲ್ಲಿ ನೀಡಿ, ನಿರ್ಬಂಧ ಇರುವವರು ಅದನ್ನು ಬಿಡಬಹುದು."],
          [/Finish individual bowls with portion changes listed in the MAMA Family Table\./g, "MAMA Family Table ನಲ್ಲಿ ಹೇಳಿರುವಂತೆ ಪ್ರತಿ ಬೌಲ್‌ನಲ್ಲಿ ಭಾಗ ಬದಲಾವಣೆ ಮಾಡಿ."],
          [/Use the MAMA Family Table portions for each member\./g, "ಪ್ರತಿ ಸದಸ್ಯರಿಗೆ MAMA Family Table ಭಾಗಗಳನ್ನು ಬಳಸಿ."],
          [/Do not serve any listed allergy or never-include ingredient to the affected member\./g, "ಅಲರ್ಜಿ ಅಥವಾ ಎಂದಿಗೂ ಸೇರಿಸಬಾರದ ಪದಾರ್ಥವನ್ನು ಸಂಬಂಧಿತ ಸದಸ್ಯರಿಗೆ ಕೊಡಬೇಡಿ."],
          [/Keep curd, paneer, egg, chicken, and other optional protein add-ons separate when family preferences differ\./g, "ಕುಟುಂಬದ ಇಷ್ಟಗಳು ಬೇರೆಬೇರೆಯಾಗಿದ್ದರೆ ಮೊಸರು, ಪನೀರ್, ಮೊಟ್ಟೆ, ಚಿಕನ್ ಮತ್ತು ಇತರ ಐಚ್ಛಿಕ ಪ್ರೋಟೀನ್ ಸೇರಿಕೆಗಳನ್ನು ಪ್ರತ್ಯೇಕವಾಗಿ ಇಡಿ."],
          [/Rice can be replaced with millet, roti, or extra vegetables depending on the meal\./g, "ಊಟಕ್ಕೆ ಅನುಗುಣವಾಗಿ ಅಕ್ಕಿಗೆ ಬದಲು ಮಿಲ್ಲೆಟ್, ರೊಟ್ಟಿ ಅಥವಾ ಹೆಚ್ಚುವರಿ ತರಕಾರಿಗಳನ್ನು ಬಳಸಬಹುದು."],
          [/Paneer can be replaced with dal, soy, curd, egg, or chicken based on the family food pattern\./g, "ಕುಟುಂಬದ ಆಹಾರ ಪದ್ಧತಿಗೆ ಅನುಗುಣವಾಗಿ ಪನೀರ್‌ಗೆ ಬದಲು ದಾಲ್, ಸೋಯಾ, ಮೊಸರು, ಮೊಟ್ಟೆ ಅಥವಾ ಚಿಕನ್ ಬಳಸಬಹುದು."],
          [/Curd can be skipped or replaced with a tolerated side when dairy is unsuitable\./g, "ಡೈರಿ ಸೂಕ್ತವಲ್ಲದಿದ್ದರೆ ಮೊಸರನ್ನು ಬಿಡಬಹುದು ಅಥವಾ ಸಹಿಸುವ ಸೈಡ್ ಡಿಶ್‌ನಿಂದ ಬದಲಾಯಿಸಬಹುದು."],
          [/Search YouTube for /g, "YouTube ನಲ್ಲಿ ಹುಡುಕಿ: "],
          [/YouTube integration is planned; for now, use this as a safe search recommendation and verify ingredients against family restrictions\./g, "YouTube integration planned ಇದೆ; ಈಗ ಇದನ್ನು safe search suggestion ಆಗಿ ಬಳಸಿ ಮತ್ತು ingredients ಅನ್ನು family restrictions ಜೊತೆ ಪರಿಶೀಲಿಸಿ."],
          [/Regular balanced portion with vegetables and curd\./g, "ತರಕಾರಿ ಮತ್ತು ಮೊಸರಿನೊಂದಿಗೆ ನಿಯಮಿತ ಸಮತೋಲನ ಭಾಗ."],
          [/1\.5 bowls khichdi with 0\.5 cup curd\./g, "1.5 ಬೌಲ್ ಖಿಚಡಿ ಮತ್ತು 0.5 ಕಪ್ ಮೊಸರು."],
          [/Sip water steadily across the day\./g, "ದಿನಪೂರ್ತಿ ನಿಯಮಿತವಾಗಿ ನೀರು ಕುಡಿಯಿರಿ."],
          [/Small frequent water servings through the day\./g, "ದಿನಪೂರ್ತಿ ಸ್ವಲ್ಪಸ್ವಲ್ಪವಾಗಿ ನೀರು ನೀಡಿ."],
          [/Mid-morning or evening, away from the main meal if preferred\./g, "ಅಗತ್ಯವಿದ್ದರೆ ಮುಖ್ಯ ಊಟದಿಂದ ಬೇರೆ, ಮಧ್ಯಬೆಳಗ್ಗೆ ಅಥವಾ ಸಂಜೆ ನೀಡಿ."],
          [/Prefer whole fruit and avoid juice unless a clinician has advised otherwise\./g, "ಪೂರ್ಣ ಹಣ್ಣು ಉತ್ತಮ; ವೈದ್ಯರು ಹೇಳದಿದ್ದರೆ ಜ್ಯೂಸ್ ತಪ್ಪಿಸಿ."],
          [/Guava/g, "ಪೇರಳೆ"],
          [/Banana/g, "ಬಾಳೆಹಣ್ಣು"],
          [/Papaya/g, "ಪಪ್ಪಾಯಿ"],
          [/Apple/g, "ಸೇಬು"],
          [/Pear/g, "ಪೇರ್"],
          [/Orange/g, "ಕಿತ್ತಳೆ"],
          [/Seasonal melon/g, "ಋತುಮಾನ ಕಲ್ಲಂಗಡಿ"],
          [/Water/g, "ನೀರು"],
          [/Unsweetened buttermilk/g, "ಸಕ್ಕರೆರಹಿತ ಮಜ್ಜಿಗೆ"]
        ];

  return replacements.reduce((result, [pattern, replacement]) => result.replace(pattern, replacement), text);
}

function localizeIngredient(ingredient: Ingredient, language: OutputLanguage): Ingredient {
  if (language === "en") return ingredient;
  return { ...ingredient, name: translateIngredientName(ingredient.name, language) };
}

export class AIService {
  localizeFamilyMealPlan(plan: FamilyMealPlan, locale?: string): FamilyMealPlan {
    const language = outputLanguage(locale);
    if (language === "en") return plan;

    return {
      ...plan,
      retentionPolicy: {
        ...plan.retentionPolicy,
        retainedLongTermSignals: plan.retentionPolicy.retainedLongTermSignals.map((signal) => translateText(signal, language) ?? signal),
        userMessage: translateText(plan.retentionPolicy.userMessage, language) ?? plan.retentionPolicy.userMessage
      },
      commonMeal: {
        ...plan.commonMeal,
        name: translateMealName(plan.commonMeal.name, language),
        description: translateText(plan.commonMeal.description, language) ?? plan.commonMeal.description,
        regionFit: translateText(plan.commonMeal.regionFit, language) ?? plan.commonMeal.regionFit,
        nutritionIntent: translateText(plan.commonMeal.nutritionIntent, language) ?? plan.commonMeal.nutritionIntent,
        ingredients: plan.commonMeal.ingredients.map((ingredient) => localizeIngredient(ingredient, language)),
        nutritionEstimate: {
          ...plan.commonMeal.nutritionEstimate,
          basis: translateText(plan.commonMeal.nutritionEstimate.basis, language) ?? plan.commonMeal.nutritionEstimate.basis,
          dataSource: translateText(plan.commonMeal.nutritionEstimate.dataSource, language) ?? plan.commonMeal.nutritionEstimate.dataSource
        },
        recipe: {
          ...plan.commonMeal.recipe,
          title: translateMealName(plan.commonMeal.recipe.title, language),
          ingredients: plan.commonMeal.recipe.ingredients.map((ingredient) => localizeIngredient(ingredient, language)),
          steps: plan.commonMeal.recipe.steps.map((step) => translateText(step, language) ?? step),
          familyAdjustments: plan.commonMeal.recipe.familyAdjustments.map((step) => translateText(step, language) ?? step),
          alternativeIngredients: plan.commonMeal.recipe.alternativeIngredients.map((step) => translateText(step, language) ?? step),
          videoRecommendation: plan.commonMeal.recipe.videoRecommendation
            ? {
                ...plan.commonMeal.recipe.videoRecommendation,
                label: translateText(plan.commonMeal.recipe.videoRecommendation.label, language) ?? plan.commonMeal.recipe.videoRecommendation.label,
                note: translateText(plan.commonMeal.recipe.videoRecommendation.note, language) ?? plan.commonMeal.recipe.videoRecommendation.note
              }
            : undefined
        }
      },
      memberCustomizations: plan.memberCustomizations.map((customization) => ({
        ...customization,
        modification: translateText(customization.modification, language) ?? customization.modification,
        portionGuidance: translateText(customization.portionGuidance, language) ?? customization.portionGuidance,
        safetyNotes: customization.safetyNotes.map((note) => translateText(note, language) ?? note)
      })),
      fruits: plan.fruits.map((fruit) => ({
        ...fruit,
        fruit: translateText(fruit.fruit, language) ?? fruit.fruit,
        portion: translateText(fruit.portion, language) ?? fruit.portion,
        timing: translateText(fruit.timing, language) ?? fruit.timing,
        alternatives: fruit.alternatives.map((alternative) => translateText(alternative, language) ?? alternative),
        caution: translateText(fruit.caution, language)
      })),
      hydration: plan.hydration.map((item) => ({
        ...item,
        guidance: translateText(item.guidance, language) ?? item.guidance,
        suitableBeverages: item.suitableBeverages.map((beverage) => translateText(beverage, language) ?? beverage),
        caution: translateText(item.caution, language)
      })),
      groceryItems: plan.groceryItems.map((item) => ({
        ...item,
        name: translateIngredientName(item.name, language)
      })),
      mealIngredientRequirements: plan.mealIngredientRequirements.map((item) => ({
        ...item,
        name: translateIngredientName(item.name, language),
        notes: item.notes.map((note) => translateText(note, language) ?? note)
      })),
      dailyGroceryRequirements: plan.dailyGroceryRequirements.map((item) => ({
        ...item,
        name: translateIngredientName(item.name, language),
        notes: item.notes.map((note) => translateText(note, language) ?? note)
      })),
      fastingMealRequirements: plan.fastingMealRequirements.map((item) => ({
        ...item,
        suggestion: translateText(item.suggestion, language) ?? item.suggestion,
        allowedFoodsUsed: item.allowedFoodsUsed.map((food) => translateText(food, language) ?? food),
        avoidedFoods: item.avoidedFoods.map((food) => translateText(food, language) ?? food),
        notes: item.notes.map((note) => translateText(note, language) ?? note)
      })),
      familySatisfactionScore: {
        ...plan.familySatisfactionScore,
        explanation: translateText(plan.familySatisfactionScore.explanation, language) ?? plan.familySatisfactionScore.explanation
      },
      warnings: plan.warnings.map((warning) => translateText(warning, language) ?? warning),
      disclaimer: translateText(plan.disclaimer, language) ?? plan.disclaimer
    };
  }

  generateFamilyMealPlan(input: GeneratePlanInput): FamilyMealPlan {
    const timestamp = nowIso();
    const mealId = createId(input.replacement ? "replacement-meal" : "meal");
    const commonMeal = mealForTime(input, mealId);
    const attendance = mealAttendanceFor(input, commonMeal.mealTime);
    const mealIngredientRequirements = quantityPlanningService.mealRequirements(
      commonMeal.mealTime,
      commonMeal.ingredients,
      attendance,
      input.members
    );
    const fastingMealRequirements = quantityPlanningService.fastingRequirements(commonMeal.mealTime, attendance, input.members);
    const dailyGroceryRequirements = quantityPlanningService.consolidate(mealIngredientRequirements);
    const groceryItems = quantityPlanningService.groceryFromRequirements(dailyGroceryRequirements);
    const totalCost = groceryService.totalCost(groceryItems);
    const estimatedDailyCost = totalCost + (input.highTeaPreference?.enabled ? 220 : 160);

    return {
      mealPlanId: createId("meal-plan"),
      familyId: input.family.familyId,
      planType: input.planType,
      targetDate: input.targetDate,
      expiresAt: detailedMealPlanExpiresAt(timestamp),
      retentionPolicy: retentionPolicy(),
      commonMeal,
      memberCustomizations: input.members.map((member) => this.customizeMember(member, commonMeal, input.replacement)),
      preferenceResolution: preferenceResolutionFor(input.members, commonMeal),
      fruits: input.members.map((member) => this.fruitForMember(member)),
      hydration: input.members.map((member) => this.hydrationForMember(member)),
      estimatedCost: {
        mealCost: money(totalCost),
        dailyCost: money(estimatedDailyCost)
      },
      groceryItems,
      mealAttendance: [attendance],
      mealIngredientRequirements,
      dailyGroceryRequirements,
      fastingMealRequirements,
      familySatisfactionScore: {
        score: input.replacement ? 86 : 89,
        explanation: "Score balances taste familiarity, health fit, affordability, local availability, and cooking effort."
      },
      warnings: [
        "Nutrition values are estimates and should not be treated as medical advice.",
        "Known allergies and doctor restrictions must be reviewed before cooking.",
        budgetWarning(input.family, totalCost, estimatedDailyCost),
        input.userPlanningMode === "returning_user_weekly_editable"
          ? "Returning-user mode should reuse editable weekly planning to control AI cost and avoid unnecessary regeneration."
          : "New-user mode generates a focused next-meal plan for onboarding and demo clarity."
      ],
      disclaimer: mandatoryDisclaimer,
      createdAt: timestamp,
      updatedAt: timestamp
    };
  }

  private customizeMember(member: FamilyMember, commonMeal: CommonMeal, replacement?: boolean) {
    const hasDiabetes = member.healthConditions.some((condition) => condition.toLowerCase().includes("diabetes"));
    const isChild = member.age < 13;
    const isSenior = member.age > 65 || member.specialStatuses.some((status) => status.toLowerCase().includes("senior"));
    const highActivity = member.activityLevel === "heavy" || member.activityLevel === "athlete";
    const hardConflicts = ingredientConflicts(commonMeal, memberHardRestrictions(member));
    const dislikedIngredients = ingredientConflicts(commonMeal, memberSoftDislikes(member));
    const dislikedMeals = mealNameConflicts(commonMeal, memberSoftDislikes(member));
    const safetyNotes = [
      ...hardConflicts.map((conflict) => `Hard restriction: do not serve ${conflict} to ${member.name}. Use the listed alternative.`),
      ...dislikedIngredients.map((conflict) => `Preference adjustment: avoid ${conflict} in ${member.name}'s portion if practical.`),
      ...dislikedMeals.map((conflict) => `Preference adjustment: ${member.name} dislikes ${conflict}; provide the alternative portion.`)
    ];

    if (hardConflicts.length || dislikedIngredients.length || dislikedMeals.length) {
      const conflicts = [...hardConflicts, ...dislikedIngredients, ...dislikedMeals].join(", ");
      const softDislikeGuidance = dislikedMeals.length
        ? `This member does not prefer the common dish (${dislikedMeals.join(", ")}). If the rest of the family keeps this meal, prepare a simple member-only alternative such as dal-roti, dal-rice, vegetable sabzi, curd, paneer, egg, or chicken according to this member's diet pattern.`
        : `Keep the common family meal, but remove or replace ${conflicts} from this member's portion before changing the entire family meal.`;
      return {
        memberId: member.memberId,
        memberName: member.name,
        modification: hardConflicts.length
          ? `Do not serve the conflicting item(s): ${conflicts}. Use a safe dal, roti, vegetable, curd-free, egg-free, or protein alternative based on the specific restriction.`
          : softDislikeGuidance,
        portionGuidance: "Serve a normal age/activity-appropriate portion only after the conflicting item is removed or replaced.",
        safetyNotes
      };
    }

    if (hasDiabetes) {
      return {
        memberId: member.memberId,
        memberName: member.name,
        modification: replacement ? "Use more sambar vegetables, moderate dosa count, and avoid sweet beverages." : "Keep khichdi grain portion controlled and add extra vegetables and curd.",
        portionGuidance: replacement ? "2 medium dosas with 1.5 cups sambar and unsweetened curd." : "1 medium bowl khichdi, 1 cup vegetables, and 0.5 cup curd.",
        safetyNotes: ["Diabetes-aware portion guidance; follow doctor-provided carbohydrate instructions if stricter.", ...safetyNotes]
      };
    }

    if (isSenior) {
      return {
        memberId: member.memberId,
        memberName: member.name,
        modification: replacement ? "Serve dosa softer with extra sambar, less spice, and small pieces." : "Cook khichdi softer with mild spices and extra moisture.",
        portionGuidance: replacement ? "1 soft dosa with 1 cup sambar, served warm and easy to chew." : "1 small soft bowl with curd if tolerated.",
        safetyNotes: ["Watch chewing comfort and digestion.", ...safetyNotes]
      };
    }

    if (highActivity) {
      return {
        memberId: member.memberId,
        memberName: member.name,
        modification: replacement ? "Add paneer side and extra sambar dal for protein support." : "Add paneer or extra dal topping for protein support.",
        portionGuidance: replacement ? "3 dosas, 2 cups sambar, and paneer side." : "2 bowls khichdi with extra dal or paneer side.",
        safetyNotes
      };
    }

    if (isChild) {
      return {
        memberId: member.memberId,
        memberName: member.name,
        modification: replacement ? "Serve smaller dosa pieces with mild sambar and curd." : "Serve mild khichdi with curd and colorful vegetables.",
        portionGuidance: replacement ? "1 small dosa, 0.75 cup sambar, and curd." : "1 child-size bowl with curd.",
        safetyNotes: ["Child nutrition needs are individualized; consult a pediatric professional for specific concerns.", ...safetyNotes]
      };
    }

    return {
      memberId: member.memberId,
      memberName: member.name,
      modification: replacement ? "Regular family serving with balanced sambar and curd." : "Regular balanced portion with vegetables and curd.",
      portionGuidance: replacement ? "2 dosas, 1.5 cups sambar, and 0.5 cup curd." : "1.5 bowls khichdi with 0.5 cup curd.",
      safetyNotes
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
