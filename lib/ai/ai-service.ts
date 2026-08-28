import { createId, nowIso } from "@/lib/repositories/in-memory-store";
import type {
  CommonMeal,
  DayFoodPreference,
  Family,
  FamilyDietPreference,
  FamilyMealPlan,
  FamilyMember,
  HighTeaPreference,
  Ingredient,
  MealAlternativeOption,
  MealAttendanceEntry,
  MealComponent,
  MealSlot,
  MealTime,
  MealTimeContext,
  NutritionEstimate,
  PlanType,
  PreferenceResolution,
  RecipeDetails,
  UserPlanningMode,
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
  replacementReason?: string;
  userPromptOverride?: string;
  excludeDishes?: string[];
  previousMeals?: string[];
  excludedMealNames?: string[];
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
    ...member.doctorRestrictions,
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

// Ingredient Definitions
function khichdiIngredients(): Ingredient[] {
  return [
    { name: "Moong dal", quantity: "1.5 cups", category: "pulses", estimatedCost: money(55) },
    { name: "Rice", quantity: "1.25 cups", category: "grains", estimatedCost: money(45) },
    { name: "Mixed vegetables", quantity: "4 cups", category: "vegetables", estimatedCost: money(110) },
    { name: "Curd", quantity: "750 g", category: "dairy", estimatedCost: money(80) },
    { name: "Cumin and turmeric", quantity: "2 tsp", category: "spices", estimatedCost: money(15) },
  ];
}

function milletDosaIngredients(): Ingredient[] {
  return [
    { name: "Ragi flour", quantity: "2 cups", category: "grains", estimatedCost: money(65) },
    { name: "Urad dal", quantity: "0.75 cup", category: "pulses", estimatedCost: money(45) },
    { name: "Vegetable sambar mix", quantity: "4 cups", category: "vegetables", estimatedCost: money(120) },
    { name: "Paneer", quantity: "250 g", category: "protein", estimatedCost: money(110) },
    { name: "Curd", quantity: "500 g", category: "dairy", estimatedCost: money(60) },
  ];
}

function pohaIngredients(): Ingredient[] {
  return [
    { name: "Poha", quantity: "3 cups", category: "grains", estimatedCost: money(55) },
    { name: "Peanuts", quantity: "0.5 cup", category: "protein", estimatedCost: money(35) },
    { name: "Onion and peas", quantity: "2 cups", category: "vegetables", estimatedCost: money(55) },
    { name: "Curd", quantity: "500 g", category: "dairy", estimatedCost: money(60) },
    { name: "Lemon and coriander", quantity: "1 small bunch", category: "other", estimatedCost: money(20) },
  ];
}

function rotiDalIngredients(): Ingredient[] {
  return [
    { name: "Whole wheat flour", quantity: "3 cups", category: "grains", estimatedCost: money(55) },
    { name: "Masoor dal", quantity: "1.5 cups", category: "pulses", estimatedCost: money(65) },
    { name: "Seasonal vegetable sabzi", quantity: "4 cups", category: "vegetables", estimatedCost: money(120) },
    { name: "Curd", quantity: "750 g", category: "dairy", estimatedCost: money(80) },
    { name: "Basic spices", quantity: "2 tsp", category: "spices", estimatedCost: money(15) },
  ];
}

function vegetablePulaoDalIngredients(): Ingredient[] {
  return [
    { name: "Rice", quantity: "1.5 cups", category: "grains", estimatedCost: money(55) },
    { name: "Masoor dal", quantity: "1.25 cups", category: "pulses", estimatedCost: money(55) },
    { name: "Mixed vegetables", quantity: "4 cups", category: "vegetables", estimatedCost: money(120) },
    { name: "Curd", quantity: "650 g", category: "dairy", estimatedCost: money(70) },
    { name: "Cumin and turmeric", quantity: "2 tsp", category: "spices", estimatedCost: money(15) },
  ];
}

function paneerBhurjiRotiIngredients(): Ingredient[] {
  return [
    { name: "Paneer", quantity: "400 g", category: "protein", estimatedCost: money(180) },
    { name: "Whole wheat flour", quantity: "3 cups", category: "grains", estimatedCost: money(55) },
    { name: "Onion and tomato", quantity: "3 cups", category: "vegetables", estimatedCost: money(60) },
    { name: "Moong dal tadka", quantity: "1 cup", category: "pulses", estimatedCost: money(45) },
    { name: "Curd", quantity: "500 g", category: "dairy", estimatedCost: money(60) },
  ];
}

function besanChillaSoupIngredients(): Ingredient[] {
  return [
    { name: "Besan", quantity: "2 cups", category: "pulses", estimatedCost: money(60) },
    { name: "Mixed grated vegetables", quantity: "3 cups", category: "vegetables", estimatedCost: money(90) },
    { name: "Seasonal vegetable soup mix", quantity: "4 cups", category: "vegetables", estimatedCost: money(110) },
    { name: "Curd", quantity: "500 g", category: "dairy", estimatedCost: money(60) },
    { name: "Basic spices", quantity: "2 tsp", category: "spices", estimatedCost: money(15) },
  ];
}

function highTeaIngredients(): Ingredient[] {
  return [
    { name: "Besan", quantity: "1.5 cups", category: "pulses", estimatedCost: money(45) },
    { name: "Mixed grated vegetables", quantity: "2 cups", category: "vegetables", estimatedCost: money(65) },
    { name: "Curd", quantity: "500 g", category: "dairy", estimatedCost: money(60) },
    { name: "Seasonal fruit", quantity: "5 pieces", category: "fruits", estimatedCost: money(90) },
    { name: "Unsweetened tea or herbal infusion", quantity: "5 cups", category: "other", estimatedCost: money(35) },
  ];
}

function eggCurryIngredients(): Ingredient[] {
  return [
    { name: "Eggs", quantity: "8 pieces", category: "protein", estimatedCost: money(80) },
    { name: "Whole wheat flour", quantity: "3 cups", category: "grains", estimatedCost: money(55) },
    { name: "Seasonal vegetable sabzi", quantity: "4 cups", category: "vegetables", estimatedCost: money(120) },
    { name: "Curd", quantity: "500 g", category: "dairy", estimatedCost: money(60) },
    { name: "Onion tomato masala", quantity: "2 cups", category: "vegetables", estimatedCost: money(60) },
  ];
}

function chickenDalIngredients(): Ingredient[] {
  return [
    { name: "Chicken", quantity: "650 g", category: "protein", estimatedCost: money(210) },
    { name: "Rice", quantity: "1.5 cups", category: "grains", estimatedCost: money(55) },
    { name: "Moong dal", quantity: "1 cup", category: "pulses", estimatedCost: money(40) },
    { name: "Mixed vegetables", quantity: "4 cups", category: "vegetables", estimatedCost: money(110) },
    { name: "Curd", quantity: "500 g", category: "dairy", estimatedCost: money(60) },
  ];
}

function fishRiceIngredients(): Ingredient[] {
  return [
    { name: "Fish", quantity: "650 g", category: "protein", estimatedCost: money(260) },
    { name: "Rice", quantity: "1.5 cups", category: "grains", estimatedCost: money(55) },
    { name: "Moong dal", quantity: "1 cup", category: "pulses", estimatedCost: money(40) },
    { name: "Mixed vegetables", quantity: "4 cups", category: "vegetables", estimatedCost: money(110) },
    { name: "Curd", quantity: "500 g", category: "dairy", estimatedCost: money(60) },
  ];
}

function mixedFamilyIngredients(): Ingredient[] {
  return [
    { name: "Masoor dal", quantity: "1.5 cups", category: "pulses", estimatedCost: money(65) },
    { name: "Whole wheat flour", quantity: "3 cups", category: "grains", estimatedCost: money(55) },
    { name: "Seasonal vegetable sabzi", quantity: "4 cups", category: "vegetables", estimatedCost: money(120) },
    { name: "Eggs or chicken add-on", quantity: "4 eggs or 350 g chicken", category: "protein", estimatedCost: money(130) },
    { name: "Curd", quantity: "750 g", category: "dairy", estimatedCost: money(80) },
  ];
}

function veganDalIngredients(): Ingredient[] {
  return [
    { name: "Masoor dal", quantity: "1.5 cups", category: "pulses", estimatedCost: money(65) },
    { name: "Brown rice or millet", quantity: "1.5 cups", category: "grains", estimatedCost: money(75) },
    { name: "Seasonal vegetable sabzi", quantity: "5 cups", category: "vegetables", estimatedCost: money(140) },
    { name: "Roasted peanuts or sesame chutney", quantity: "0.5 cup", category: "protein", estimatedCost: money(45) },
    { name: "Basic spices and lemon", quantity: "2 tsp spices + 2 lemons", category: "spices", estimatedCost: money(25) },
  ];
}

function veganHighTeaIngredients(): Ingredient[] {
  return [
    { name: "Besan", quantity: "1.5 cups", category: "pulses", estimatedCost: money(45) },
    { name: "Mixed grated vegetables", quantity: "2 cups", category: "vegetables", estimatedCost: money(65) },
    { name: "Peanut or coconut chutney", quantity: "1 cup", category: "protein", estimatedCost: money(55) },
    { name: "Seasonal fruit", quantity: "5 pieces", category: "fruits", estimatedCost: money(90) },
    { name: "Herbal infusion or lemon water", quantity: "5 cups", category: "other", estimatedCost: money(30) },
  ];
}

function component(
  componentId: string,
  label: string,
  role: MealComponent["role"],
  memberIds: string[],
  ingredients: Ingredient[],
  notes: string[]
): MealComponent {
  return { componentId, label, role, memberIds, ingredients, notes };
}

function isNonVegDiet(member: FamilyMember) {
  return member.dietType === "non_vegetarian";
}

function isEggDiet(member: FamilyMember) {
  return member.dietType === "eggitarian" || member.dietType === "non_vegetarian";
}

function isVegetarianCompatibleDiet(member: FamilyMember) {
  return (
    member.dietType === "vegetarian" ||
    member.dietType === "jain" ||
    member.dietType === "satvik" ||
    member.dietType === "eggitarian" ||
    member.dietType === "other"
  );
}

function localWeekday(targetDate: string) {
  const date = new Date(`${targetDate}T12:00:00`);
  return ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"][date.getDay()];
}

function memberAvoidsNonVegOn(member: FamilyMember, targetDate: string) {
  const weekday = localWeekday(targetDate);
  return member.nonVegAvoidDays?.map((day) => day.toLowerCase()).includes(weekday) ?? false;
}

function nonVegFrequencyAllowsToday(member: FamilyMember) {
  return member.nonVegFrequency !== "occasionally";
}

function eligibleNonVegMembers(input: GeneratePlanInput) {
  if (avoidsNonVegToday(input)) return [];
  return input.members.filter(
    (member) => isNonVegDiet(member) && !memberAvoidsNonVegOn(member, input.targetDate) && nonVegFrequencyAllowsToday(member)
  );
}

function eligibleEggMembers(input: GeneratePlanInput) {
  if (avoidsNonVegToday(input)) return [];
  return input.members.filter((member) => isEggDiet(member) && !memberAvoidsNonVegOn(member, input.targetDate));
}

function vegetarianOptionMembers(input: GeneratePlanInput, nonVegMemberIds: Set<string>) {
  return input.members.filter((member) => !nonVegMemberIds.has(member.memberId) && member.dietType !== "vegan");
}

function dietDistributionText(input: GeneratePlanInput) {
  const counts = input.members.reduce<Record<string, number>>((acc, member) => {
    const key = member.dietType === "eggitarian" ? "eggetarian" : member.dietType;
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});
  return Object.entries(counts)
    .map(([key, count]) => `${key}: ${count}`)
    .join(", ");
}

function budgetPrefersEconomical(input: GeneratePlanInput) {
  return (
    input.family.budget.preferLowCostMeals ||
    (input.family.budget.type !== "none" && input.family.budget.priority === "strict")
  );
}

function preferredNonVegText(input: GeneratePlanInput) {
  return (input.family.nonVegPreferredFoods ?? []).join(" ").toLowerCase();
}

function preferredNonVegIncludes(input: GeneratePlanInput, values: string[]) {
  const text = preferredNonVegText(input);
  return values.some((value) => text.includes(value));
}

function preferredNonVegIngredient(input: GeneratePlanInput, mealTime: MealTime): Ingredient {
  if (mealTime === "breakfast" || budgetPrefersEconomical(input) || preferredNonVegIncludes(input, ["egg"])) {
    return { name: "Eggs", quantity: "10 pieces", category: "protein", estimatedCost: money(100) };
  }
  if (!budgetPrefersEconomical(input) && preferredNonVegIncludes(input, ["fish", "seafood"])) {
    return { name: "Fish", quantity: "650 g", category: "protein", estimatedCost: money(260) };
  }
  if (!budgetPrefersEconomical(input) && preferredNonVegIncludes(input, ["mutton", "goat"])) {
    return { name: "Mutton or goat", quantity: "650 g", category: "protein", estimatedCost: money(420) };
  }
  return { name: "Chicken", quantity: "650 g", category: "protein", estimatedCost: money(210) };
}

function mixedDietComponents(input: GeneratePlanInput, mealTime: MealTime): MealComponent[] {
  const allMemberIds = input.members.map((member) => member.memberId);
  const eggMembers = eligibleEggMembers(input);
  const nonVegMembers = eligibleNonVegMembers(input);
  const useEggOnly =
    mealTime === "breakfast" || (eggMembers.length > nonVegMembers.length && preferredNonVegIncludes(input, ["egg"]));
  const proteinMembers = useEggOnly ? eggMembers : nonVegMembers;
  const proteinMemberIds = new Set(proteinMembers.map((member) => member.memberId));
  const vegMembers = vegetarianOptionMembers(input, proteinMemberIds);

  const commonBase =
    mealTime === "breakfast"
      ? [
        { name: "Poha", quantity: "3 cups", category: "grains" as const, estimatedCost: money(55) },
        { name: "Onion and peas", quantity: "2 cups", category: "vegetables" as const, estimatedCost: money(55) },
        {
          name: "Lemon and coriander",
          quantity: "1 small bunch",
          category: "other" as const,
          estimatedCost: money(20),
        },
      ]
      : [
        {
          name: "Whole wheat flour",
          quantity: "3 cups",
          category: "grains" as const,
          estimatedCost: money(55),
        },
        { name: "Masoor dal", quantity: "1.5 cups", category: "pulses" as const, estimatedCost: money(65) },
        {
          name: "Seasonal vegetable sabzi",
          quantity: "4 cups",
          category: "vegetables" as const,
          estimatedCost: money(120),
        },
        { name: "Basic spices", quantity: "2 tsp", category: "spices" as const, estimatedCost: money(15) },
      ];

  const components = [
    component(
      "common-base",
      mealTime === "breakfast" ? "Common breakfast base for everyone" : "Common family base for everyone",
      "common_base",
      allMemberIds,
      commonBase,
      ["Prepare once for the full household; keep optional proteins separate."]
    ),
  ];

  if (vegMembers.length) {
    components.push(
      component(
        "veg-option",
        mealTime === "breakfast" ? "Vegetarian protein/side option" : "Vegetarian or semi-vegetarian option",
        "vegetarian_option",
        vegMembers.map((member) => member.memberId),
        mealTime === "breakfast"
          ? [
            { name: "Peanuts", quantity: "0.75 cup", category: "protein" as const, estimatedCost: money(50) },
            { name: "Curd", quantity: "500 g", category: "dairy" as const, estimatedCost: money(60) },
          ]
          : [
            { name: "Paneer", quantity: "350 g", category: "protein" as const, estimatedCost: money(155) },
            { name: "Curd", quantity: "750 g", category: "dairy" as const, estimatedCost: money(80) },
          ],
        ["Serve only to members who eat and tolerate dairy/vegetarian protein; skip dairy for vegan members."]
      )
    );
  }

  if (proteinMembers.length) {
    const protein = preferredNonVegIngredient(input, mealTime);
    components.push(
      component(
        useEggOnly ? "egg-option" : "non-veg-option",
        useEggOnly ? "Egg option for eligible members" : `${protein.name} option for non-vegetarian members`,
        useEggOnly ? "eggetarian_option" : "non_vegetarian_option",
        proteinMembers.map((member) => member.memberId),
        [
          protein,
          {
            name: "Onion tomato masala",
            quantity: "2 cups",
            category: "vegetables" as const,
            estimatedCost: money(60),
          },
        ],
        [
          "Calculate this protein only for assigned members, not for the whole family.",
          "Do not serve to vegetarian or vegan members.",
        ]
      )
    );
  }

  return components;
}

function mixedFamilyIngredientsFromComponents(components: MealComponent[]) {
  return components.flatMap((item) => item.ingredients);
}

function componentGuidanceForMember(commonMeal: CommonMeal, member: FamilyMember) {
  const assigned = commonMeal.components?.filter((item) => item.memberIds.includes(member.memberId)) ?? [];
  if (!assigned.length) return "";
  const labels = assigned.map((item) => item.label).join(" + ");
  return ` Meal structure for this member: ${labels}.`;
}

function shouldUseMixedComponentStrategy(input: GeneratePlanInput, mealTime: MealTime) {
  const hasVegetarianSide = input.members.some(
    (member) => isVegetarianCompatibleDiet(member) || member.dietType === "vegan"
  );
  const hasNonVegOrEggSide = input.members.some((member) => isEggDiet(member) || isNonVegDiet(member));
  return (
    hasVegetarianSide &&
    hasNonVegOrEggSide &&
    !weeklyRoutinePrefersVegetarianBase(input) &&
    (mealTime !== "breakfast" || eligibleEggMembers(input).length > 0)
  );
}

function nutritionEstimate(
  values: Omit<NutritionEstimate, "basis" | "dataSource" | "confidence">,
  basis: string
): NutritionEstimate {
  return {
    ...values,
    basis,
    dataSource:
      "MVP estimate using USDA FoodData Central-style nutrient fields and ICMR/NIN food-group guidance; production uses verified ingredient-weight lookup.",
    confidence: "medium",
  };
}

function totalIngredientCost(ingredients: Ingredient[]) {
  return ingredients.reduce((total, ingredient) => total + ingredient.estimatedCost.amount, 0);
}

function memberPortionLabel(member: FamilyMember) {
  if (member.age < 6) return "small preschool-child portion, about one-third of a standard adult serving";
  if (member.age < 13) return "child portion, about half of a standard adult serving";
  if (member.activityLevel === "heavy" || member.activityLevel === "athlete")
    return "higher-activity adult portion, about one-quarter more than a standard adult serving";
  if (member.activityLevel === "sedentary") return "lighter adult portion, adjusted for lower activity";
  if (member.age > 65)
    return "senior-friendly portion, adjusted for appetite, chewing comfort and digestion rather than age alone";
  return "standard adult portion";
}

function mealSlotForMealTime(mealTime?: MealTime): MealSlot {
  if (mealTime === "breakfast" || mealTime === "lunch" || mealTime === "dinner") return mealTime;
  return "snacks";
}

function weeklyRoutinePreferenceFor(input: GeneratePlanInput): DayFoodPreference | undefined {
  if (input.family.weeklyFoodRoutineStatus !== "add" || !input.family.weeklyFoodRoutine?.length) return undefined;
  const weekday = localWeekday(input.targetDate);
  const entry = input.family.weeklyFoodRoutine.find((item) => item.day.toLowerCase() === weekday);
  if (!entry) return undefined;
  const mealPreference = entry.meals?.[mealSlotForMealTime(input.mealTime)];
  return mealPreference && mealPreference !== "no_preference" ? mealPreference : entry.preference;
}

function statedMealPreferencesFor(input: GeneratePlanInput, mealTime: MealTime) {
  const slot = mealSlotForMealTime(mealTime);
  return input.family.mealTypePreferences?.[slot]?.map((item) => item.toLowerCase()) ?? [];
}

function preferenceIncludes(input: GeneratePlanInput, mealTime: MealTime, patterns: string[]) {
  const text = statedMealPreferencesFor(input, mealTime).join(" ");
  return patterns.some((pattern) => text.includes(pattern));
}

function familyNotesText(input: GeneratePlanInput) {
  return input.family.localIngredientAvailabilityNotes?.join(" ").toLowerCase() ?? "";
}

function cookingHabitFor(input: GeneratePlanInput) {
  const text = familyNotesText(input);
  if (text.includes("ready-made") || text.includes("frozen")) return "ready_frozen";
  if (text.includes("takeaway") || text.includes("prepared meals")) return "takeaway_prepared";
  if (text.includes("mix of fresh cooking")) return "fresh_ready_mix";
  return "fresh_home_cooked";
}

function recentMealsFor(input: GeneratePlanInput, mealTime: MealTime) {
  const slot = mealSlotForMealTime(mealTime);
  const savedHistory =
    input.family.recentMealHistory?.map((entry) => entry[slot]?.toLowerCase().trim()).filter(Boolean) ?? [];
  const previousMeals = input.previousMeals?.map((meal) => meal.toLowerCase().trim()).filter(Boolean) ?? [];
  const excludedMeals = [
    ...(input.excludedMealNames ?? []),
    ...(input.excludeDishes ?? []),
  ].map((meal) => meal.toLowerCase().trim()).filter(Boolean);

  return [...new Set([...savedHistory, ...previousMeals, ...excludedMeals])];
}

function recentHistoryIncludes(input: GeneratePlanInput, mealTime: MealTime, patterns: string[]) {
  const text = recentMealsFor(input, mealTime).join(" ");
  return patterns.some((pattern) => text.includes(pattern));
}

function mealNameHasAny(name: string, patterns: string[]) {
  const normalized = normalize(name);
  return patterns.some((pattern) => normalized.includes(normalize(pattern)));
}

function isMealRecentlyUsed(input: GeneratePlanInput, mealTime: MealTime, mealName: string) {
  const normalized = normalize(mealName);
  return recentMealsFor(input, mealTime).some((recent) => normalized.includes(recent) || recent.includes(normalized));
}

function dinnerRotationIndex(input: GeneratePlanInput) {
  const date = new Date(`${input.targetDate}T12:00:00`);
  const seed = Number.isNaN(date.getTime()) ? 0 : date.getDate();
  return seed % 4;
}

function weeklyRoutinePrefersVegetarianBase(input: GeneratePlanInput) {
  const preference = weeklyRoutinePreferenceFor(input);
  return (
    preference === "vegetarian" ||
    preference === "vegan" ||
    preference === "light_meal" ||
    preference === "fasting_vrat"
  );
}

function avoidsNonVegToday(input: GeneratePlanInput) {
  const preference = weeklyRoutinePreferenceFor(input);
  const weekday = localWeekday(input.targetDate);
  return (
    preference === "vegetarian" ||
    preference === "vegan" ||
    preference === "light_meal" ||
    preference === "fasting_vrat" ||
    input.members.some((member) => {
      if (member.dietType !== "non_vegetarian" && member.dietType !== "eggitarian") return false;
      return member.nonVegAvoidDays?.map((day) => day.toLowerCase()).includes(weekday) ?? false;
    })
  );
}

function prefersVegetarianBaseToday(input: GeneratePlanInput) {
  const weekday = localWeekday(input.targetDate);
  return (
    weeklyRoutinePrefersVegetarianBase(input) ||
    input.members.some((member) => {
      if (member.dietType !== "non_vegetarian" && member.dietType !== "eggitarian") return false;
      if (member.nonVegAvoidDays?.map((day) => day.toLowerCase()).includes(weekday)) return true;
      return member.nonVegFrequency === "occasionally" || member.nonVegFrequency === "1_2_days_per_week";
    })
  );
}

function recipeSteps(mealName: string) {
  const name = normalize(mealName);
  if (name.includes("khichdi")) {
    return [
      "Wash rice and moong dal until the water runs mostly clear.",
      "Add rice, dal, chopped vegetables, cumin, turmeric, and water to a pressure cooker.",
      "Cook until soft; use extra water for elderly members who need a softer texture.",
      "Whisk curd separately and serve on the side so members with restrictions can skip it.",
      "Finish individual bowls with portion changes listed in the MAMA Family Table.",
    ];
  }
  if (name.includes("paneer bhurji") || name.includes("paneer")) {
    return [
      "Crumble fresh paneer and finely chop onions, tomatoes, and capsicum.",
      "Sauté cumin, ginger, onions, and tomatoes in a pan with mild spices.",
      "Add crumbled paneer and toss gently on medium heat for 3-4 minutes.",
      "Prepare fresh whole wheat rotis alongside.",
      "Serve hot with cucumber salad, dal tadka, and portioned sides.",
    ];
  }
  if (name.includes("dosa")) {
    return [
      "Prepare or use ready ragi dosa batter and keep vegetable sambar warm.",
      "Cook thin dosas on a lightly greased tawa.",
      "Serve sambar and curd on the side so member-specific portions can be controlled.",
      "For softer needs, soak dosa pieces briefly in warm sambar.",
      "Add paneer only for members who need and tolerate extra protein.",
    ];
  }
  if (name.includes("poha")) {
    return [
      "Rinse poha briefly and rest until soft, not mushy.",
      "Cook onion, peas, and mild spices in a pan.",
      "Fold in poha and cook on low heat until warm and fluffy.",
      "Serve curd and fruit on the side for member-specific portions.",
      "Avoid any disliked or allergy-triggering toppings for affected members.",
    ];
  }
  if (name.includes("pulao")) {
    return [
      "Wash rice and chop vegetables into small even pieces.",
      "Cook dal separately with mild spices so portions can be adjusted.",
      "Prepare vegetable pulao with measured oil, cumin, vegetables, rice, and water.",
      "Keep cucumber raita on the side so dairy-restricted members can skip it.",
      "Serve member-specific portions using the MAMA Family Table.",
    ];
  }
  if (name.includes("high tea") || name.includes("chilla")) {
    return [
      "Mix besan with water, mild spices, and grated vegetables to make a pourable batter.",
      "Cook small chillas on a lightly oiled tawa until both sides are firm and golden.",
      "Keep curd, fruit, and tea separate so portions can be adjusted for each member.",
      "Serve unsweetened tea or herbal infusion, especially for members avoiding sugar.",
      "For fasting members, skip regular chilla and use the fasting alternative shown by MAMA.",
    ];
  }
  if (name.includes("egg")) {
    return [
      "Boil eggs, peel them, and prepare onion tomato masala with mild spices.",
      "Simmer the eggs in the masala and keep the gravy medium-thick.",
      "Prepare roti and seasonal sabzi alongside the curry.",
      "Serve egg only to members who eat and tolerate egg.",
      "Use dal or paneer as the vegetarian protein alternative when needed.",
    ];
  }
  if (name.includes("chicken")) {
    return [
      "Cook chicken with onion tomato masala until fully done.",
      "Prepare dal, rice, and vegetables separately so portions can be adjusted.",
      "Keep curd on the side for members who tolerate dairy.",
      "Serve chicken only to members who eat non-vegetarian food.",
      "Use dal, curd, paneer, or soy as an alternative protein for other members.",
    ];
  }
  return [
    "Prepare dal with mild spices and enough water for the family texture preference.",
    "Cook roti and seasonal vegetable sabzi separately.",
    "Keep curd and optional protein add-ons on the side.",
    "Remove or replace any ingredient flagged in a member adjustment.",
    "Serve member-specific portions using the MAMA Family Table.",
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
      "Do not serve any listed allergy or never-include ingredient to the affected member.",
    ],
    alternativeIngredients: [
      "Rice can be replaced with millet, roti, or extra vegetables depending on the meal.",
      "Paneer can be replaced with dal, soy, curd, egg, or chicken based on the family food pattern.",
      "Curd can be skipped or replaced with a tolerated side when dairy is unsuitable.",
    ],
    videoRecommendation: {
      label: `Search YouTube for ${meal.name}`,
      note: "YouTube integration is planned; verify ingredients against family restrictions.",
    },
  };
}

