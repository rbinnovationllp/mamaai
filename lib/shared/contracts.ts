export type ID = string;

export type Gender = "female" | "male" | "other" | "prefer_not_to_say";

export type ActivityLevel = "sedentary" | "light" | "moderate" | "heavy" | "athlete";

export type DietType = "vegetarian" | "non_vegetarian" | "eggitarian" | "vegan" | "jain" | "satvik" | "other";

export type FamilyDietPreference = "vegetarian" | "non_vegetarian" | "semi_vegetarian" | "eggetarian" | "vegan" | "mixed";

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

export type MemberMealAttendanceStatus = "home" | "tiffin" | "skip" | "fasting";

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

export interface Family {
  familyId: ID;
  userId: ID;
  name: string;
  country: string;
  state: string;
  city: string;
  dietPreference: FamilyDietPreference;
  cuisinePreferences: string[];
  cuisinePreferenceWeights?: CuisinePreferenceWeight[];
  indianRegionalPreferences?: string[];
  localIngredientAvailabilityNotes?: string[];
  weeklyFoodRoutineStatus?: WeeklyFoodRoutineStatus;
  weeklyFoodRoutine?: DayWiseFoodRoutinePreference[];
  mealTypePreferences?: MealTypePreferenceProfile;
  recentMealHistory?: RecentMealHistoryDay[];
  mealTimings?: MealTimingPattern;
  nonVegPreferredFoods?: string[];
  cultureProfile?: CulturalFoodProfile;
  budget: BudgetProfile;
  kitchenProfile: KitchenProfile;
  subscriptionPlan: SubscriptionPlan;
  createdAt: string;
  updatedAt: string;
}

export interface CuisinePreferenceWeight {
  cuisine: string;
  frequency: "mostly" | "often" | "sometimes" | "rarely";
  percentage?: number;
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

export interface CreateFamilyInput {
  name: string;
  country: string;
  state: string;
  city: string;
  dietPreference: FamilyDietPreference;
  cuisinePreferences: string[];
  weeklyFoodRoutineStatus?: WeeklyFoodRoutineStatus;
  weeklyFoodRoutine?: DayWiseFoodRoutinePreference[];
  mealTypePreferences?: MealTypePreferenceProfile;
  recentMealHistory?: RecentMealHistoryDay[];
  mealTimings?: MealTimingPattern;
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
  userPromptOverride?: string;
  excludeDishes?: string[];
  availableIngredients?: string[];
  previousMeals?: string[];
  mealAttendance?: MealAttendanceEntry[];
  todayAttendance?: TodayAttendanceItem[];
  dayAttendancePlan?: DayAttendancePlan;
  isExceptionToday?: boolean;
  customMealTimings?: MealTimingPattern;
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