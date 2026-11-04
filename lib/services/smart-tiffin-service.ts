import type { CustomerFamilyMemberProfile } from "@/lib/repositories/customer-profile-repository";
import { normalizeIngredientKey, type PantryItemRecord } from "@/lib/repositories/pantry-repository";

export type SmartTiffinType = "school_tiffin" | "office_tiffin" | "general";
export type RecipeQuantityValidationStatus = "VERIFIED" | "DRAFT" | "INCOMPLETE";
export interface RecipeQuantitySpecification {
  version: "draft-v1";
  status: RecipeQuantityValidationStatus;
  servings?: number;
  ingredients: Array<{ name: string; quantity?: number; unit?: string }>;
  note: string;
}

export interface SmartTiffinRequest {
  type: SmartTiffinType;
  member?: CustomerFamilyMemberProfile;
  pantry: PantryItemRecord[];
  manualIngredients: string[];
  maxMinutes: 5 | 10 | 15;
  onlyAvailable: boolean;
}

export interface SmartTiffinSuggestion {
  id: string;
  name: string;
  ingredients: string[];
  availableIngredients: string[];
  missingIngredients: string[];
  prepMinutes: number;
  cookingMinutes: number;
  totalMinutes: number;
  requiresPreprepared: string[];
  instructions: string[];
  packingAdvice: string;
  safetyNote?: string;
  suitability: string;
  quantitySpecification: RecipeQuantitySpecification;
}

type Recipe = Omit<SmartTiffinSuggestion, "availableIngredients" | "missingIngredients" | "suitability"> & { tags: string[] };

const incompleteQuantitySpecification = (ingredients: string[]): RecipeQuantitySpecification => ({
  version: "draft-v1",
  status: "INCOMPLETE",
  ingredients: ingredients.map((name) => ({ name })),
  note: "Ingredient quantities, units and servings are not yet supported by a reviewed specification. This recipe cannot update grocery calculations or a weekly plan.",
});

const recipes: Recipe[] = [
  { id: "paneer-sandwich", name: "Paneer vegetable sandwich", ingredients: ["bread", "paneer", "tomato", "cucumber"], prepMinutes: 10, cookingMinutes: 10, totalMinutes: 20, requiresPreprepared: [], instructions: ["Crumble paneer and chop vegetables.", "Fill bread and toast if desired."], packingAdvice: "Pack once cooled. Perishable fillings need an insulated lunch bag if held for long.", tags: ["paneer", "sandwich"], quantitySpecification: incompleteQuantitySpecification(["bread", "paneer", "tomato", "cucumber"]) },
  { id: "roti-roll", name: "Paneer bhurji roti roll", ingredients: ["prepared roti", "paneer", "onion"], prepMinutes: 5, cookingMinutes: 10, totalMinutes: 15, requiresPreprepared: ["prepared roti"], instructions: ["Sauté onion and crumble paneer.", "Roll in already prepared roti."], packingAdvice: "Wrap firmly; serve promptly. Do not claim room-temperature safety for perishable fillings.", tags: ["paneer", "roll"], quantitySpecification: incompleteQuantitySpecification(["prepared roti", "paneer", "onion"]) },
  { id: "curd-rice", name: "Curd rice with cucumber", ingredients: ["cooked rice", "curd", "cucumber"], prepMinutes: 5, cookingMinutes: 0, totalMinutes: 5, requiresPreprepared: ["cooked rice"], instructions: ["Mix cooled cooked rice, curd and cucumber."], packingAdvice: "Use an insulated container with a cold pack when refrigeration is unavailable.", tags: ["rice", "soft"], quantitySpecification: incompleteQuantitySpecification(["cooked rice", "curd", "cucumber"]) },
  { id: "besan-chilla", name: "Vegetable besan chilla", ingredients: ["besan", "onion", "tomato"], prepMinutes: 10, cookingMinutes: 10, totalMinutes: 20, requiresPreprepared: [], instructions: ["Whisk besan batter and fold in finely chopped vegetables.", "Cook thin chillas on a hot pan."], packingAdvice: "Pack after cooling slightly to avoid condensation.", tags: ["chilla", "vegetable"], quantitySpecification: incompleteQuantitySpecification(["besan", "onion", "tomato"]) },
  { id: "idli-stir-fry", name: "Idli stir-fry", ingredients: ["prepared idli", "onion", "tomato"], prepMinutes: 3, cookingMinutes: 6, totalMinutes: 9, requiresPreprepared: ["prepared idli"], instructions: ["Cut prepared idlis.", "Quickly stir-fry with vegetables."], packingAdvice: "Pack in a dry container; cut pieces for younger children.", tags: ["idli"], quantitySpecification: incompleteQuantitySpecification(["prepared idli", "onion", "tomato"]) },
  { id: "vegetable-poha", name: "Vegetable poha", ingredients: ["poha", "onion", "peas"], prepMinutes: 10, cookingMinutes: 5, totalMinutes: 15, requiresPreprepared: [], instructions: ["Rinse ready-to-cook poha briefly.", "Cook with vegetables until just tender."], packingAdvice: "Pack warm in a vented insulated container.", tags: ["poha", "vegetable"], quantitySpecification: incompleteQuantitySpecification(["poha", "onion", "peas"]) },
];

function usablePantryItems(items: PantryItemRecord[]) {
  const today = new Date().toISOString().slice(0, 10);
  return items.filter((item) => item.quantity > 0 && item.status !== "OUT_OF_STOCK" && (!item.expiryDate || item.expiryDate >= today));
}

function conflicts(recipe: Recipe, member?: CustomerFamilyMemberProfile) {
  const avoid = [...(member?.allergies ?? []), ...(member?.doctorAdvisedRestrictions ?? []), ...(member?.dislikes ?? [])]
    .map(normalizeIngredientKey);
  return recipe.ingredients.some((ingredient) => avoid.some((term) => term && normalizeIngredientKey(ingredient).includes(term)));
}

export function generateSmartTiffinSuggestions(request: SmartTiffinRequest): SmartTiffinSuggestion[] {
  const available = new Set([...usablePantryItems(request.pantry).map((item) => item.normalizedIngredientKey), ...request.manualIngredients.map(normalizeIngredientKey)]);
  return recipes
    .filter((recipe) => recipe.totalMinutes <= request.maxMinutes && !conflicts(recipe, request.member))
    .map((recipe) => {
      const availableIngredients = recipe.ingredients.filter((item) => available.has(normalizeIngredientKey(item)));
      const missingIngredients = recipe.ingredients.filter((item) => !available.has(normalizeIngredientKey(item)));
      return {
        ...recipe,
        availableIngredients,
        missingIngredients,
        suitability: request.member ? `Filtered for ${request.member.name}'s saved allergies, restrictions and preferences.` : "General quick vegetarian tiffin option.",
        safetyNote: request.type === "school_tiffin" && (request.member?.age ?? 99) < 6 ? "Cut food into age-appropriate pieces and check school food rules; this is not individualized safety clearance." : undefined,
      };
    })
    .filter((recipe) => !request.onlyAvailable || recipe.missingIngredients.length === 0)
    .sort((a, b) => a.missingIngredients.length - b.missingIngredients.length || a.totalMinutes - b.totalMinutes)
    .slice(0, 5);
}

export { usablePantryItems };
export const smartTiffinRecipeCatalogue = recipes;