function buildAlternatives(
  selectedMeal: CommonMealDraft,
  candidates: CommonMealDraft[]
): MealAlternativeOption[] {
  return candidates
    .filter((c) => c.name !== selectedMeal.name)
    .slice(0, 2)
    .map((c) => ({
      title: c.name,
      description: c.description,
      prepTimeMinutes: c.prepTimeMinutes,
      difficulty: c.difficulty,
      ingredientsSummary: c.ingredients.map((i) => i.name).slice(0, 3),
      reasoning: "Alternative dinner option matching family dietary and speed requirements.",
    }));
}

function completeMeal(meal: CommonMealDraft, alternatives: MealAlternativeOption[] = []): CommonMeal {
  return {
    ...meal,
    alternativeOptions: alternatives,
    recipe: recipeForMeal(meal),
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
      const conflicts = [
        ...ingredientConflicts(commonMeal, memberSoftDislikes(member)),
        ...mealNameConflicts(commonMeal, memberSoftDislikes(member)),
      ];
      return {
        memberId: member.memberId,
        memberName: member.name,
        conflicts: [...new Set(conflicts)],
        suggestedAlternative: simpleAlternativeFor(member, commonMeal, conflicts),
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
        description:
          "Keep the preferred common meal for the rest of the family and serve a nutritionally appropriate simple alternative to the affected member.",
        cookingImpact: "Highest family satisfaction, with one small extra preparation.",
      },
      {
        optionId: "one_common_meal",
        label: "No, keep only one common family meal",
        description:
          "Find another common meal that is reasonably suitable and acceptable to all family members.",
        cookingImpact: "Lowest cooking effort, but may reduce satisfaction for members who preferred the original meal.",
      },
      {
        optionId: "two_compatible_options",
        label: "Suggest two compatible options",
        description:
          "Keep the main family meal and add a simple second dish or alternative component for the affected member.",
        cookingImpact: "Balanced option: minimal extra cooking while protecting the main family meal.",
      },
    ],
    minimumCookingStrategy:
      "Do not remove a popular common meal only because one member dislikes one ingredient. First try a portion-level swap, side dish, or simple second component.",
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
      { caloriesKcal: 1480, proteinGrams: 62, carbsGrams: 215, fatGrams: 42, fiberGrams: 32 },
      "Estimated family total for balanced dinner plate with grains, dal/protein, vegetables, and curd."
    );
  }

  return nutritionEstimate(
    { caloriesKcal: 1540, proteinGrams: 64, carbsGrams: 230, fatGrams: 36, fiberGrams: 36 },
    "Estimated family total for roti, masoor dal, seasonal sabzi, and curd."
  );
}

