/** Versioned, conservative ingredient taxonomy. A match identifies a known risk; no match proves nothing is safe. */
export const FOOD_SAFETY_TAXONOMY_VERSION = "2026-10-19";

export type SafetyCategory = "allergen" | "animal" | "egg" | "jain_root" | "infant_hazard" | "pet_toxin";
export type SafetyMatch = { canonical: string; category: SafetyCategory };

type TaxonomyEntry = readonly [canonical: string, category: SafetyCategory, aliases: readonly string[]];

const entries: readonly TaxonomyEntry[] = [
  ["peanut", "allergen", ["peanut", "peanuts", "groundnut", "moongphali", "mungfali", "मूंगफली", "ಕಡಲೆಕಾಯಿ"]],
  ["milk", "allergen", ["milk", "dairy", "casein", "whey", "butter", "ghee", "paneer", "पनीर", "curd", "yogurt", "yoghurt", "दूध", "दही", "छाछ", "ಹಾಲು"]],
  ["egg", "egg", ["egg", "eggs", "anda", "अंडा", "अंडे", "ಮೊಟ್ಟೆ"]],
  ["onion", "jain_root", ["onion", "pyaz", "pyaaz", "प्याज", "ಈರುಳ್ಳಿ"]],
  ["garlic", "jain_root", ["garlic", "lahsun", "lehsun", "लहसुन", "ಬೆಳ್ಳುಳ್ಳಿ"]],
  ["potato", "jain_root", ["potato", "aloo", "आलू", "ಆಲೂಗಡ್ಡೆ"]],
  ["carrot", "jain_root", ["carrot", "gajar", "गाजर", "ಕ್ಯಾರೆಟ್"]],
  ["chicken", "animal", ["chicken", "murgh", "murga", "मुर्गा", "चिकन", "ಕೋಳಿ"]],
  ["fish", "animal", ["fish", "machhli", "मछली", "ಮೀನು"]],
  ["meat", "animal", ["mutton", "goat", "beef", "pork", "meat", "lamb", "seafood"]],
  ["honey", "infant_hazard", ["honey", "shahad", "शहद", "ಜೇನು"]],
  ["whole_nuts", "infant_hazard", ["whole nuts", "whole nut", "nuts whole"]],
  ["whole_grapes", "infant_hazard", ["whole grapes", "whole grape"]],
  ["onion", "pet_toxin", ["onion", "pyaz", "pyaaz", "प्याज", "ಈರುಳ್ಳಿ"]],
  ["garlic", "pet_toxin", ["garlic", "lahsun", "lehsun", "लहसुन", "ಬೆಳ್ಳುಳ್ಳಿ"]],
  ["chocolate", "pet_toxin", ["chocolate", "cocoa", "चॉकलेट"]],
  ["grapes", "pet_toxin", ["grape", "grapes", "raisins", "किशमिश"]],
  ["xylitol", "pet_toxin", ["xylitol", "birch sugar"]],
];

export function normalizeIngredient(value: string): string {
  return value.normalize("NFKD").toLocaleLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim().replace(/\s+/g, " ");
}

function containsAlias(text: string, alias: string): boolean {
  const normalizedAlias = normalizeIngredient(alias);
  return text === normalizedAlias || ` ${text} `.includes(` ${normalizedAlias} `);
}

/** Exact token/phrase matching avoids false positives such as matching `nut` inside `coconut`. */
export function classifyIngredient(value: string): SafetyMatch[] {
  const text = normalizeIngredient(value);
  if (!text) return [];
  return entries
    .filter(([, , aliases]) => aliases.some((alias) => containsAlias(text, alias)))
    .map(([canonical, category]) => ({ canonical, category }));
}

export function restrictionCanonicals(value: string): string[] {
  const normalized = normalizeIngredient(value);
  return [...new Set([normalized, ...classifyIngredient(value).map((match) => match.canonical)])].filter(Boolean);
}

/** Labels without a complete ingredient list require composition and cross-contact confirmation. */
export function ingredientIsAmbiguous(value: string): boolean {
  const text = normalizeIngredient(value);
  return !text || /^(mixed|masala|spices|seasoning|flavoring|proprietary blend|unknown)( |$)/.test(text);
}

