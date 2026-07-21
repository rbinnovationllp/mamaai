import { z } from "zod";

export const moneySchema = z.object({
  amount: z.number().nonnegative(),
  currency: z.literal("INR")
});

export const budgetProfileSchema = z.object({
  type: z.enum(["per_meal", "daily", "weekly", "monthly", "none"]),
  amount: z.number().positive().optional(),
  currency: z.literal("INR"),
  priority: z.enum(["strict", "flexible"]).optional(),
  preferLowCostMeals: z.boolean().optional()
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
  cuisinePreferenceWeights: z.array(z.object({
    cuisine: z.string().min(1),
    frequency: z.enum(["mostly", "often", "sometimes", "rarely"]),
    percentage: z.number().min(0).max(100).optional()
  })).optional(),
  indianRegionalPreferences: z.array(z.string()).optional(),
  localIngredientAvailabilityNotes: z.array(z.string()).optional(),
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
  foodAllergies: z.array(z.string()),
  ingredientAllergies: z.array(z.string()),
  foodDislikes: z.array(z.string()),
  dislikedMeals: z.array(z.string()),
  excludedIngredients: z.array(z.string()),
  dietaryRestrictions: z.array(z.string()),
  healthConditions: z.array(z.string()),
  doctorRestrictions: z.array(z.string()),
  specialStatuses: z.array(z.string()),
  fastingPreference: z.object({
    observesFasting: z.enum(["no", "yes", "occasionally"]),
    regularDays: z.array(z.string()),
    fastType: z.enum(["full_fast", "restricted_food_fast", "time_restricted", "custom"]).optional(),
    reasonOrTradition: z.string().optional(),
    allowedFoods: z.array(z.string()),
    avoidedFoods: z.array(z.string()),
    fastingMealCount: z.number().int().positive().optional(),
    fruitsAllowed: z.boolean(),
    dairyAllowed: z.boolean(),
    grainsRestricted: z.boolean(),
    customRules: z.array(z.string())
  }).optional()
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

export const mealTimeSchema = z.enum(["breakfast", "lunch", "dinner", "snack", "evening_snack", "high_tea"]);

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

export const recipeDetailsSchema = z.object({
  title: z.string().min(1),
  servings: z.number().int().positive(),
  prepTimeMinutes: z.number().int().nonnegative(),
  cookTimeMinutes: z.number().int().nonnegative(),
  difficulty: z.enum(["easy", "medium", "hard"]),
  ingredients: z.array(ingredientSchema).min(1),
  steps: z.array(z.string().min(1)).min(1),
  estimatedNutrition: nutritionEstimateSchema,
  estimatedCost: moneySchema,
  familyAdjustments: z.array(z.string()),
  alternativeIngredients: z.array(z.string()),
  videoRecommendation: z.object({
    label: z.string().min(1),
    url: z.string().optional(),
    note: z.string().min(1)
  }).optional()
});

export const preferenceResolutionSchema = z.object({
  hasSoftConflict: z.boolean(),
  prompt: z.string().min(1),
  affectedMembers: z.array(z.object({
    memberId: z.string().min(1),
    memberName: z.string().min(1),
    conflicts: z.array(z.string().min(1)),
    suggestedAlternative: z.string().min(1)
  })),
  recommendedOptionId: z.enum(["separate_alternative", "one_common_meal", "two_compatible_options"]),
  options: z.array(z.object({
    optionId: z.enum(["separate_alternative", "one_common_meal", "two_compatible_options"]),
    label: z.string().min(1),
    description: z.string().min(1),
    cookingImpact: z.string().min(1)
  })).min(1),
  minimumCookingStrategy: z.string().min(1)
});

export const recipeVideoSearchRequestSchema = z.object({
  dishName: z.string().min(1),
  country: z.string().optional(),
  region: z.string().optional(),
  preferredLanguage: z.string().optional(),
  cuisine: z.array(z.string()).optional(),
  dietaryPreference: z.enum(["vegetarian", "non_vegetarian", "semi_vegetarian", "eggetarian", "mixed"]).optional(),
  healthyPreparation: z.boolean().optional(),
  familyRequirements: z.array(z.string()).optional()
});

export const featureAvailabilityStatusSchema = z.enum(["fully_functional", "demo_test_only", "temporarily_disabled", "planned"]);

export const familyMealPlanSchema = z.object({
  mealPlanId: z.string().min(1),
  familyId: z.string().min(1),
  planType: z.enum(["daily", "weekly", "monthly"]),
  targetDate: z.string().min(1),
  expiresAt: z.string().min(1),
  retentionPolicy: z.object({
    detailedHistoryDays: z.number().int().positive(),
    userMessage: z.string().min(1),
    retainedLongTermSignals: z.array(z.string())
  }),
  commonMeal: z.object({
    mealId: z.string().min(1),
    name: z.string().min(1),
    mealTime: mealTimeSchema,
    description: z.string().min(1),
    ingredients: z.array(ingredientSchema).min(1),
    prepTimeMinutes: z.number().int().positive(),
    difficulty: z.enum(["easy", "medium", "hard"]),
    regionFit: z.string().min(1),
    nutritionIntent: z.string().min(1),
    nutritionEstimate: nutritionEstimateSchema,
    recipe: recipeDetailsSchema
  }),
  memberCustomizations: z.array(z.object({
    memberId: z.string().min(1),
    memberName: z.string().min(1),
    modification: z.string().min(1),
    portionGuidance: z.string().min(1),
    safetyNotes: z.array(z.string())
  })).min(1),
  preferenceResolution: preferenceResolutionSchema.optional(),
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
  mealAttendance: z.array(z.object({
    mealTime: mealTimeSchema,
    participatingMemberIds: z.array(z.string()),
    absentMemberIds: z.array(z.string()),
    fastingMemberIds: z.array(z.string()),
    guestCount: z.number().int().nonnegative(),
    enabled: z.boolean()
  })),
  mealIngredientRequirements: z.array(z.object({
    itemId: z.string().min(1),
    mealTime: z.union([mealTimeSchema, z.literal("daily_total")]),
    name: z.string().min(1),
    category: z.enum(["vegetables", "fruits", "grains", "pulses", "dairy", "protein", "spices", "other"]),
    baseQuantity: z.string().min(1),
    adjustedQuantity: z.string().min(1),
    quantityToPurchase: z.string().min(1),
    portionUnits: z.number().nonnegative(),
    estimatedCost: moneySchema,
    notes: z.array(z.string())
  })),
  dailyGroceryRequirements: z.array(z.object({
    itemId: z.string().min(1),
    mealTime: z.literal("daily_total"),
    name: z.string().min(1),
    category: z.enum(["vegetables", "fruits", "grains", "pulses", "dairy", "protein", "spices", "other"]),
    baseQuantity: z.string().min(1),
    adjustedQuantity: z.string().min(1),
    quantityToPurchase: z.string().min(1),
    portionUnits: z.number().nonnegative(),
    estimatedCost: moneySchema,
    notes: z.array(z.string())
  })),
  fastingMealRequirements: z.array(z.object({
    memberId: z.string().min(1),
    memberName: z.string().min(1),
    mealTime: mealTimeSchema,
    suggestion: z.string().min(1),
    allowedFoodsUsed: z.array(z.string()),
    avoidedFoods: z.array(z.string()),
    notes: z.array(z.string())
  })),
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
  mealTime: mealTimeSchema.optional(),
  mealTimeContext: mealTimeContextSchema.optional(),
  userPlanningMode: z.enum(["new_user_next_meal", "returning_user_weekly_editable"]).optional(),
  targetDate: z.string().optional(),
  availableIngredients: z.array(z.string()).optional(),
  previousMeals: z.array(z.string()).optional(),
  mealAttendance: z.array(z.object({
    mealTime: mealTimeSchema,
    participatingMemberIds: z.array(z.string()),
    absentMemberIds: z.array(z.string()),
    fastingMemberIds: z.array(z.string()),
    guestCount: z.number().int().nonnegative(),
    enabled: z.boolean()
  })).optional(),
  highTeaPreference: z.object({
    enabled: z.boolean(),
    days: z.array(z.string()),
    approximateTime: z.string(),
    usualParticipantMemberIds: z.array(z.string()),
    guestCount: z.number().int().nonnegative()
  }).optional()
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