function vegetarianDinnerCandidates(
  input: GeneratePlanInput,
  mealId: string,
  mealTime: MealTime,
  regionFit: string
): CommonMealDraft[] {
  return [
    {
      mealId: `${mealId}-paneer-roti`,
      name: "Paneer Bhurji with Whole Wheat Roti, Dal Tadka and Salad",
      mealTime,
      description: "A rich, satisfying vegetarian dinner with paneer protein, fresh rotis, light dal tadka, and cooling salad.",
      ingredients: paneerBhurjiRotiIngredients(),
      prepTimeMinutes: 30,
      difficulty: "easy",
      regionFit,
      nutritionIntent: "Protein-rich family dinner offering a hearty change from pulse-only dinners.",
      nutritionEstimate: estimateForDiet(input.family.dietPreference, mealTime),
    },
    {
      mealId: `${mealId}-roti-dal`,
      name: "Roti, Masoor Dal, Seasonal Sabzi and Curd",
      mealTime,
      description: "A practical dinner plate that avoids repeating khichdi while keeping one adaptable family table.",
      ingredients: rotiDalIngredients(),
      prepTimeMinutes: 35,
      difficulty: "easy",
      regionFit,
      nutritionIntent: "Selected to add everyday dinner variety while preserving a simple common family meal.",
      nutritionEstimate: estimateForDiet(input.family.dietPreference, mealTime),
    },
    {
      mealId: `${mealId}-pulao-dal`,
      name: "Vegetable Pulao with Dal and Cucumber Raita",
      mealTime,
      description: "A balanced family dinner with vegetable pulao, dal protein and cooling raita, planned as a practical alternative to khichdi.",
      ingredients: vegetablePulaoDalIngredients(),
      prepTimeMinutes: 35,
      difficulty: "easy",
      regionFit,
      nutritionIntent: "Rotate a familiar rice-based dinner without repeating khichdi texture, while keeping cooking effort moderate.",
      nutritionEstimate: estimateForDiet(input.family.dietPreference, mealTime),
    },
    {
      mealId: `${mealId}-chilla-soup`,
      name: "Besan Chilla with Vegetable Soup and Curd",
      mealTime,
      description: "A light but distinct dinner option using besan chilla, vegetable soup and curd for families wanting a quick change.",
      ingredients: besanChillaSoupIngredients(),
      prepTimeMinutes: 30,
      difficulty: "easy",
      regionFit,
      nutritionIntent: "Offer a quick pulse-based dinner alternative with vegetables and controlled portions.",
      nutritionEstimate: estimateForDiet(input.family.dietPreference, mealTime),
    },
    {
      mealId: `${mealId}-khichdi`,
      name: "Vegetable Moong Dal Khichdi with Curd",
      mealTime,
      description: "A soft, comforting Indian dinner that can be adjusted for age, activity, and diabetes-aware portions.",
      ingredients: khichdiIngredients(),
      prepTimeMinutes: 30,
      difficulty: "easy",
      regionFit,
      nutritionIntent: "One common dinner with digestibility, pulse protein, vegetables, and controlled grain portions.",
      nutritionEstimate: estimateForDiet(input.family.dietPreference, mealTime),
    },
  ];
}

