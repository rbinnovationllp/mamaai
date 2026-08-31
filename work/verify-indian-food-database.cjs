const fs = require("node:fs");
const Module = require("node:module");
const path = require("node:path");
const ts = require("typescript");

const root = path.resolve(__dirname, "..");
const originalResolve = Module._resolveFilename;

Module._resolveFilename = function resolveAlias(request, parent, isMain, options) {
  if (request.startsWith("@/")) {
    return originalResolve.call(this, path.join(root, request.slice(2)), parent, isMain, options);
  }
  return originalResolve.call(this, request, parent, isMain, options);
};

require.extensions[".ts"] = function loadTs(module, filename) {
  const source = fs.readFileSync(filename, "utf8");
  const output = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
    },
  }).outputText;
  module._compile(output, filename);
};

const { indianFoodCandidatesFor } = require("../lib/food/indian-food-database.ts");

function family(state, dietPreference, options = {}) {
  return {
    familyId: `fam-${state}`,
    userId: "verify",
    name: `${state} family`,
    country: "India",
    state,
    city: options.city ?? state,
    dietPreference,
    cuisinePreferences: options.cuisinePreferences ?? [state],
    indianRegionalPreferences: options.indianRegionalPreferences ?? [],
    nonVegPreferredFoods: options.nonVegPreferredFoods ?? [],
    cultureProfile: options.cultureProfile,
    budget: { type: "daily", amount: 700, currency: "INR", priority: "flexible" },
    kitchenProfile: { equipment: ["Gas stove", "Pressure cooker"], cookingTimePreference: "30_to_60" },
    subscriptionPlan: "premium",
    createdAt: "2026-08-31T00:00:00.000Z",
    updatedAt: "2026-08-31T00:00:00.000Z",
  };
}

const scenarios = [
  ["South vegetarian", family("Karnataka", "vegetarian", { cuisinePreferences: ["North Karnataka"] }), "lunch"],
  ["East vegetarian", family("West Bengal", "vegetarian", { cuisinePreferences: ["Bengali"] }), "lunch"],
  ["West vegetarian", family("Gujarat", "vegetarian", { cuisinePreferences: ["Gujarati"] }), "dinner"],
  ["North vegetarian", family("Punjab", "vegetarian", { cuisinePreferences: ["Punjabi"] }), "lunch"],
  ["Central vegetarian", family("Madhya Pradesh", "vegetarian", { cuisinePreferences: ["Malwa"] }), "lunch"],
  ["North-East fish", family("Assam", "non_vegetarian", { cuisinePreferences: ["Assamese"], nonVegPreferredFoods: ["fish"] }), "lunch"],
  ["Himalayan vegetarian", family("Uttarakhand", "vegetarian", { cuisinePreferences: ["Garhwali"] }), "lunch"],
  ["Eggatarian no meat", family("Tamil Nadu", "eggetarian", { cuisinePreferences: ["Chettinad"] }), "dinner"],
  ["Kerala chicken/fish", family("Kerala", "non_vegetarian", { cuisinePreferences: ["Kerala"], nonVegPreferredFoods: ["fish", "chicken"] }), "dinner"],
];

for (const [label, profile, mealTime] of scenarios) {
  const candidates = indianFoodCandidatesFor({
    family: profile,
    mealTime,
    recentMeals: [],
    targetDate: "2026-09-01",
  });
  const selected = candidates[0];
  if (!selected) throw new Error(`No candidate for ${label}`);
  if (profile.dietPreference === "eggetarian" && selected.foodPreferences.some((code) => code.startsWith("NV-"))) {
    throw new Error(`Eggatarian scenario returned meat/fish candidate: ${selected.typicalCombination}`);
  }
  console.log(`${label}: ${selected.region} -> ${selected.state} -> ${selected.subRegionOrCuisine} -> ${selected.typicalCombination} [${selected.foodPreferences.join(",")}; ${selected.mealStyle}]`);
}

const thirtyDay = new Set();
const karnataka = family("Karnataka", "vegetarian", { cuisinePreferences: ["Karnataka", "North Karnataka", "Udupi"] });
for (let day = 1; day <= 30; day += 1) {
  const targetDate = `2026-09-${String(day).padStart(2, "0")}`;
  const candidates = indianFoodCandidatesFor({
    family: karnataka,
    mealTime: day % 3 === 0 ? "breakfast" : day % 2 === 0 ? "dinner" : "lunch",
    recentMeals: [...thirtyDay].slice(-12),
    targetDate,
  });
  if (candidates[0]) thirtyDay.add(candidates[0].typicalCombination);
}

if (thirtyDay.size < 4) {
  throw new Error(`30-day Karnataka rotation was too repetitive: ${thirtyDay.size} unique meals`);
}

console.log(`30-day Karnataka rotation unique selected meals: ${thirtyDay.size}`);
