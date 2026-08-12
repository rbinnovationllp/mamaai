// lib/geminiService.ts
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

// 1. Proactive Human Meal Generator
export async function generateProactiveMealPlan(familyData: any, pantryStock: any) {
  const prompt = `You are MAMAAI, an intelligent family meal agent (www.mamaai.in).
  Generate a 7-day family meal plan balancing multiple needs: "One Family. Different Needs. One Intelligent Meal Plan."
  
  Family Profiles: ${JSON.stringify(familyData)}
  Available Pantry Inventory: ${JSON.stringify(pantryStock)}

  Rules:
  - Prioritize using items close to expiry in the pantry.
  - Do NOT include items listed under hard health allergies.
  - Accommodate picky eaters with gradual variation.
  - Return clean JSON matching: { "weeklyPlan": [{ "day": "Monday", "meals": { "breakfast": "", "lunch": "", "dinner": "" } }] }`;

  const response = await ai.models.generateContent({
    model: 'gemini-1.5-pro',
    contents: prompt,
    config: { responseMimeType: 'application/json' },
  });

  return JSON.parse(response.text || '{}');
}

// 2. Family Kitchen + Pet Safety Engine (Strict Separation)
export async function verifyPetIngredientSafety(petProfile: any, ingredientName: string) {
  const prompt = `You are the MAMAAI Pet Safety Guard Engine.
  Pet Profile: ${JSON.stringify(petProfile)}
  Ingredient to verify: ${ingredientName}

  Rules:
  - NEVER permit toxic foods for ${petProfile.species} (e.g., onions, garlic, chocolate, grapes, xylitol, heavy spices).
  - If pet has medical conditions (${petProfile.isMedicalDiet}), advise consulting a vet.
  - Return JSON: { "isSafe": boolean, "cautionWarning": "string", "servingSuggestion": "string" }`;

  const response = await ai.models.generateContent({
    model: 'gemini-1.5-flash',
    contents: prompt,
    config: { responseMimeType: 'application/json' },
  });

  return JSON.parse(response.text || '{}');
}

// 3. Global & Regional Cultural Meal Generator
export async function generateGlobalRegionalMealPlan(
  familyMembers: any[],
  cultureProfile: any,
  pantryStock: any[],
  proactiveSettings: any
) {
  const systemPrompt = `You are MAMAAI, an intelligent global meal agent (www.mamaai.in).
  Core USP: "One Family. Different Needs. One Intelligent Meal Plan."

  LOCATION & CULTURE CONTEXT:
  - Country of Residence: ${cultureProfile?.country || 'Global'}
  - State/Region: ${cultureProfile?.region || 'Not specified'}
  - Preferred Cuisines: ${JSON.stringify(cultureProfile?.preferredCuisines || ['Local / General'])}
  - How Family Eats: ${cultureProfile?.cookingStyle || 'MIX_FRESH_FROZEN'}
  - Available Appliances: ${JSON.stringify(cultureProfile?.availableAppliances || ['Stove', 'Microwave'])}

  CULTURAL DECISION ORDER:
  Family Preferences -> Country/Region -> Food Culture -> Dietary Rules -> Season -> Availability

  IMPORTANT COOKING HABIT RULES:
  - Do NOT assume the family cooks strictly from scratch if cookingStyle is MIX_FRESH_FROZEN or MOSTLY_FROZEN_READY.
  - Suggest hybrid meal plans: Store-bought/Frozen base + Fresh preparation (e.g., Frozen vegetable pasta + fresh spinach & grilled chicken).
  - Categorize grocery requirements clearly into FRESH, FROZEN_READY_TO_COOK, or PANTRY.

  Family Profiles: ${JSON.stringify(familyMembers)}
  Pantry Inventory: ${JSON.stringify(pantryStock)}
  Settings: ${JSON.stringify(proactiveSettings)}

  Return clean JSON output matching:
  {
    "weeklyPlan": [
      {
        "day": "Monday",
        "meals": {
          "breakfast": { "dish": "", "type": "FRESH | HYBRID | CONVENIENCE", "pantryUsed": [] },
          "lunch": { "dish": "", "type": "FRESH | HYBRID | CONVENIENCE", "pantryUsed": [] },
          "dinner": { "dish": "", "type": "FRESH | HYBRID | CONVENIENCE", "pantryUsed": [] }
        }
      }
    ],
    "mamaRegionalAdvice": "String tip on balancing ready bases with fresh produce"
  }`;

  const response = await ai.models.generateContent({
    model: 'gemini-1.5-pro',
    contents: systemPrompt,
    config: { responseMimeType: 'application/json' },
  });

  return JSON.parse(response.text || '{}');
}