function firstFreshMeal(candidates: CommonMealDraft[], input: GeneratePlanInput, mealTime: MealTime) {
  return candidates.find((meal) => !isMealRecentlyUsed(input, mealTime, meal.name)) ?? candidates[0];
}

function mealAttendanceFor(input: GeneratePlanInput, mealTime: MealTime) {
  return (
    input.mealAttendance?.find((entry) => entry.enabled && entry.mealTime === mealTime) ??
    quantityPlanningService.defaultAttendance(mealTime, input.members)
  );
}

function mealForDiet(
  input: GeneratePlanInput,
  mealId: string,
  mealTime: MealTime,
  regionFit: string
): CommonMealDraft | null {
  const dietPreference = input.family.dietPreference ?? "vegetarian";
  const routinePreference = weeklyRoutinePreferenceFor(input);

  if (routinePreference === "vegan") {
    return {
      mealId,
      name: "Vegan Dal, Millet-Rice and Seasonal Sabzi Plate",
      mealTime,
      description:
        "A fully plant-based family meal with dal, vegetables, millet or rice, and nut/seed chutney. It avoids animal-derived ingredients.",
      ingredients: veganDalIngredients(),
      prepTimeMinutes: 35,
      difficulty: "easy",
      regionFit,
      nutritionIntent:
        "Saved weekly routine prefers vegan food today, so animal-derived ingredients are avoided unless overridden.",
      nutritionEstimate: estimateForDiet("vegan", mealTime),
    };
  }

  if (shouldUseMixedComponentStrategy(input, mealTime)) {
    const components = mixedDietComponents(input, mealTime);
    const nonCommonLabels = components.filter((item) => item.role !== "common_base").map((item) => item.label);
    return {
      mealId,
      name:
        mealTime === "breakfast"
          ? "Common Breakfast Base with Optional Egg or Vegetarian Protein"
          : "Common Family Base with Vegetarian and Non-Vegetarian Options",
      mealTime,
      description:
        mealTime === "breakfast"
          ? "A practical mixed-diet breakfast: one common base for everyone, with egg for eligible members and vegetarian protein for others."
          : "A joint-family meal that keeps roti/rice, dal, and vegetables common while adding only required protein options.",
      ingredients: mixedFamilyIngredientsFromComponents(components),
      components,
      prepTimeMinutes: mealTime === "breakfast" ? 30 : 45,
      difficulty: nonCommonLabels.length > 1 ? "medium" : "easy",
      regionFit: `${regionFit}. Diet distribution: ${dietDistributionText(input)}. Preferred structure: common base plus small dietary variations.`,
      nutritionIntent: "Maximize the common family meal, respect individual diet choices, and calculate optional proteins only for members who eat them.",
      nutritionEstimate: estimateForDiet("mixed", mealTime),
    };
  }

  if ((dietPreference === "non_vegetarian" || dietPreference === "eggetarian") && avoidsNonVegToday(input)) {
    return {
      mealId,
      name: "Family Dal-Roti-Sabzi with Curd",
      mealTime,
      description: "A vegetarian common family meal for a saved no-non-veg day, with portions adjusted for each member.",
      ingredients: rotiDalIngredients(),
      prepTimeMinutes: 35,
      difficulty: "easy",
      regionFit,
      nutritionIntent:
        "Saved weekly routine or member avoid-day says no non-vegetarian food today, so the common base avoids meat, fish and eggs.",
      nutritionEstimate: estimateForDiet("vegetarian", mealTime),
    };
  }

  if (dietPreference === "non_vegetarian") {
    if (!budgetPrefersEconomical(input) && preferredNonVegIncludes(input, ["fish", "seafood"])) {
      return {
        mealId,
        name: "Fish Dal Rice Plate with Vegetables and Curd",
        mealTime,
        description: "A non-vegetarian family meal using the family's saved fish/seafood preference with dal, vegetables, and curd.",
        ingredients: fishRiceIngredients(),
        prepTimeMinutes: 40,
        difficulty: "medium",
        regionFit,
        nutritionIntent: "Non-vegetarian choice follows the family's explicit saved fish/seafood preference.",
        nutritionEstimate: estimateForDiet(dietPreference, mealTime),
      };
    }
    if (preferredNonVegIncludes(input, ["egg"]) && !preferredNonVegIncludes(input, ["chicken", "mutton", "goat"])) {
      return {
        mealId,
        name: "Egg Curry with Roti, Seasonal Sabzi and Curd",
        mealTime,
        description: "An egg-based family meal chosen because eggs are the family's saved non-vegetarian preference.",
        ingredients: eggCurryIngredients(),
        prepTimeMinutes: 35,
        difficulty: "easy",
        regionFit,
        nutritionIntent: "Respect detailed non-vegetarian choices by using eggs and omitting other meats.",
        nutritionEstimate: estimateForDiet("eggetarian", mealTime),
      };
    }
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
      nutritionEstimate: estimateForDiet(dietPreference, mealTime),
    };
  }

  if (dietPreference === "eggetarian") {
    return {
      mealId,
      name: "Egg Curry with Roti, Seasonal Sabzi and Curd",
      mealTime,
      description: "An eggetarian family meal with egg protein, roti, vegetables, and curd.",
      ingredients: eggCurryIngredients(),
      prepTimeMinutes: 35,
      difficulty: "easy",
      regionFit,
      nutritionIntent: "Protein-forward eggetarian meal with vegetables, curd, and adaptable portions.",
      nutritionEstimate: estimateForDiet(dietPreference, mealTime),
    };
  }

  return null;
}

