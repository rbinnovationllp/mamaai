/**
 * Provider-independent contract. It is deliberately inert: deterministic
 * planning remains authoritative until an owner-approved adapter is enabled.
 */
export type PlanningRestriction = { kind: "allergy" | "diet" | "fasting" | "medical_caution" | "age_safety"; value: string; mandatory: boolean };
export type EligibleRecipeCandidate = { recipeId: string; name: string; ingredients: Array<{ id?: string; name: string; quantity?: string; unit?: string }>; tags: string[]; preparationMinutes?: number; estimatedCostInr?: number; tiffinSuitable?: boolean; seasonality?: { label: string; confidence: "verified" | "estimated" | "unknown" } };
export type HybridPlanningInput = { familyId: string; weekStartDate: string; locale: "en" | "hi" | "kn"; members: Array<{ memberId: string; age?: number; preferences: string[]; restrictions: PlanningRestriction[]; tiffinDays: string[] }>; pantry: Array<{ ingredientId?: string; name: string; quantity: number; unit: string }>; budget?: { preference: string; amount?: number; currency: "INR" }; candidates: EligibleRecipeCandidate[]; mandatoryRestrictions: PlanningRestriction[] };
export type HybridRecommendation = { day: string; mealTime: string; recipeId: string; explanation: string; confidence: "high" | "medium" | "low"; uncertainty: string[]; groceryInputs: Array<{ ingredientId?: string; name: string; quantity?: string; unit?: string }> };
export interface HybridPlanningProvider { recommend(input: HybridPlanningInput): Promise<HybridRecommendation[]>; }

/** Rejects unknown candidates and missing mandatory restrictions before any output reaches the existing safety validator. */
export function validateHybridRecommendations(input: HybridPlanningInput, output: HybridRecommendation[]) {
  const ids = new Set(input.candidates.map((candidate) => candidate.recipeId));
  return output.every((recommendation) => ids.has(recommendation.recipeId) && recommendation.explanation.trim().length > 0 && recommendation.uncertainty.every(Boolean));
}
