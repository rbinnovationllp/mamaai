import { z } from "zod";

export const moneySchema = z.object({
  amount: z.number().nonnegative(),
  currency: z.literal("INR")
});

export const budgetProfileSchema = z.object({
  type: z.enum(["daily", "weekly", "monthly", "none"]),
  amount: z.number().positive().optional(),
  currency: z.literal("INR")
});

export const kitchenProfileSchema = z.object({
  equipment: z.array(z.string().min(1)),
  cookingTimePreference: z.enum(["under_30", "30_to_60", "over_60"])
});

export const createFamilyInputSchema = z.object({
  name: z.string().min(2),
  country: z.string().min(2),
  state: z.string().min(2),
  city: z.string().min(2),
  dietPreference: z.enum(["vegetarian", "non_vegetarian", "semi_vegetarian", "eggetarian", "mixed"]),
  cuisinePreferences: z.array(z.string().min(1)),
  budget: budgetProfileSchema,
  kitchenProfile: kitchenProfileSchema,
  subscriptionPlan: z.enum(["family_starter", "family_premium", "family_plus"])
});

export const createFamilyMemberInputSchema = z.object({
  name: z.string().min(1),
  relationship: z.string().min(1),
  age: z.number().int().min(0).max(120),
  gender: z.enum(["female", "male", "other", "prefer_not_to_say"]),
  heightCm: z.number().positive().optional(),
  weightKg: z.number().positive().optional(),
  activityLevel: z.enum(["sedentary", "light", "moderate", "heavy", "athlete"]),
  goals: z.array(z.string()),
  dietType: z.enum(["vegetarian", "non_vegetarian", "eggitarian", "vegan", "jain", "satvik", "other"]),
  likes: z.array(z.string()),
  dislikes: z.array(z.string()),
  allergies: z.array(z.string()),
  healthConditions: z.array(z.string()),
  doctorRestrictions: z.array(z.string()),
  specialStatuses: z.array(z.string())
});

export const createFamilyRequestSchema = z.object({
  userId: z.string().min(1),
  family: createFamilyInputSchema,
  members: z.array(createFamilyMemberInputSchema).min(1)
});

export const ingredientSchema = z.object({
  name: z.string().min(1),
  quantity: z.string().min(1),
  category: z.enum(["vegetables", "fruits", "grains", "pulses", "dairy", "protein", "spices", "other"]),
  estimatedCost: moneySchema
});

export const nutritionEstimateSchema = z.object({
  caloriesKcal: z.number().nonnegative(),
  proteinGrams: z.number().nonnegative(),
  carbsGrams: z.number().nonnegative(),
  fatGrams: z.number().nonnegative(),
  fiberGrams: z.number().nonnegative(),
  basis: z.string().min(1),
  dataSource: z.string().min(1),
  confidence: z.enum(["low", "medium", "high"])
});

export const familyMealPlanSchema = z.object({
  mealPlanId: z.string().min(1),
  familyId: z.string().min(1),
  planType: z.enum(["daily", "weekly", "monthly"]),
  targetDate: z.string().min(1),
  commonMeal: z.object({
    mealId: z.string().min(1),
    name: z.string().min(1),
    mealTime: z.enum(["breakfast", "lunch", "dinner", "snack"]),
    description: z.string().min(1),
    ingredients: z.array(ingredientSchema).min(1),
    prepTimeMinutes: z.number().int().positive(),
    difficulty: z.enum(["easy", "medium", "hard"]),
    regionFit: z.string().min(1),
    nutritionIntent: z.string().min(1),
    nutritionEstimate: nutritionEstimateSchema
  }),
  memberCustomizations: z.array(z.object({
    memberId: z.string().min(1),
    memberName: z.string().min(1),
    modification: z.string().min(1),
    portionGuidance: z.string().min(1),
    safetyNotes: z.array(z.string())
  })).min(1),
  fruits: z.array(z.object({
    memberId: z.string().min(1),
    memberName: z.string().min(1),
    fruit: z.string().min(1),
    portion: z.string().min(1),
    timing: z.string().min(1),
    alternatives: z.array(z.string()),
    caution: z.string().optional()
  })).min(1),
  hydration: z.array(z.object({
    memberId: z.string().min(1),
    memberName: z.string().min(1),
    guidance: z.string().min(1),
    suitableBeverages: z.array(z.string()),
    caution: z.string().optional()
  })).min(1),
  estimatedCost: z.object({
    mealCost: moneySchema,
    dailyCost: moneySchema
  }),
  groceryItems: z.array(z.object({
    itemId: z.string().min(1),
    name: z.string().min(1),
    category: z.enum(["vegetables", "fruits", "grains", "pulses", "dairy", "protein", "spices", "other"]),
    quantity: z.string().min(1),
    estimatedCost: moneySchema,
    pantryQuantity: z.string().optional(),
    quantityToPurchase: z.string().min(1)
  })).min(1),
  familySatisfactionScore: z.object({
    score: z.number().min(0).max(100),
    explanation: z.string().min(1)
  }),
  warnings: z.array(z.string()),
  disclaimer: z.string().min(1),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1)
});

export const mealTimeContextSchema = z.object({
  timeZone: z.string().min(1),
  locale: z.string().optional(),
  country: z.string().optional(),
  region: z.string().optional(),
  city: z.string().optional(),
  localHour: z.number().int().min(0).max(23).optional()
});

export const createMealPlanRequestSchema = z.object({
  familyId: z.string().min(1),
  planType: z.enum(["daily", "weekly", "monthly"]),
  mealTime: z.enum(["breakfast", "lunch", "dinner", "snack"]).optional(),
  mealTimeContext: mealTimeContextSchema.optional(),
  userPlanningMode: z.enum(["new_user_next_meal", "returning_user_weekly_editable"]).optional(),
  targetDate: z.string().optional(),
  availableIngredients: z.array(z.string()).optional(),
  previousMeals: z.array(z.string()).optional()
});

export const replaceMealRequestSchema = z.object({
  reason: z.enum([
    "dont_like_it",
    "ate_recently",
    "too_expensive",
    "ingredient_unavailable",
    "too_difficult",
    "takes_too_long",
    "health_concern"
  ]),
  unavailableIngredients: z.array(z.string()).optional(),
  dislikedFoods: z.array(z.string()).optional()
});

export const feedbackRequestSchema = z.object({
  mealPlanId: z.string().min(1),
  memberId: z.string().optional(),
  rating: z.enum(["loved", "good", "average", "dont_suggest_again"]),
  notes: z.string().optional()
});

export const revenueCatWebhookSchema = z.object({
  event: z.object({
    type: z.string().min(1),
    app_user_id: z.string().min(1).optional(),
    original_app_user_id: z.string().optional(),
    product_id: z.string().optional(),
    entitlement_ids: z.array(z.string()).optional(),
    expiration_at_ms: z.number().optional()
  })
});