function mealForTime(input: GeneratePlanInput, mealId: string): CommonMeal {
  const mealTime = input.mealTime ?? "lunch";
  const localContext = input.mealTimeContext?.timeZone ? `, timed for ${input.mealTimeContext.timeZone}` : "";
  const cuisineFit = input.family.cuisinePreferences.length ? ` with ${input.family.cuisinePreferences.join(", ")} food-culture fit` : "";
  const cookingHabit = cookingHabitFor(input);
  const cookingFit =
    cookingHabit === "ready_frozen"
      ? ". Cooking habit: prefer ready-made/frozen bases with fresh safe sides"
      : cookingHabit === "fresh_ready_mix"
        ? ". Cooking habit: combine fresh cooking with suitable ready/frozen bases"
        : cookingHabit === "takeaway_prepared"
          ? ". Cooking habit: keep effort low and suggest practical prepared-meal balancing"
          : ". Cooking habit: fresh home cooking preferred";
  const statedPreferences = statedMealPreferencesFor(input, mealTime);
  const hasExplicitMealPreference = statedPreferences.length > 0;
  const recentFit = recentMealsFor(input, mealTime).length
    ? `. Recent ${mealSlotForMealTime(mealTime)} history was checked deterministically to avoid unnecessary repetition`
    : "";
  const preferenceFit = statedPreferences.length
    ? `. Explicit family ${mealSlotForMealTime(mealTime)} preferences: ${statedPreferences.join(", ")}`
    : "";
  const regionFit = `${input.family.city}, ${input.family.state}, ${input.family.country} friendly${cuisineFit}${localContext}${preferenceFit}${recentFit}${cookingFit}`;

  // 1. High Tea / Snacks
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
        nutritionEstimate: estimateForDiet(input.family.dietPreference, mealTime),
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
      nutritionEstimate: estimateForDiet(input.family.dietPreference, mealTime),
    });
  }

  // 2. Specialized Diet Checks
  const dietMeal = mealForDiet(input, mealId, mealTime, regionFit);
  if (dietMeal) return completeMeal(dietMeal);

  // 3. Breakfast Selection
  if (mealTime === "breakfast") {
    if (
      preferenceIncludes(input, mealTime, ["dosa", "idli", "sambar", "south indian"]) ||
      recentHistoryIncludes(input, mealTime, ["poha"])
    ) {
      return completeMeal({
        mealId,
        name: "Ragi Dosa with Vegetable Sambar and Curd",
        mealTime,
        description: "A familiar South Indian family meal with millet base, vegetable sambar, curd, and optional paneer support.",
        ingredients: milletDosaIngredients(),
        prepTimeMinutes: 35,
        difficulty: "medium",
        regionFit,
        nutritionIntent: "Selected to add variety from poha while keeping home-style cooking practical.",
        nutritionEstimate: estimateForDiet(input.family.dietPreference, mealTime),
      });
    }
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
      nutritionEstimate: estimateForDiet(input.family.dietPreference, mealTime),
    });
  }

  // 4. Dinner Selection & Variety Rotation
  if (mealTime === "dinner") {
    const allCandidates = vegetarianDinnerCandidates(input, mealId, mealTime, regionFit);

    // User prompt overrides (e.g. "आज पनीर बनाना है")
    if (input.userPromptOverride) {
      const promptLower = input.userPromptOverride.toLowerCase();
      if (promptLower.includes("paneer") || promptLower.includes("पनीर")) {
        const paneerOption = allCandidates.find((c) => c.name.toLowerCase().includes("paneer")) || allCandidates[0];
        const alts = buildAlternatives(paneerOption, allCandidates);
        return completeMeal(paneerOption, alts);
      }
      if (promptLower.includes("pulao") || promptLower.includes("पुलाव")) {
        const pulaoOption = allCandidates.find((c) => c.name.toLowerCase().includes("pulao")) || allCandidates[0];
        const alts = buildAlternatives(pulaoOption, allCandidates);
        return completeMeal(pulaoOption, alts);
      }
    }

    // Exclude recently used or rejected dinners
    let validCandidates = allCandidates.filter((c) => !isMealRecentlyUsed(input, mealTime, c.name));
    if (!validCandidates.length) {
      validCandidates = allCandidates;
    }

    // Rotate across remaining candidates
    const rotated = [
      ...validCandidates.slice(dinnerRotationIndex(input)),
      ...validCandidates.slice(0, dinnerRotationIndex(input)),
    ];
    const selected = rotated[0];
    const alternatives = buildAlternatives(selected, allCandidates);

    return completeMeal(selected, alternatives);
  }

  // 5. Default Lunch Selection
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
    nutritionEstimate: estimateForDiet(input.family.dietPreference, "lunch"),
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
    "Paneer Bhurji with Whole Wheat Roti, Dal Tadka and Salad": "गेहूं की रोटी, दाल तड़का और सलाद के साथ पनीर भुर्जी",
    "Chicken Dal Rice Plate with Vegetables and Curd": "सब्जियों और दही के साथ चिकन-दाल-चावल प्लेट",
    "Family Dal-Roti-Sabzi with Curd": "दही के साथ पारिवारिक दाल-रोटी-सब्जी",
    "Fish Dal Rice Plate with Vegetables and Curd": "सब्जियों और दही के साथ मछली-दाल-चावल प्लेट",
    "Egg Curry with Roti, Seasonal Sabzi and Curd": "रोटी, मौसमी सब्जी और दही के साथ अंडा करी",
    "Family Dal-Roti-Sabzi with Optional Egg or Chicken Add-On": "वैकल्पिक अंडा या चिकन के साथ पारिवारिक दाल-रोटी-सब्जी",
    "Common Breakfast Base with Optional Egg or Vegetarian Protein": "वैकल्पिक अंडा या शाकाहारी प्रोटीन के साथ साझा नाश्ता",
    "Common Family Base with Vegetarian and Non-Vegetarian Options": "शाकाहारी और नॉन-वेज विकल्पों के साथ साझा पारिवारिक भोजन",
    "Vegan Dal, Millet-Rice and Seasonal Sabzi Plate": "वीगन दाल, मिलेट-चावल और मौसमी सब्जी की थाली",
    "Vegan High Tea: Vegetable Chilla with Peanut Chutney and Fruit": "वीगन हाई टी: मूंगफली चटनी और फल के साथ सब्जी चीला",
    "High Tea: Vegetable Chilla with Curd, Fruit and Unsweetened Tea": "हाई टी: दही, फल और बिना चीनी वाली चाय के साथ सब्जी चीला",
    "Ragi Dosa with Vegetable Sambar and Curd": "सब्जी सांभर और दही के साथ रागी डोसा",
    "Ragi Dosa with Vegetable Sambar and Paneer Side": "सब्जी सांभर और पनीर साइड के साथ रागी डोसा",
    "Vegetable Poha with Curd and Fruit": "दही और फल के साथ सब्जी पोहा",
    "Vegetable Moong Dal Khichdi with Curd": "दही के साथ सब्जियों वाली मूंग दाल खिचड़ी",
    "Roti, Masoor Dal, Seasonal Sabzi and Curd": "रोटी, मसूर दाल, मौसमी सब्जी और दही",
    "Vegetable Pulao with Dal and Cucumber Raita": "दाल और खीरे के रायते के साथ सब्जी पुलाव",
    "Besan Chilla with Vegetable Soup and Curd": "सब्जी सूप और दही के साथ बेसन चीला",
  },
  kn: {
    "Paneer Bhurji with Whole Wheat Roti, Dal Tadka and Salad": "ಗೋಧಿ ರೊಟ್ಟಿ, ದಾಲ್ ತಡ್ಕಾ ಮತ್ತು ಸಲಾಡ್ ಜೊತೆಗೆ ಪನೀರ್ ಭುರ್ಜಿ",
    "Chicken Dal Rice Plate with Vegetables and Curd": "ತರಕಾರಿ ಮತ್ತು ಮೊಸರು ಜೊತೆಗೆ ಚಿಕನ್-ದಾಲ್-ಅಕ್ಕಿ ತಟ್ಟೆ",
    "Family Dal-Roti-Sabzi with Curd": "ಮೊಸರಿನೊಂದಿಗೆ ಕುಟುಂಬದ ದಾಲ್-ರೊಟ್ಟಿ-ತರಕಾರಿ",
    "Fish Dal Rice Plate with Vegetables and Curd": "ತರಕಾರಿ ಮತ್ತು ಮೊಸರು ಜೊತೆಗೆ ಮೀನು-ದಾಲ್-ಅಕ್ಕಿ ತಟ್ಟೆ",
    "Egg Curry with Roti, Seasonal Sabzi and Curd": "ರೊಟ್ಟಿ, ಋತುಮಾನ ತರಕಾರಿ ಮತ್ತು ಮೊಸರು ಜೊತೆಗೆ ಮೊಟ್ಟೆ ಕರಿ",
    "Family Dal-Roti-Sabzi with Optional Egg or Chicken Add-On": "ಐಚ್ಛಿಕ ಮೊಟ್ಟೆ ಅಥವಾ ಚಿಕನ್ ಜೊತೆ ಕುಟುಂಬದ ದಾಲ್-ರೊಟ್ಟಿ-ತರಕಾರಿ",
    "Common Breakfast Base with Optional Egg or Vegetarian Protein": "ಐಚ್ಛಿಕ ಮೊಟ್ಟೆ ಅಥವಾ ಸಸ್ಯಾಹಾರಿ ಪ್ರೋಟೀನ್ ಜೊತೆ ಸಾಮಾನ್ಯ ಉಪಹಾರ",
    "Common Family Base with Vegetarian and Non-Vegetarian Options": "ಸಸ್ಯಾಹಾರಿ ಮತ್ತು ನಾನ್-ವೆಜ್ ಆಯ್ಕೆಗಳೊಂದಿಗೆ ಸಾಮಾನ್ಯ ಕುಟುಂಬದ ಊಟ",
    "Vegan Dal, Millet-Rice and Seasonal Sabzi Plate": "ವೀಗನ್ ದಾಲ್, ಮಿಲ್ಲೆಟ್-ಅಕ್ಕಿ ಮತ್ತು ಋತುಮಾನ ತರಕಾರಿ ತಟ್ಟೆ",
    "Vegan High Tea: Vegetable Chilla with Peanut Chutney and Fruit": "ವೀಗನ್ ಹೈ ಟೀ: ಕಡಲೆಕಾಯಿ ಚಟ್ನಿ ಮತ್ತು ಹಣ್ಣು ಜೊತೆಗೆ ತರಕಾರಿ ಚಿಲ್ಲಾ",
    "High Tea: Vegetable Chilla with Curd, Fruit and Unsweetened Tea": "ಹೈ ಟೀ: ಮೊಸರು, ಹಣ್ಣು ಮತ್ತು ಸಕ್ಕರೆರಹಿತ ಚಹಾ ಜೊತೆಗೆ ತರಕಾರಿ ಚಿಲ್ಲಾ",
    "Ragi Dosa with Vegetable Sambar and Curd": "ತರಕಾರಿ ಸಾಂಬಾರ್ ಮತ್ತು ಮೊಸರು ಜೊತೆಗೆ ರಾಗಿ ದೋಸೆ",
    "Ragi Dosa with Vegetable Sambar and Paneer Side": "ತರಕಾರಿ ಸಾಂಬಾರ್ ಮತ್ತು ಪನೀರ್ ಸೈಡ್ ಜೊತೆಗೆ ರಾಗಿ ದೋಸೆ",
    "Vegetable Poha with Curd and Fruit": "ಮೊಸರು ಮತ್ತು ಹಣ್ಣು ಜೊತೆಗೆ ತರಕಾರಿ ಪೊಹಾ",
    "Vegetable Moong Dal Khichdi with Curd": "ಮೊಸರು ಜೊತೆಗೆ ತರಕಾರಿ ಮೂಂಗ್ ದಾಲ್ ಖಿಚಡಿ",
    "Roti, Masoor Dal, Seasonal Sabzi and Curd": "ರೊಟ್ಟಿ, ಮಸೂರ್ ದಾಲ್, ಋತುಮಾನ ತರಕಾರಿ ಮತ್ತು ಮೊಸರು",
    "Vegetable Pulao with Dal and Cucumber Raita": "ದಾಲ್ ಮತ್ತು ಸೌತೆಕಾಯಿ ರೈತ ಜೊತೆ ತರಕಾರಿ ಪುಲಾವ್",
    "Besan Chilla with Vegetable Soup and Curd": "ತರಕಾರಿ ಸೂಪ್ ಮತ್ತು ಮೊಸರು ಜೊತೆ ಬೇಸನ್ ಚಿಲ್ಲಾ",
  },
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
    "Onion and tomato": "प्याज और टमाटर",
    "Moong dal tadka": "मूंग दाल तड़का",
    "Chicken": "चिकन",
    "Mutton or goat": "मटन या बकरी का मांस",
    "Fish": "मछली",
    "Eggs or chicken add-on": "अंडा या चिकन ऐड-ऑन",
    "Brown rice or millet": "ब्राउन राइस या मिलेट",
    "Roasted peanuts or sesame chutney": "भुनी मूंगफली या तिल की चटनी",
    "Basic spices and lemon": "बेसिक मसाले और नींबू",
    "Peanut or coconut chutney": "मूंगफली या नारियल चटनी",
    "Herbal infusion or lemon water": "हर्बल पेय या नींबू पानी",
    "Seasonal vegetable soup mix": "मौसमी सब्जी सूप सामग्री",
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
    "Onion and tomato": "ಈರುಳ್ಳಿ ಮತ್ತು ಟೊಮೇಟೊ",
    "Moong dal tadka": "ಮೂಂಗ್ ದಾಲ್ ತಡ್ಕಾ",
    "Chicken": "ಚಿಕನ್",
    "Mutton or goat": "ಮಟನ್ ಅಥವಾ ಮೇಕೆ ಮಾಂಸ",
    "Fish": "ಮೀನು",
    "Eggs or chicken add-on": "ಮೊಟ್ಟೆ ಅಥವಾ ಚಿಕನ್ ಐಚ್ಛಿಕ ಸೇರಿಕೆ",
    "Brown rice or millet": "ಬ್ರೌನ್ ರೈಸ್ ಅಥವಾ ಮಿಲ್ಲೆಟ್",
    "Roasted peanuts or sesame chutney": "ಹುರಿದ ಕಡಲೆಕಾಯಿ ಅಥವಾ ಎಳ್ಳು ಚಟ್ನಿ",
    "Basic spices and lemon": "ಮೂಲ ಮಸಾಲೆಗಳು ಮತ್ತು ನಿಂಬೆ",
    "Peanut or coconut chutney": "ಕಡಲೆಕಾಯಿ ಅಥವಾ ತೆಂಗಿನ ಚಟ್ನಿ",
    "Herbal infusion or lemon water": "ಹರ್ಬಲ್ ಪಾನೀಯ ಅಥವಾ ನಿಂಬೆ ನೀರು",
    "Seasonal vegetable soup mix": "ಋತುಮಾನ ತರಕಾರಿ ಸೂಪ್ ಸಾಮಗ್ರಿ",
  },
} satisfies Record<Exclude<OutputLanguage, "en">, Record<string, string>>;

function translateIngredientName(name: string, language: OutputLanguage) {
  if (language === "en") return name;
  return ingredientTranslations[language][name] ?? name;
}

function translateMealName(name: string, language: OutputLanguage) {
  if (language === "en") return name;
  return mealNameTranslations[language][name] ?? name;
}

