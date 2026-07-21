export type ID = string;

export type Gender = "female" | "male" | "other" | "prefer_not_to_say";

export type ActivityLevel = "sedentary" | "light" | "moderate" | "heavy" | "athlete";

export type DietType = "vegetarian" | "non_vegetarian" | "eggitarian" | "vegan" | "jain" | "satvik" | "other";

export type FamilyDietPreference = "vegetarian" | "non_vegetarian" | "semi_vegetarian" | "eggetarian" | "mixed";

export type PlanType = "daily" | "weekly" | "monthly";

export type MealTime = "breakfast" | "lunch" | "dinner" | "snack";

export type UserPlanningMode = "new_user_next_meal" | "returning_user_weekly_editable";

export interface MealTimeContext {
  timeZone: string;
  locale?: string;
  country?: string;
  region?: string;
  city?: string;
  localHour?: number;
}

export type SubscriptionPlan = "family_starter" | "family_premium" | "family_plus";

export type EntitlementSource = "demo_judge_access" | "local_demo" | "revenuecat" | "manual_admin";

export interface SubscriptionPlanDefinition {
  plan: SubscriptionPlan;
  displayName: string;
  priceMonthlyInr: number;
  memberLimit: number;
  revenueCatEntitlementId: string;
  revenueCatProductId: string;
  googlePlayProductId: string;
}

export interface SubscriptionEntitlement {
  userId: ID;
  plan: SubscriptionPlan;
  memberLimit: number;
  source: EntitlementSource;
  isActive: boolean;
  bypassPaymentForDemo: boolean;
  revenueCatCustomerId?: string;
  expiresAt?: string;
  checkedAt: string;
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
  currency: "INR";
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
  type: "daily" | "weekly" | "monthly" | "none";
  amount?: number;
  currency: "INR";
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
  budget: BudgetProfile;
  kitchenProfile: KitchenProfile;
  subscriptionPlan: SubscriptionPlan;
  createdAt: string;
  updatedAt: string;
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

export interface CommonMeal {
  mealId: ID;
  name: string;
  mealTime: MealTime;
  description: string;
  ingredients: Ingredient[];
  prepTimeMinutes: number;
  difficulty: "easy" | "medium" | "hard";
  regionFit: string;
  nutritionIntent: string;
  nutritionEstimate: NutritionEstimate;
  recipe: RecipeDetails;
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

export interface CostEstimate {
  mealCost: Money;
  dailyCost: Money;
}

export interface FamilyMealPlan {
  mealPlanId: ID;
  familyId: ID;
  planType: PlanType;
  targetDate: string;
  commonMeal: CommonMeal;
  memberCustomizations: MemberCustomization[];
  preferenceResolution?: PreferenceResolution;
  fruits: FruitRecommendation[];
  hydration: HydrationRecommendation[];
  estimatedCost: CostEstimate;
  groceryItems: GroceryItem[];
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

export interface CreateMealPlanRequest {
  familyId: ID;
  planType: PlanType;
  mealTime?: MealTime;
  mealTimeContext?: MealTimeContext;
  userPlanningMode?: UserPlanningMode;
  targetDate?: string;
  availableIngredients?: string[];
  previousMeals?: string[];
}

export interface ReplaceMealRequest {
  reason: MealReplacementReason;
  unavailableIngredients?: string[];
  dislikedFoods?: string[];
}

export interface FeedbackRequest {
  mealPlanId: ID;
  memberId?: ID;
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
