// lib/ai/nutrition-validator.ts
import type { CommonMeal, Ingredient, FamilyMember, Family } from "@/lib/shared/contracts";

export interface MealNutritionalScore {
    isBalanced: boolean;
    hasAdequateProtein: boolean;
    hasAdequateFibre: boolean;
    hasVegetableDiversity: boolean;
    pulseCategory: string | null;
    grainCategory: string | null;
    proteinSources: string[];
    fibreSources: string[];
    improvementSuggestions: string[];
}

const PULSE_TAXONOMY: Record<string, string[]> = {
    toor_arhar: ["toor", "arhar", "tuvar", "pigeon pea", "sambar dal"],
    moong: ["moong", "mung", "green gram", "yellow moong", "split moong"],
    masoor: ["masoor", "red lentil", "brown lentil"],
    chana: ["chana dal", "bengal gram", "kala chana", "chickpea flour", "besan", "kabuli chana", "chole"],
    rajma: ["rajma", "kidney bean"],
    urad: ["urad", "black gram", "white urad", "dal makhani"],
    lobia: ["lobia", "black eyed pea", "cowpea"],
    matar: ["green peas", "white peas", "matar", "vatana"],
    soya_paneer: ["paneer", "tofu", "soya", "soy chunks", "edamame"],
    non_veg: ["egg", "chicken", "fish", "mutton", "prawns"]
};

const GRAIN_TAXONOMY: Record<string, string[]> = {
    wheat: ["whole wheat", "roti", "chapati", "paratha", "atta", "dalia"],
    rice: ["rice", "pulao", "biryani", "brown rice", "jeera rice"],
    millets: ["ragi", "jowar", "bajra", "foxtail", "little millet", "kodo"],
    oats_poha: ["poha", "oats", "flattened rice", "suji", "rava"]
};

export function classifyIngredients(ingredients: Ingredient[]) {
    const ingNames = ingredients.map(i => i.name.toLowerCase());

    let detectedPulse: string | null = null;
    const detectedProteinSources: string[] = [];
    const detectedFibreSources: string[] = [];

    for (const [category, keywords] of Object.entries(PULSE_TAXONOMY)) {
        if (keywords.some(k => ingNames.some(ing => ing.includes(k)))) {
            detectedPulse = category;
            detectedProteinSources.push(category);
        }
    }

    ingredients.forEach(ing => {
        if (ing.category === "vegetables" || ing.category === "fruits" || ing.category === "pulses") {
            detectedFibreSources.push(ing.name);
        }
        if (ing.category === "dairy" && (ing.name.toLowerCase().includes("curd") || ing.name.toLowerCase().includes("paneer"))) {
            detectedProteinSources.push(ing.name);
        }
    });

    let detectedGrain: string | null = null;
    for (const [category, keywords] of Object.entries(GRAIN_TAXONOMY)) {
        if (keywords.some(k => ingNames.some(ing => ing.includes(k)))) {
            detectedGrain = category;
            break;
        }
    }

    return {
        detectedPulse,
        detectedGrain,
        proteinSources: [...new Set(detectedProteinSources)],
        fibreSources: [...new Set(detectedFibreSources)]
    };
}

export function evaluateMealNutritionalBalance(
    meal: CommonMeal,
    family: Family,
    members: FamilyMember[],
    recentPulseHistory: string[] = []
): MealNutritionalScore {
    const { detectedPulse, detectedGrain, proteinSources, fibreSources } = classifyIngredients(meal.ingredients);
    const suggestions: string[] = [];

    const hasAdequateProtein = proteinSources.length >= 1;
    const hasVegetableDiversity = fibreSources.length >= 2;
    const hasAdequateFibre = fibreSources.length >= 2 || detectedGrain === "millets" || detectedGrain === "wheat";

    if (!hasAdequateProtein) {
        suggestions.push("Add a dedicated protein anchor (dal, legumes, paneer, sprouts, curd, egg, or lean meat).");
    }

    if (detectedPulse && recentPulseHistory.slice(-3).includes(detectedPulse)) {
        suggestions.push(`Rotate away from ${detectedPulse.replace("_", " ")} to increase legume diversity.`);
    }

    if (!hasVegetableDiversity) {
        suggestions.push("Include at least one seasonal vegetable or raw salad to boost dietary fibre and micronutrients.");
    }

    return {
        isBalanced: hasAdequateProtein && hasAdequateFibre && hasVegetableDiversity,
        hasAdequateProtein,
        hasAdequateFibre,
        hasVegetableDiversity,
        pulseCategory: detectedPulse,
        grainCategory: detectedGrain,
        proteinSources,
        fibreSources,
        improvementSuggestions: suggestions
    };
}