function translateQuantity(value: string | undefined, language: OutputLanguage) {
  if (!value || language === "en") return value;
  const replacements: Array<[RegExp, string]> =
    language === "hi"
      ? [
        [/\bcups\b/gi, "कप"],
        [/\bcup\b/gi, "कप"],
        [/\bbowls\b/gi, "कटोरी"],
        [/\bbowl\b/gi, "कटोरी"],
        [/\btbsp\b/gi, "बड़ा चम्मच"],
        [/\btablespoons?\b/gi, "बड़ा चम्मच"],
        [/\btsp\b/gi, "छोटा चम्मच"],
        [/\bteaspoons?\b/gi, "छोटा चम्मच"],
        [/\bgrams\b/gi, "ग्राम"],
        [/\bg\b/g, "ग्राम"],
        [/\bpieces\b/gi, "नग"],
        [/\bpiece\b/gi, "नग"],
        [/\beggs\b/gi, "अंडे"],
        [/\begg\b/gi, "अंडा"],
        [/\bchicken\b/gi, "चिकन"],
        [/\bsmall bunch\b/gi, "छोटा गुच्छा"],
        [/\bspices\b/gi, "मसाले"],
        [/\blemons\b/gi, "नींबू"],
        [/\bor\b/gi, "या"],
        [/\band\b/gi, "और"],
        [/\+/g, "+"],
      ]
      : [
        [/\bcups\b/gi, "ಕಪ್"],
        [/\bcup\b/gi, "ಕಪ್"],
        [/\bbowls\b/gi, "ಬೌಲ್"],
        [/\bbowl\b/gi, "ಬೌಲ್"],
        [/\btbsp\b/gi, "ದೊಡ್ಡ ಚಮಚ"],
        [/\btablespoons?\b/gi, "ದೊಡ್ಡ ಚಮಚ"],
        [/\btsp\b/gi, "ಚಿಕ್ಕ ಚಮಚ"],
        [/\bteaspoons?\b/gi, "ಚಿಕ್ಕ ಚಮಚ"],
        [/\bgrams\b/gi, "ಗ್ರಾಂ"],
        [/\bg\b/g, "ಗ್ರಾಂ"],
        [/\bpieces\b/gi, "ನಗ"],
        [/\bpiece\b/gi, "ನಗ"],
        [/\beggs\b/gi, "ಮೊಟ್ಟೆಗಳು"],
        [/\begg\b/gi, "ಮೊಟ್ಟೆ"],
        [/\bchicken\b/gi, "ಚಿಕನ್"],
        [/\bsmall bunch\b/gi, "ಚಿಕ್ಕ ಗುಚ್ಛ"],
        [/\bspices\b/gi, "ಮಸಾಲೆಗಳು"],
        [/\blemons\b/gi, "ನಿಂಬೆ"],
        [/\bor\b/gi, "ಅಥವಾ"],
        [/\band\b/gi, "ಮತ್ತು"],
        [/\+/g, "+"],
      ];
  return replacements.reduce((result, [pattern, replacement]) => result.replace(pattern, replacement), value);
}

function translateText(text: string | undefined, language: OutputLanguage): string | undefined {
  if (!text || language === "en") return text;

  const hi: Record<string, string> = {
    "A soft, affordable, Indian dinner that can be adjusted for age, activity, and diabetes-aware portions.":
      "एक हल्का, किफायती भारतीय भोजन, जिसे परिवार के सदस्यों की उम्र, गतिविधि और भोजन संबंधी आवश्यकताओं के अनुसार समायोजित किया जा सकता है।",
    "A rich, satisfying vegetarian dinner with paneer protein, fresh rotis, light dal tadka, and cooling salad.":
      "पनीर प्रोटीन, ताजी रोटियों, दाल तड़का और सलाद के साथ एक समृद्ध, संतोषजनक शाकाहारी डिनर।",
    "A quick Indian breakfast that can be softened, portion-controlled, or protein-supported by member need.":
      "एक जल्दी बनने वाला भारतीय नाश्ता, जिसे सदस्य की जरूरत के अनुसार नरम, नियंत्रित हिस्से वाला या प्रोटीन-समर्थित बनाया जा सकता है।",
    "A practical Indian lunch plate that keeps one common family meal while adapting portions for each member.":
      "एक व्यावहारिक भारतीय दोपहर का भोजन, जिसमें परिवार के लिए एक साझा भोजन रहता है और हर सदस्य के हिस्से अलग से समायोजित होते हैं।",
    "A practical dinner plate that avoids repeating a recent khichdi-style meal while keeping one adaptable family table.":
      "एक व्यावहारिक रात का भोजन, जो हाल की खिचड़ी जैसी पुनरावृत्ति से बचते हुए परिवार के लिए एक अनुकूल साझा भोजन रखता है।",
    "A balanced family dinner with vegetable pulao, dal protein and cooling raita, planned as a practical alternative to repeating khichdi.":
      "सब्जी पुलाव, दाल प्रोटीन और ठंडे रायते वाला संतुलित पारिवारिक डिनर, जिसे बार-बार खिचड़ी दोहराने के व्यावहारिक विकल्प के रूप में चुना गया है।",
    "A light but different dinner option using besan chilla, vegetable soup and curd for families wanting a change from rice-heavy meals.":
      "चावल-प्रधान भोजन से बदलाव चाहने वाले परिवारों के लिए बेसन चीला, सब्जी सूप और दही वाला हल्का लेकिन अलग रात का भोजन।",
    "A fully plant-based family meal with dal, vegetables, millet or rice, and nut/seed chutney. It avoids animal-derived ingredients.":
      "दाल, सब्जियों, मिलेट या चावल और मेवा/बीज की चटनी वाला पूरी तरह पौधों पर आधारित पारिवारिक भोजन।",
    "A non-vegetarian family meal with chicken protein, dal, vegetables, curd, and member-specific portions.":
      "चिकन प्रोटीन, दाल, सब्जियों, दही और सदस्य-विशेष हिस्सों वाला पारिवारिक नॉन-वेज भोजन।",
    "A non-vegetarian family meal using the family's saved fish/seafood preference with dal, vegetables, and curd.":
      "परिवार की सेव की हुई मछली/सीफूड पसंद के अनुसार दाल, सब्जियों, दही और सदस्य-विशेष हिस्सों वाला नॉन-वेज भोजन।",
    "An eggetarian family meal with egg protein, roti, vegetables, and curd.":
      "अंडे के प्रोटीन, रोटी, सब्जियों और दही वाला एगेटेरियन पारिवारिक भोजन।",
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
    "Protein-rich family dinner offering a hearty change from pulse-only dinners.":
      "प्रोटीन-युक्त पारिवारिक रात का भोजन जो केवल दाल-आधारित भोजन से एक अच्छा बदलाव देता है।",
    "Selected to add everyday dinner variety while preserving a simple common family meal.":
      "सरल साझा पारिवारिक भोजन को बनाए रखते हुए रोजमर्रा के डिनर में विविधता जोड़ने के लिए चुना गया।",
    "Rotate a familiar rice-based dinner without repeating the same khichdi texture, while keeping cost and cooking effort moderate.":
      "खर्च और पकाने का प्रयास मध्यम रखते हुए, खिचड़ी जैसी बनावट दोहराए बिना परिचित चावल-आधारित डिनर में बदलाव करें।",
    "Offer a quick pulse-based dinner alternative with vegetables and controlled portions.":
      "सब्जियों और नियंत्रित हिस्सों के साथ दाल/बेसन आधारित जल्दी बनने वाला डिनर विकल्प दें।",
    "Light family breakfast with vegetables, curd, and member-specific portions.":
      "सब्जियों, दही और सदस्य-विशेष हिस्सों वाला हल्का पारिवारिक नाश्ता।",
    "Balanced lunch with grains, dal protein, vegetables, curd, and member-specific portion guidance.":
      "अनाज, दाल प्रोटीन, सब्जियों, दही और सदस्य-विशेष हिस्सों के मार्गदर्शन वाला संतुलित दोपहर का भोजन।",
    "Nutrition values are estimates and should not be treated as medical advice.":
      "पोषण संबंधी आंकड़े अनुमान हैं और इन्हें चिकित्सा सलाह नहीं माना जाना चाहिए।",
    "Known allergies and doctor restrictions must be reviewed before cooking.":
      "खाना बनाने से पहले ज्ञात एलर्जी और डॉक्टर की पाबंदियां अवश्य जांचें।",
    [mandatoryDisclaimer]:
      "MAMAAI भोजन योजना में मदद करता है, लेकिन यह डॉक्टर, डाइटीशियन या पशु-चिकित्सक की सलाह का विकल्प नहीं है। एलर्जी, बीमारी, गर्भावस्था, बच्चों, बुजुर्गों और पालतू सदस्यों के लिए आवश्यक होने पर विशेषज्ञ से सलाह लें।",
  };

  const kn: Record<string, string> = {
    "A soft, affordable, Indian dinner that can be adjusted for age, activity, and diabetes-aware portions.":
      "ಕುಟುಂಬ ಸದಸ್ಯರ ವಯಸ್ಸು, ಚಟುವಟಿಕೆ ಮತ್ತು ಮಧುಮೇಹ-ಜಾಗೃತ ಭಾಗಗಳಿಗೆ ಹೊಂದಿಸಬಹುದಾದ ಮೃದುವಾದ, ಕೈಗೆಟುಕುವ ಭಾರತೀಯ ಊಟ.",
    "A rich, satisfying vegetarian dinner with paneer protein, fresh rotis, light dal tadka, and cooling salad.":
      "ಪನೀರ್ ಪ್ರೋಟೀನ್, ತಾಜಾ ರೊಟ್ಟಿಗಳು, ದಾಲ್ ತಡ್ಕಾ ಮತ್ತು ಸಲಾಡ್‌ನೊಂದಿಗೆ ತೃಪ್ತಿಕರ ಸಸ್ಯಾಹಾರಿ ಡಿನ್ನರ್.",
    "A quick Indian breakfast that can be softened, portion-controlled, or protein-supported by member need.":
      "ಸದಸ್ಯರ ಅಗತ್ಯಕ್ಕೆ ಅನುಗುಣವಾಗಿ ಮೃದುವಾಗಿಸಬಹುದಾದ, ಭಾಗ ನಿಯಂತ್ರಿಸಬಹುದಾದ ಅಥವಾ ಪ್ರೋಟೀನ್ ಬೆಂಬಲ ಸೇರಿಸಬಹುದಾದ ತ್ವರಿತ ಭಾರತೀಯ ಉಪಹಾರ.",
    "A practical Indian lunch plate that keeps one common family meal while adapting portions for each member.":
      "ಒಂದು ಸಾಮಾನ್ಯ ಕುಟುಂಬದ ಊಟವನ್ನು ಉಳಿಸಿಕೊಂಡು ಪ್ರತಿಯೊಬ್ಬ ಸದಸ್ಯರ ಭಾಗಗಳನ್ನು ಹೊಂದಿಸುವ ಪ್ರಾಯೋಗಿಕ ಭಾರತೀಯ ಮಧ್ಯಾಹ್ನದ ಊಟ.",
    "A practical dinner plate that avoids repeating a recent khichdi-style meal while keeping one adaptable family table.":
      "ಇತ್ತೀಚಿನ ಖಿಚಡಿ ಮಾದರಿಯ ಪುನರಾವರ್ತನೆಯನ್ನು ತಪ್ಪಿಸಿ, ಕುಟುಂಬಕ್ಕೆ ಹೊಂದಿಕೊಳ್ಳುವ ಸಾಮಾನ್ಯ ರಾತ್ರಿ ಊಟವನ್ನು ಉಳಿಸುವ ಪ್ರಾಯೋಗಿಕ ಆಯ್ಕೆ.",
    "A balanced family dinner with vegetable pulao, dal protein and cooling raita, planned as a practical alternative to repeating khichdi.":
      "ಖಿಚಡಿಯನ್ನು ಮತ್ತೆ ಮತ್ತೆ ನೀಡುವುದಕ್ಕೆ ಬದಲು, ತರಕಾರಿ ಪುಲಾವ್, ದಾಲ್ ಪ್ರೋಟೀನ್ ಮತ್ತು ತಂಪಾದ ರೈತದೊಂದಿಗೆ ಸಮತೋಲನ ಕುಟುಂಬದ ಡಿನ್ನರ್.",
    "A light but different dinner option using besan chilla, vegetable soup and curd for families wanting a change from rice-heavy meals.":
      "ಅಕ್ಕಿ ಆಧಾರಿತ ಊಟದಿಂದ ಬದಲಾವಣೆ ಬೇಕಿರುವ ಕುಟುಂಬಗಳಿಗೆ ಬೇಸನ್ ಚಿಲ್ಲಾ, ತರಕಾರಿ ಸೂಪ್ ಮತ್ತು ಮೊಸರಿನ ಹಗುರ ಆದರೆ ವಿಭಿನ್ನ ಡಿನ್ನರ್ ಆಯ್ಕೆ.",
    "A fully plant-based family meal with dal, vegetables, millet or rice, and nut/seed chutney. It avoids animal-derived ingredients.":
      "ದಾಲ್, ತರಕಾರಿಗಳು, ಮಿಲ್ಲೆಟ್ ಅಥವಾ ಅಕ್ಕಿ ಮತ್ತು ಕಾಯಿ/ಬೀಜದ ಚಟ್ನಿಯೊಂದಿಗಿನ ಸಂಪೂರ್ಣ ಸಸ್ಯಾಧಾರಿತ ಕುಟುಂಬದ ಊಟ.",
    "A non-vegetarian family meal with chicken protein, dal, vegetables, curd, and member-specific portions.":
      "ಚಿಕನ್ ಪ್ರೋಟೀನ್, ದಾಲ್, ತರಕಾರಿಗಳು, ಮೊಸರು ಮತ್ತು ಸದಸ್ಯರಿಗನುಗುಣ ಭಾಗಗಳಿರುವ ನಾನ್-ವೆಜ್ ಕುಟುಂಬದ ಊಟ.",
    "An eggetarian family meal with egg protein, roti, vegetables, and curd.":
      "ಮೊಟ್ಟೆ ಪ್ರೋಟೀನ್, ರೊಟ್ಟಿ, ತರಕಾರಿಗಳು ಮತ್ತು ಮೊಸರು ಹೊಂದಿರುವ ಎಗ್ಗೆಟೇರಿಯನ್ ಕುಟುಂಬದ ಊಟ.",
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
    "Protein-rich family dinner offering a hearty change from pulse-only dinners.":
      "ಕೇವಲ ಬೇಳೆ ಆಧಾರಿತ ಊಟದಿಂದ ಉತ್ತಮ ಬದಲಾವಣೆ ನೀಡುವ ಪ್ರೋಟೀನ್-ಯುಕ್ತ ಕುಟುಂಬದ ಡಿನ್ನರ್.",
    "Selected to add everyday dinner variety while preserving a simple common family meal.":
      "ಸರಳ ಸಾಮಾನ್ಯ ಕುಟುಂಬದ ಊಟವನ್ನು ಉಳಿಸಿಕೊಂಡು ದಿನನಿತ್ಯದ ಡಿನ್ನರ್‌ನಲ್ಲಿ ವೈವಿಧ್ಯ ಸೇರಿಸಲು ಆಯ್ಕೆಮಾಡಲಾಗಿದೆ.",
    "Rotate a familiar rice-based dinner without repeating the same khichdi texture, while keeping cost and cooking effort moderate.":
      "ವೆಚ್ಚ ಮತ್ತು ಅಡುಗೆ ಶ್ರಮವನ್ನು ಮಧ್ಯಮವಾಗಿರಿಸಿಕೊಂಡು, ಅದೇ ಖಿಚಡಿ ತಳಿಯನ್ನು ಮರುಕಳಿಸದೆ ಪರಿಚಿತ ಅಕ್ಕಿ ಆಧಾರಿತ ಡಿನ್ನರ್‌ನಲ್ಲಿ ಬದಲಾವಣೆ ಮಾಡಿ.",
    "Offer a quick pulse-based dinner alternative with vegetables and controlled portions.":
      "ತರಕಾರಿಗಳು ಮತ್ತು ನಿಯಂತ್ರಿತ ಭಾಗಗಳೊಂದಿಗೆ ಬೇಗ ತಯಾರಾಗುವ ಬೇಳೆ/ಬೇಸನ್ ಆಧಾರಿತ ಡಿನ್ನರ್ ಪರ್ಯಾಯವನ್ನು ನೀಡಿ.",
    "Light family breakfast with vegetables, curd, and member-specific portions.":
      "ತರಕಾರಿಗಳು, ಮೊಸರು ಮತ್ತು ಸದಸ್ಯರಿಗನುಗುಣ ಭಾಗಗಳಿರುವ ಹಗುರವಾದ ಕುಟುಂಬದ ಉಪಹಾರ.",
    "Balanced lunch with grains, dal protein, vegetables, curd, and member-specific portion guidance.":
      "ಧಾನ್ಯಗಳು, ದಾಲ್ ಪ್ರೋಟೀನ್, ತರಕಾರಿಗಳು, ಮೊಸರು ಮತ್ತು ಸದಸ್ಯರಿಗನುಗುಣ ಭಾಗ ಮಾರ್ಗದರ್ಶನದೊಂದಿಗೆ ಸಮತೋಲನ ಮಧ್ಯಾಹ್ನದ ಊಟ.",
    "Nutrition values are estimates and should not be treated as medical advice.":
      "ಪೋಷಕಾಂಶದ ಮೌಲ್ಯಗಳು ಅಂದಾಜುಗಳು; ಅವನ್ನು ವೈದ್ಯಕೀಯ ಸಲಹೆಯಾಗಿ ಪರಿಗಣಿಸಬಾರದು.",
    "Known allergies and doctor restrictions must be reviewed before cooking.":
      "ಅಡುಗೆ ಮಾಡುವ ಮೊದಲು ತಿಳಿದಿರುವ ಅಲರ್ಜಿಗಳು ಮತ್ತು ವೈದ್ಯರ ನಿರ್ಬಂಧಗಳನ್ನು ಅವಶ್ಯವಾಗಿ ಪರಿಶೀಲಿಸಿ.",
    [mandatoryDisclaimer]:
      "MAMAAI ಊಟದ ಯೋಜನೆಗೆ ಸಹಾಯ ಮಾಡುತ್ತದೆ; ಆದರೆ ಇದು ವೈದ್ಯರು, ಡೈಟಿಷಿಯನ್ ಅಥವಾ ಪಶುವೈದ್ಯರ ಸಲಹೆಗೆ ಪರ್ಯಾಯವಲ್ಲ. ಅಲರ್ಜಿ, ಕಾಯಿಲೆ, ಗರ್ಭಧಾರಣೆ, ಮಕ್ಕಳು, ಹಿರಿಯರು ಮತ್ತು ಪೆಟ್ ಸದಸ್ಯರಿಗೆ ಅಗತ್ಯವಿದ್ದರೆ ತಜ್ಞರನ್ನು ಸಂಪರ್ಕಿಸಿ.",
  };

  return (language === "hi" ? hi[text] : kn[text]) ?? text;
}

