export type ID = string;

export type Gender = "female" | "male" | "other" | "prefer_not_to_say";

export type ActivityLevel = "sedentary" | "light" | "moderate" | "heavy" | "athlete";

export type DietType = "vegetarian" | "non_vegetarian" | "eggitarian" | "vegan" | "jain" | "satvik" | "other";

export type FamilyDietPreference = "vegetarian" | "non_vegetarian" | "semi_vegetarian" | "eggetarian" | "vegan" | "mixed";
export type FoodPreferenceCode = "VEG" | "EGG" | "NV-CH" | "NV-MT" | "NV-FI" | "NV-SF" | "NV-MIX";
export type MealStyle = "everyday" | "occasional" | "festive";

export type NonVegetarianFrequency =
  | "occasionally"
  | "1_2_days_per_week"
  | "3_4_days_per_week"
  | "4_5_days_per_week"
  | "most_days"
  | "custom";

export type WeeklyFoodRoutineStatus = "add" | "no_fixed_routine" | "skip";

export type DayFoodPreference =
  | "vegetarian"
  | "non_vegetarian"
  | "eggetarian"
  | "vegan"
  | "light_meal"
  | "fasting_vrat"
  | "special_family_meal"
  | "eating_out_takeaway"
  | "ready_frozen"
  | "no_preference"
  | "custom";

export type MealSlot = "breakfast" | "lunch" | "snacks" | "dinner";

export type MealOccasion =
  | "breakfast"
  | "brunch"
  | "lunch"
  | "afternoon_snack"
  | "high_tea"
  | "dinner"
  | "supper";

export type MemberMealAttendanceStatus = "home" | "tiffin" | "skip" | "fasting";

export interface MealTimeSlotConfig {
  enabled: boolean;
  time: string; // "HH:MM" 24-hour format
}

export interface MealTimetableSchedule {
  reminderLeadTimeMinutes: number; // default 45 mins
  weekday: Record<MealOccasion, MealTimeSlotConfig>;
  weekend?: Record<MealOccasion, MealTimeSlotConfig>;
  useSeparateWeekendSchedule: boolean;
}

export interface MealTimingPattern {
  breakfast?: string; // "HH:MM" 24h format
  lunch?: string;
  snacks?: string;
  dinner?: string;
}

export interface DayWiseFoodRoutinePreference {
  day: string;
  preference: DayFoodPreference;
  note?: string;
  meals?: Partial<Record<MealSlot, DayFoodPreference>>;
}

export type MealTypePreferenceProfile = Partial<Record<MealSlot, string[]>>;

export interface RecentMealHistoryDay {
  day: string;
  breakfast?: string;
  lunch?: string;
  snacks?: string;
  dinner?: string;
}

export interface CulturalFoodProfile {
  country?: string;
  region?: string;
  city?: string;
  cookingStyle?: string;
  preferredCuisines?: string[];
}

export type RegionalCuisinePreference =
  | "north_indian"       // Punjab, Haryana, UP, Delhi, Rajasthan
  | "south_indian"       // Karnataka, Tamil Nadu, Kerala, AP, Telangana
  | "eastern_indian"     // West Bengal, Odisha, Bihar, Jharkhand
  | "western_indian"     // Maharashtra, Gujarat, Goa
  | "central_indian"     // MP, Chhattisgarh
  | "northeast_indian"   // Assam, Meghalaya, etc.
  | "pahadi"             // Uttarakhand, Himachal Pradesh
  | "kashmiri"           // Kashmiri cuisine
  | "pan_indian"         // Mixed Indian household
  | "custom";            // Other specific preference

export type FoodVarietyMode =
  | "mostly_primary"     // ~70-80% meals from Primary Cuisine
  | "balanced_mix"       // Balanced rotation between Primary & Secondary
  | "pan_india_rotation"; // Broad Pan-India exploration

export interface FamilyCuisineProfile {
  primaryCuisine: RegionalCuisinePreference;
  secondaryCuisines: RegionalCuisinePreference[];
  varietyMode: FoodVarietyMode;
  customCuisineNotes?: string;
}

export type PlanType = "daily" | "weekly" | "monthly";

export type MealTime = "breakfast" | "lunch" | "dinner" | "snack" | "evening_snack" | "high_tea";