function localizeIngredient(ingredient: Ingredient, language: OutputLanguage): Ingredient {
  if (language === "en") return ingredient;
  return {
    ...ingredient,
    name: translateIngredientName(ingredient.name, language),
    quantity: translateQuantity(ingredient.quantity, language) ?? ingredient.quantity,
  };
}

export class AIService {
  localizeFamilyMealPlan(plan: FamilyMealPlan, locale?: string): FamilyMealPlan {
    const language = outputLanguage(locale);
    if (language === "en") return plan;

    return {
      ...plan,
      retentionPolicy: {
        ...plan.retentionPolicy,
        retainedLongTermSignals: plan.retentionPolicy.retainedLongTermSignals.map(
          (signal) => translateText(signal, language) ?? signal
        ),
        userMessage: translateText(plan.retentionPolicy.userMessage, language) ?? plan.retentionPolicy.userMessage,
      },
      commonMeal: {
        ...plan.commonMeal,
        name: translateMealName(plan.commonMeal.name, language),
        description: translateText(plan.commonMeal.description, language) ?? plan.commonMeal.description,
        regionFit: translateText(plan.commonMeal.regionFit, language) ?? plan.commonMeal.regionFit,
        nutritionIntent: translateText(plan.commonMeal.nutritionIntent, language) ?? plan.commonMeal.nutritionIntent,
        ingredients: plan.commonMeal.ingredients.map((ingredient) => localizeIngredient(ingredient, language)),
        alternativeOptions: plan.commonMeal.alternativeOptions?.map((alt) => ({
          ...alt,
          title: translateMealName(alt.title, language),
          description: translateText(alt.description, language) ?? alt.description,
          reasoning: translateText(alt.reasoning, language) ?? alt.reasoning,
        })),
        components: plan.commonMeal.components?.map((component) => ({
          ...component,
          label: translateText(component.label, language) ?? component.label,
          ingredients: component.ingredients.map((ingredient) => localizeIngredient(ingredient, language)),
          notes: component.notes.map((note) => translateText(note, language) ?? note),
        })),
        nutritionEstimate: {
          ...plan.commonMeal.nutritionEstimate,
          basis: translateText(plan.commonMeal.nutritionEstimate.basis, language) ?? plan.commonMeal.nutritionEstimate.basis,
          dataSource:
            translateText(plan.commonMeal.nutritionEstimate.dataSource, language) ??
            plan.commonMeal.nutritionEstimate.dataSource,
        },
        recipe: {
          ...plan.commonMeal.recipe,
          title: translateMealName(plan.commonMeal.recipe.title, language),
          ingredients: plan.commonMeal.recipe.ingredients.map((ingredient) => localizeIngredient(ingredient, language)),
          steps: plan.commonMeal.recipe.steps.map((step) => translateText(step, language) ?? step),
          familyAdjustments: plan.commonMeal.recipe.familyAdjustments.map((step) => translateText(step, language) ?? step),
          alternativeIngredients: plan.commonMeal.recipe.alternativeIngredients.map(
            (step) => translateText(step, language) ?? step
          ),
          videoRecommendation: plan.commonMeal.recipe.videoRecommendation
            ? {
              ...plan.commonMeal.recipe.videoRecommendation,
              label:
                translateText(plan.commonMeal.recipe.videoRecommendation.label, language) ??
                plan.commonMeal.recipe.videoRecommendation.label,
              note:
                translateText(plan.commonMeal.recipe.videoRecommendation.note, language) ??
                plan.commonMeal.recipe.videoRecommendation.note,
            }
            : undefined,
        },
      },
      memberCustomizations: plan.memberCustomizations.map((customization) => ({
        ...customization,
        modification: translateText(customization.modification, language) ?? customization.modification,
        portionGuidance: translateText(customization.portionGuidance, language) ?? customization.portionGuidance,
        safetyNotes: customization.safetyNotes.map((note) => translateText(note, language) ?? note),
      })),
      fruits: plan.fruits.map((fruit) => ({
        ...fruit,
        fruit: translateText(fruit.fruit, language) ?? fruit.fruit,
        portion: translateText(fruit.portion, language) ?? fruit.portion,
        timing: translateText(fruit.timing, language) ?? fruit.timing,
        alternatives: fruit.alternatives.map((alternative) => translateText(alternative, language) ?? alternative),
        caution: translateText(fruit.caution, language),
      })),
      hydration: plan.hydration.map((item) => ({
        ...item,
        guidance: translateText(item.guidance, language) ?? item.guidance,
        suitableBeverages: item.suitableBeverages.map((beverage) => translateText(beverage, language) ?? beverage),
        caution: translateText(item.caution, language),
      })),
      groceryItems: plan.groceryItems.map((item) => ({
        ...item,
        name: translateIngredientName(item.name, language),
        quantity: translateQuantity(item.quantity, language) ?? item.quantity,
        quantityToPurchase: translateQuantity(item.quantityToPurchase, language) ?? item.quantityToPurchase,
      })),
      mealIngredientRequirements: plan.mealIngredientRequirements.map((item) => ({
        ...item,
        name: translateIngredientName(item.name, language),
        baseQuantity: translateQuantity(item.baseQuantity, language) ?? item.baseQuantity,
        adjustedQuantity: translateQuantity(item.adjustedQuantity, language) ?? item.adjustedQuantity,
        quantityToPurchase: translateQuantity(item.quantityToPurchase, language) ?? item.quantityToPurchase,
        notes: item.notes.map((note) => translateText(note, language) ?? note),
      })),
      dailyGroceryRequirements: plan.dailyGroceryRequirements.map((item) => ({
        ...item,
        name: translateIngredientName(item.name, language),
        baseQuantity: translateQuantity(item.baseQuantity, language) ?? item.baseQuantity,
        adjustedQuantity: translateQuantity(item.adjustedQuantity, language) ?? item.adjustedQuantity,
        quantityToPurchase: translateQuantity(item.quantityToPurchase, language) ?? item.quantityToPurchase,
        notes: item.notes.map((note) => translateText(note, language) ?? note),
      })),
      fastingMealRequirements: plan.fastingMealRequirements.map((item) => ({
        ...item,
        suggestion: translateText(item.suggestion, language) ?? item.suggestion,
        allowedFoodsUsed: item.allowedFoodsUsed.map((food) => translateText(food, language) ?? food),
        avoidedFoods: item.avoidedFoods.map((food) => translateText(food, language) ?? food),
        notes: item.notes.map((note) => translateText(note, language) ?? note),
      })),
      familySatisfactionScore: {
        ...plan.familySatisfactionScore,
        explanation:
          translateText(plan.familySatisfactionScore.explanation, language) ??
          plan.familySatisfactionScore.explanation,
      },
      warnings: plan.warnings.map((warning) => translateText(warning, language) ?? warning),
      disclaimer: translateText(plan.disclaimer, language) ?? plan.disclaimer,
    };
  }

  generateFamilyMealPlan(input: GeneratePlanInput): FamilyMealPlan {
    const timestamp = nowIso();
    const mealId = createId(input.replacement ? "replacement-meal" : "meal");
    const commonMeal = mealForTime(input, mealId);
    const attendance = mealAttendanceFor(input, commonMeal.mealTime);
    const mealIngredientRequirements = commonMeal.components?.length
      ? quantityPlanningService.componentMealRequirements(
        commonMeal.mealTime,
        commonMeal.components,
        attendance,
        input.members
      )
      : quantityPlanningService.mealRequirements(
        commonMeal.mealTime,
        commonMeal.ingredients,
        attendance,
        input.members
      );
    const fastingMealRequirements = quantityPlanningService.fastingRequirements(
      commonMeal.mealTime,
      attendance,
      input.members
    );
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
      memberCustomizations: input.members.map((member) =>
        this.customizeMember(member, commonMeal, input.replacement)
      ),
      preferenceResolution: preferenceResolutionFor(input.members, commonMeal),
      fruits: input.members.map((member) => this.fruitForMember(member)),
      hydration: input.members.map((member) => this.hydrationForMember(member)),
      estimatedCost: {
        mealCost: money(totalCost),
        dailyCost: money(estimatedDailyCost),
      },
      groceryItems,
      mealAttendance: [attendance],
      mealIngredientRequirements,
      dailyGroceryRequirements,
      fastingMealRequirements,
      familySatisfactionScore: {
        score: input.replacement ? 86 : 89,
        explanation: "Score balances taste familiarity, health fit, affordability, local availability, and cooking effort.",
      },
      warnings: [
        "Nutrition values are estimates and should not be treated as medical advice.",
        "Known allergies and doctor restrictions must be reviewed before cooking.",
        budgetWarning(input.family, totalCost, estimatedDailyCost),
        ...(input.family.weeklyFoodRoutineStatus === "add"
          ? [
            "Saved weekly family food routine was considered as a preference; the user's latest request should override it for this occasion, and learned routine changes require user confirmation.",
          ]
          : []),
        input.userPlanningMode === "returning_user_weekly_editable"
          ? "Returning-user mode should reuse editable weekly planning to control AI cost and avoid unnecessary regeneration."
          : "New-user mode generates a focused next-meal plan for onboarding and demo clarity.",
      ],
      disclaimer: mandatoryDisclaimer,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
  }

  private customizeMember(member: FamilyMember, commonMeal: CommonMeal, replacement?: boolean) {
    const hasDiabetes = member.healthConditions.some((condition) => condition.toLowerCase().includes("diabetes"));
    const isChild = member.age < 13;
    const isSenior = member.age > 65 || member.specialStatuses.some((status) => status.toLowerCase().includes("senior"));
    const highActivity = member.activityLevel === "heavy" || member.activityLevel === "athlete";
    const ageActivityPortion = memberPortionLabel(member);
    const componentGuidance = componentGuidanceForMember(commonMeal, member);
    const nonVegRuleNote =
      member.dietType === "non_vegetarian" || member.dietType === "eggitarian"
        ? ` Saved non-veg pattern: ${member.nonVegFrequency?.replaceAll("_", " ") ?? "not specified"}${member.nonVegAvoidDays?.length ? `; avoid days: ${member.nonVegAvoidDays.join(", ")}` : "; no fixed avoid day"
        }.`
        : "";
    const hardConflicts = ingredientConflicts(commonMeal, memberHardRestrictions(member));
    const dislikedIngredients = ingredientConflicts(commonMeal, memberSoftDislikes(member));
    const dislikedMeals = mealNameConflicts(commonMeal, memberSoftDislikes(member));
    const safetyNotes = [
      ...hardConflicts.map(
        (conflict) => `Hard restriction: do not serve ${conflict} to ${member.name}. Use the listed alternative.`
      ),
      ...dislikedIngredients.map(
        (conflict) => `Preference adjustment: avoid ${conflict} in ${member.name}'s portion if practical.`
      ),
      ...dislikedMeals.map(
        (conflict) => `Preference adjustment: ${member.name} dislikes ${conflict}; provide the alternative portion.`
      ),
    ];

    if (hardConflicts.length || dislikedIngredients.length || dislikedMeals.length) {
      const conflicts = [...hardConflicts, ...dislikedIngredients, ...dislikedMeals].join(", ");
      const softDislikeGuidance = dislikedMeals.length
        ? `This member does not prefer the common dish (${dislikedMeals.join(
          ", "
        )}). If the rest of the family keeps this meal, prepare a simple member-only alternative according to this member's diet pattern.`
        : `Keep the common family meal, but remove or replace ${conflicts} from this member's portion before changing the entire family meal.`;
      return {
        memberId: member.memberId,
        memberName: member.name,
        modification: hardConflicts.length
          ? `Do not serve the conflicting item(s): ${conflicts}. Use a safe dal, roti, vegetable, curd-free, egg-free, or protein alternative.`
          : softDislikeGuidance,
        portionGuidance: `Serve a ${ageActivityPortion} only after the conflicting item is removed or replaced.${componentGuidance}${nonVegRuleNote}`,
        safetyNotes,
      };
    }

    if (hasDiabetes) {
      return {
        memberId: member.memberId,
        memberName: member.name,
        modification: "Keep grain portions controlled, add extra vegetables, and avoid sweet beverages.",
        portionGuidance: `Serve a controlled portion of the suggested meal with extra vegetables or dal; adjust as a ${ageActivityPortion}.${componentGuidance}`,
        safetyNotes: [
          "Diabetes-aware portion guidance; follow doctor-provided carbohydrate instructions if stricter.",
          ...safetyNotes,
        ],
      };
    }

    if (isSenior) {
      return {
        memberId: member.memberId,
        memberName: member.name,
        modification: "Serve the suggested meal softer, mildly spiced, warm, and easy to chew.",
        portionGuidance: `Serve a small soft portion of the suggested meal; ${ageActivityPortion}.${componentGuidance}`,
        safetyNotes: ["Watch chewing comfort and digestion.", ...safetyNotes],
      };
    }

    if (highActivity) {
      return {
        memberId: member.memberId,
        memberName: member.name,
        modification:
          "Add extra dal, paneer, egg, chicken, or another suitable protein side according to this member's diet pattern.",
        portionGuidance: `Larger serving of the suggested meal with extra dal or suitable protein side; ${ageActivityPortion}.${componentGuidance}`,
        safetyNotes,
      };
    }

    if (isChild) {
      return {
        memberId: member.memberId,
        memberName: member.name,
        modification: "Serve the suggested meal mild, colorful, and in small child-friendly pieces.",
        portionGuidance: `Child-size serving of the suggested meal with curd or a suitable side; ${ageActivityPortion}.${componentGuidance}`,
        safetyNotes: [
          "Child nutrition needs are individualized; consult a pediatric professional for specific concerns.",
          ...safetyNotes,
        ],
      };
    }

    return {
      memberId: member.memberId,
      memberName: member.name,
      modification: "Regular balanced portion with vegetables, dal or suitable side.",
      portionGuidance: `Standard serving of the suggested meal with curd or suitable side; ${ageActivityPortion}.${componentGuidance}${nonVegRuleNote}`,
      safetyNotes,
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
      caution: hasDiabetes ? "Prefer whole fruit and avoid juice unless a clinician has advised otherwise." : undefined,
    };
  }

  private hydrationForMember(member: FamilyMember) {
    const kidneyConcern = member.healthConditions.some((condition) => condition.toLowerCase().includes("kidney"));
    return {
      memberId: member.memberId,
      memberName: member.name,
      guidance: kidneyConcern
        ? "Follow doctor-specified fluid limits."
        : member.age < 13
          ? "Small frequent water servings through the day."
          : "Sip water steadily across the day.",
      suitableBeverages: kidneyConcern ? ["Doctor-approved fluids"] : ["Water", "Unsweetened buttermilk"],
      caution: kidneyConcern ? "Kidney-related fluid and potassium restrictions need professional guidance." : undefined,
    };
  }
}