export type UserPlanningMode = "new_user_next_meal" | "returning_user_weekly_editable";

export interface MealTimeContext {
  timeZone: string;
  locale?: string;
  country?: string;
  region?: string;
  city?: string;
  localHour?: number;
}

export type SubscriptionPlan =
  | "starter"
  | "premium"
  | "family_plus"
  | "family_starter"
  | "family_premium";

export type EntitlementSource = "demo_judge_access" | "local_demo" | "razorpay" | "revenuecat" | "manual_admin";

export type PaymentChannel = "demo" | "razorpay" | "web_payment" | "google_play" | "apple_app_store" | "manual_admin";

export type SubscriptionStatus =
  | "active"
  | "trialing"
  | "past_due"
  | "cancelled"
  | "expired";

export type PaymentStatus = "not_required" | "pending" | "paid" | "failed" | "refunded" | "unknown";

export interface SubscriptionPlanDefinition {
  plan: SubscriptionPlan;
  displayName: string;
  priceMonthlyInr: number;
  priceMonthlyUsd: number;
  memberLimit: number;
  revenueCatEntitlementId: string;
  revenueCatProductId: string;
  revenueCatInternationalProductId?: string;
  googlePlayProductId: string;
  googlePlayInternationalProductId?: string;
  fairUseLimits: {
    mealPlansPerDay: number;
    mealReplacementsPerDay: number;
    askMamaQuestionsPerDay: number;
    recipeVideoSearchesPerDay: number;
  };
  razorpayPlanIdEnv: string;
  razorpayPlanId?: string;
}

export interface SubscriptionEntitlement {
  userId: ID;
  plan: SubscriptionPlan;
  memberLimit: number;
  source: EntitlementSource;
  status?: SubscriptionStatus;
  paymentChannel?: PaymentChannel;
  paymentStatus?: PaymentStatus;
  isActive: boolean;
  bypassPaymentForDemo: boolean;
  revenueCatCustomerId?: string;
  razorpayCustomerId?: string;
  razorpaySubscriptionId?: string;
  razorpayPaymentId?: string;
  startsAt?: string;
  renewsAt?: string;
  expiresAt?: string;
  cancelledAt?: string;
  features?: string[];
  checkedAt: string;
}

export interface SubscriptionRecord {
  subscriptionRecordId: string;
  userId: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  paymentChannel: "razorpay" | "revenuecat" | "manual";
  paymentStatus: PaymentStatus;
  source: string;
  memberLimit: number;
  startsAt: string;
  renewsAt?: string;
  expiresAt?: string;
  cancelledAt?: string;
  razorpaySubscriptionId?: string;
  razorpayPlanId?: string;
  providerStatus?: string;
  lastProviderEvent?: string;
  lastProviderEventAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentTransaction {
  transactionId: ID;
  userId: ID;
  plan?: SubscriptionPlan;
  subscriptionRecordId?: ID;
  paymentChannel: PaymentChannel;
  paymentStatus: PaymentStatus;
  amount?: number;
  currency?: "INR" | "USD";
  providerPaymentId?: string;
  providerSubscriptionId?: string;
  providerInvoiceId?: string;
  providerOrderId?: string;
  providerEvent?: string;
  rawStatus?: string;
  createdAt: string;
}

export type MealReplacementReason =
  | "dont_like_it"
  | "ate_recently"
  | "too_expensive"
  | "ingredient_unavailable"
  | "too_difficult"
  | "takes_too_long"
  | "health_concern";

export interface Money {
  amount: number;
  currency: "INR" | "USD";
}

export interface User {
  userId: ID;
  name: string;
  email?: string;
  mobile?: string;
  country: string;
  state: string;
  city: string;
  preferredLanguage: string;
  authProvider: "guest" | "email" | "google" | "mobile_otp" | "apple";
  role: "user" | "super_admin" | "admin" | "nutrition_reviewer" | "crm_manager" | "sales_executive" | "support_executive" | "finance";
  healthDataConsentAt?: string;
  aiMemoryConsentAt?: string;
}

export interface BudgetProfile {
  type: "per_meal" | "daily" | "weekly" | "monthly" | "none";
  amount?: number;
  currency: "INR" | "USD";
  priority?: "strict" | "flexible";
  preferLowCostMeals?: boolean;
}

export interface KitchenProfile {
  equipment: string[];
  cookingTimePreference: "under_30" | "30_to_60" | "over_60";
}

export interface CuisinePreferenceWeight {
  cuisine: string;
  frequency: "mostly" | "often" | "sometimes" | "rarely";
  percentage?: number;
}

export interface Family {
  familyId: ID;
  userId: ID;
  name: string;
  country: string;
  state: string;
  city: string;
  dietPreference: FamilyDietPreference;
  cuisinePreferences: string[];
  cuisineProfile?: FamilyCuisineProfile;
  cuisinePreferenceWeights?: CuisinePreferenceWeight[];
  indianRegionalPreferences?: string[];
  localIngredientAvailabilityNotes?: string[];
  weeklyFoodRoutineStatus?: WeeklyFoodRoutineStatus;
  weeklyFoodRoutine?: DayWiseFoodRoutinePreference[];
  mealTypePreferences?: MealTypePreferenceProfile;
  recentMealHistory?: RecentMealHistoryDay[];
  mealTimings?: MealTimingPattern;
  mealSchedule?: MealTimetableSchedule;
  favoriteFoodStyles?: string[];
  customFavoriteFoods?: string[];
  favoriteFoodTags?: string[];
  nonVegPreferredFoods?: string[];
  cultureProfile?: CulturalFoodProfile;
  budget: BudgetProfile;
  kitchenProfile: KitchenProfile;
  subscriptionPlan: SubscriptionPlan;
  createdAt: string;
  updatedAt: string;
}

export interface FastingPreference {
  observesFasting: "no" | "yes" | "occasionally";
  regularDays: string[];
  fastType?: "full_fast" | "restricted_food_fast" | "time_restricted" | "custom";
  reasonOrTradition?: string;
  allowedFoods: string[];
  avoidedFoods: string[];
  fastingMealCount?: number;
  fruitsAllowed: boolean;
  dairyAllowed: boolean;
  grainsRestricted: boolean;
  customRules: string[];
}

export interface FamilyMember {
  memberId: ID;
  familyId: ID;
  name: string;
  relationship: string;
  age: number;
  gender: Gender;
  heightCm?: number;
  weightKg?: number;
  activityLevel: ActivityLevel;
  goals: string[];
  dietType: DietType;
  nonVegFrequency?: NonVegetarianFrequency;
  nonVegAvoidDays?: string[];
  nonVegCustomRule?: string;
  likes: string[];
  dislikes: string[];
  allergies: string[];
  foodAllergies: string[];
  ingredientAllergies: string[];
  foodDislikes: string[];
  dislikedMeals: string[];
  excludedIngredients: string[];
  dietaryRestrictions: string[];
  healthConditions: string[];
  doctorRestrictions: string[];
  specialStatuses: string[];
  fastingPreference?: FastingPreference;
}

export interface NutritionContext {
  memberId: ID;
  bmi?: number;
  bmiCategory?: string;
  estimatedCalories?: number;
  proteinGuidanceGrams?: number;
  carbGuidance: string;
  fatGuidance: string;
  fiberGuidance: string;
  hydrationGuidanceMl?: number;
  calculationNotes: string[];
  requiresProfessionalGuidance: boolean;
}

export interface Ingredient {
  name: string;
  quantity: string;
  category: "vegetables" | "fruits" | "grains" | "pulses" | "dairy" | "protein" | "spices" | "other";
  estimatedCost: Money;
}

export interface NutritionEstimate {
  caloriesKcal: number;
  proteinGrams: number;
  carbsGrams: number;
  fatGrams: number;
  fiberGrams: number;
  basis: string;
  dataSource: string;
  confidence: "low" | "medium" | "high";
}

export interface RecipeDetails {
  title: string;
  servings: number;
  prepTimeMinutes: number;
  cookTimeMinutes: number;
  difficulty: "easy" | "medium" | "hard";
  ingredients: Ingredient[];
  steps: string[];
  estimatedNutrition: NutritionEstimate;
  estimatedCost: Money;
  familyAdjustments: string[];
  alternativeIngredients: string[];
  videoRecommendation?: {
    label: string;
    url?: string;
    note: string;
  };
}

export interface RecipeVideoSearchRequest {
  dishName: string;
  country?: string;
  region?: string;
  preferredLanguage?: string;
  cuisine?: string[];
  dietaryPreference?: FamilyDietPreference;
  healthyPreparation?: boolean;
  familyRequirements?: string[];
}

export type FeatureAvailabilityStatus = "fully_functional" | "demo_test_only" | "temporarily_disabled" | "planned";

export interface RecipeVideoResult {
  title: string;
  channelTitle: string;
  url: string;
  thumbnailUrl?: string;
  source: "approved" | "sponsored" | "youtube" | "fallback_search";
  language?: string;
  sponsorName?: string;
  sponsored?: boolean;
  approved?: boolean;
  matchQuality?: "exact" | "close" | "fallback";
  thirdPartyDisclaimer: string;
}

export interface RecipeVideoSearchResponse {
  query: string;
  usedOfficialApi: boolean;
  status: FeatureAvailabilityStatus;
  statusLabel: string;
  results: RecipeVideoResult[];
  note: string;
}

export interface MealAlternativeOption {
  title: string;
  description: string;
  prepTimeMinutes: number;
  difficulty: "easy" | "medium" | "hard";
  ingredientsSummary: string[];
  reasoning: string;
}

export interface CommonMeal {
  mealId: ID;
  name: string;
  mealTime: MealTime;
  description: string;
  country?: string;
  region?: string;
  state?: string;
  subRegionOrCuisine?: string;
  foodPreferenceTags?: FoodPreferenceCode[];
  dishCategory?: string;
  proteinSource?: string;
  grainBase?: string;
  mainVegetable?: string;
  typicalCombination?: string;
  mealStyle?: MealStyle;
  seasonalSuitability?: string;
  ingredients: Ingredient[];
  components?: MealComponent[];
  prepTimeMinutes: number;
  difficulty: "easy" | "medium" | "hard";
  regionFit: string;
  nutritionIntent: string;
  nutritionEstimate: NutritionEstimate;
  recipe: RecipeDetails;
  alternativeOptions?: MealAlternativeOption[];
}

export interface MealComponent {
  componentId: ID;
  label: string;
  role: "common_base" | "vegetarian_option" | "eggetarian_option" | "non_vegetarian_option" | "vegan_option";
  memberIds: ID[];
  ingredients: Ingredient[];
  notes: string[];
}

export interface MemberCustomization {
  memberId: ID;
  memberName: string;
  modification: string;
  portionGuidance: string;
  safetyNotes: string[];
}

export type PreferenceResolutionOptionId = "separate_alternative" | "one_common_meal" | "two_compatible_options";

export interface PreferenceResolutionOption {
  optionId: PreferenceResolutionOptionId;
  label: string;
  description: string;
  cookingImpact: string;
}

export interface PreferenceResolution {
  hasSoftConflict: boolean;
  prompt: string;
  affectedMembers: Array<{
    memberId: ID;
    memberName: string;
    conflicts: string[];
    suggestedAlternative: string;
  }>;
  recommendedOptionId: PreferenceResolutionOptionId;
  options: PreferenceResolutionOption[];
  minimumCookingStrategy: string;
}

export interface FruitRecommendation {
  memberId: ID;
  memberName: string;
  fruit: string;
  portion: string;
  timing: string;
  alternatives: string[];
  caution?: string;
}

export interface HydrationRecommendation {
  memberId: ID;
  memberName: string;
  guidance: string;
  suitableBeverages: string[];
  caution?: string;
}

export interface GroceryItem {
  itemId: ID;
  name: string;
  category: Ingredient["category"];
  quantity: string;
  estimatedCost: Money;
  pantryQuantity?: string;
  quantityToPurchase: string;
}

export interface MealAttendanceEntry {
  mealTime: MealTime;
  participatingMemberIds: ID[];
  absentMemberIds: ID[];
  fastingMemberIds: ID[];
  guestCount: number;
  enabled: boolean;
}

export interface HighTeaPreference {
  enabled: boolean;
  days: string[];
  approximateTime: string;
  usualParticipantMemberIds: ID[];
  guestCount: number;
}

export interface IngredientRequirement {
  itemId: ID;
  mealTime: MealTime | "daily_total";
  name: string;
  category: Ingredient["category"];
  baseQuantity: string;
  adjustedQuantity: string;
  quantityToPurchase: string;
  portionUnits: number;
  estimatedCost: Money;
  notes: string[];
}

export interface FastingMealRequirement {
  memberId: ID;
  memberName: string;
  mealTime: MealTime;
  suggestion: string;
  allowedFoodsUsed: string[];
  avoidedFoods: string[];
  notes: string[];
}

export interface CostEstimate {
  mealCost: Money;
  dailyCost: Money;
}

export interface FamilyMealPlan {
  mealPlanId: ID;
  familyId: ID;
  planType: PlanType;
  targetDate: string;
  expiresAt: string;
  retentionPolicy: {
    detailedHistoryDays: number;
    userMessage: string;
    retainedLongTermSignals: string[];
  };
  commonMeal: CommonMeal;
  memberCustomizations: MemberCustomization[];
  preferenceResolution?: PreferenceResolution;
  fruits: FruitRecommendation[];
  hydration: HydrationRecommendation[];
  estimatedCost: CostEstimate;
  groceryItems: GroceryItem[];
  mealAttendance: MealAttendanceEntry[];
  mealIngredientRequirements: IngredientRequirement[];
  dailyGroceryRequirements: IngredientRequirement[];
  fastingMealRequirements: FastingMealRequirement[];
  familySatisfactionScore: {
    score: number;
    explanation: string;
  };
  warnings: string[];
  disclaimer: string;
  createdAt: string;
  updatedAt: string;
}

export type WeeklyMealPlanStatus = "planned" | "selected" | "changed" | "locked" | "completed";

export interface WeeklyMealPlanSlot {
  slotId: ID;
  date: string;
  day: "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday";
  mealTime: MealTime;
  primaryOption: FamilyMealPlan;
  alternatives: MealAlternativeOption[];
  selectedOption: FamilyMealPlan;
  originalMealName: string;
  selectedMealName: string;
  actualMealName?: string;
  status: WeeklyMealPlanStatus;
  userChangeReason?: MealReplacementReason | string;
  lockedAt?: string;
  updatedAt: string;
}

export type ProcurementPurchaseWindow =
  | "buy_this_weekend"
  | "buy_monday_tuesday"
  | "buy_midweek"
  | "buy_later_this_week"
  | "buy_day_before"
  | "buy_same_day";

export interface WeeklyGroceryRequirement {
  itemId: ID;
  name: string;
  category: Ingredient["category"];
  totalQuantity: string;
  quantityToPurchase: string;
  purchaseWindow: "buy_in_advance" | "buy_fresh";
  procurementWindow?: ProcurementPurchaseWindow;
  storageCharacteristic?:
  | "shelf_stable"
  | "longer_keeping_produce"
  | "fresh_short_window"
  | "leafy_or_highly_perishable"
  | "dairy_or_chilled"
  | "protein_or_non_veg"
  | "other";
  purchasePriority?: "high" | "medium" | "low";
  plannedConsumptionDates?: string[];
  pantryQuantity?: string;
  remainingQuantity?: string;
  freshnessNote?: string;
  estimatedCost: Money;
  mealReferences: Array<{ date: string; mealTime: MealTime; mealName: string }>;
}

export interface ProcurementScheduleGroup {
  groupId: ID;
  title: string;
  description: string;
  recommendedPurchaseDate?: string;
  recommendedWindow: ProcurementPurchaseWindow;
  items: WeeklyGroceryRequirement[];
}

export interface TomorrowIngredientReminder {
  date: string;
  meals: Array<{
    mealTime: MealTime;
    mealName: string;
    items: WeeklyGroceryRequirement[];
  }>;
  stillToArrange: WeeklyGroceryRequirement[];
}

export interface SabSewaShoppingRequirement {
  shoppingDate: string;
  itemCategory: Ingredient["category"];
  itemName: string;
  requiredQuantity: string;
  unit?: string;
  preferredPurchaseWindow: ProcurementPurchaseWindow;
}

export interface WeeklyFamilyMealPlan {
  weekPlanId: ID;
  familyId: ID;
  userId?: ID;
  weekStartDate: string;
  weekEndDate: string;
  timezone: string;
  preferredLanguage: string;
  planVersion: number;
  generatedAt: string;
  updatedAt: string;
  status: "active" | "archived";
  days: Array<{
    date: string;
    day: WeeklyMealPlanSlot["day"];
    meals: WeeklyMealPlanSlot[];
  }>;
  weeklyGroceryRequirements: WeeklyGroceryRequirement[];
  procurementSchedule?: ProcurementScheduleGroup[];
  tomorrowIngredientReminder?: TomorrowIngredientReminder;
  sabSewaShoppingRequirement?: SabSewaShoppingRequirement[];
  procurementSafetyNote?: string;
  changeLog: Array<{
    changedAt: string;
    date: string;
    mealTime: MealTime;
    originalMealName: string;
    selectedMealName: string;
    reason?: string;
    planVersion: number;
  }>;
}

export interface CreateFamilyInput {
  name: string;
  country: string;
  state: string;
  city: string;
  dietPreference: FamilyDietPreference;
  cuisinePreferences: string[];
  cuisineProfile?: FamilyCuisineProfile;
  weeklyFoodRoutineStatus?: WeeklyFoodRoutineStatus;
  weeklyFoodRoutine?: DayWiseFoodRoutinePreference[];
  mealTypePreferences?: MealTypePreferenceProfile;
  recentMealHistory?: RecentMealHistoryDay[];
  mealTimings?: MealTimingPattern;
  mealSchedule?: MealTimetableSchedule;
  favoriteFoodStyles?: string[];
  customFavoriteFoods?: string[];
  favoriteFoodTags?: string[];
  nonVegPreferredFoods?: string[];
  cultureProfile?: CulturalFoodProfile;
  budget: BudgetProfile;
  kitchenProfile: KitchenProfile;
  subscriptionPlan: SubscriptionPlan;
}

export type CreateFamilyMemberInput = Omit<FamilyMember, "memberId" | "familyId">;

export interface CreateFamilyRequest {
  userId: ID;
  family: CreateFamilyInput;
  members: CreateFamilyMemberInput[];
}

export interface DayAttendancePlan {
  breakfast: Record<string, MemberMealAttendanceStatus>;
  lunch: Record<string, MemberMealAttendanceStatus>;
  snacks: Record<string, MemberMealAttendanceStatus>;
  dinner: Record<string, MemberMealAttendanceStatus>;
  guestCountBySlot?: Partial<Record<MealSlot, number>>;
}

export interface TodayAttendanceItem {
  memberId: string;
  status: MemberMealAttendanceStatus;
}

export interface CreateMealPlanRequest {
  familyId: ID;
  userId?: string;
  planType: PlanType;
  mealTime?: MealTime;
  mealSlot?: MealSlot;
  scheduledTime?: string;
  mealTimeContext?: MealTimeContext;
  userLocalTime?: string;
  userTimeZone?: string;
  userPlanningMode?: UserPlanningMode;
  targetDate?: string;
  preferredLanguage?: string;
  userPromptOverride?: string;
  excludeDishes?: string[];
  availableIngredients?: string[];
  previousMeals?: string[];
  mealAttendance?: MealAttendanceEntry[];
  todayAttendance?: TodayAttendanceItem[];
  dayAttendancePlan?: DayAttendancePlan;
  isExceptionToday?: boolean;
  customMealTimings?: MealTimingPattern;
  mealSchedule?: MealTimetableSchedule;
  highTeaPreference?: HighTeaPreference;
}

export interface ReplaceMealRequest {
  reason: MealReplacementReason;
  unavailableIngredients?: string[];
  dislikedFoods?: string[];
  previousMeals?: string[];
  userPromptOverride?: string;
  excludeDishes?: string[];
  preferredLanguage?: string;
}

export interface FeedbackRequest {
  userId?: string;
  mealPlanId: ID;
  memberId?: ID;
  mealName?: string;
  mealTime?: string;
  outcome?: "cooked" | "liked" | "rejected";
  rating: "loved" | "good" | "average" | "dont_suggest_again";
  notes?: string;
}

export interface ApiError {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}