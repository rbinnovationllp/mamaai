import { z } from "zod";

export const FAMILY_PROFILE_DOCUMENT_ACCEPT = ".png,.jpg,.jpeg,.webp,.pdf,image/png,image/jpeg,image/webp,application/pdf";
export const familyDocumentMemberSchema = z.object({
  name: z.string().trim().min(1), relation: z.string().trim().default("Family member"), age: z.number().int().min(0).max(120).optional(),
  dietType: z.enum(["vegetarian", "eggetarian", "non_vegetarian", "semi_vegetarian", "vegan", "other"]).optional(),
  favouriteFoods: z.array(z.string()).default([]), dislikes: z.array(z.string()).default([]), allergies: z.array(z.string()).default([]), allergyStatus: z.enum(["provided", "no_known", "unanswered"]).default("unanswered"),
  healthConditions: z.array(z.string()).default([]), doctorAdvice: z.array(z.string()).default([]), uncertain: z.array(z.string()).default([]),
});
export const familyDocumentImportSchema = z.object({
  household: z.object({ people: z.number().int().positive().optional(), mealsToPlan: z.array(z.string()).default([]), cuisines: z.array(z.string()).default([]), budget: z.string().optional(), cookingTime: z.string().optional(), dietaryPractices: z.array(z.string()).default([]) }),
  members: z.array(familyDocumentMemberSchema).max(10),
  mealHistory: z.array(z.object({ day: z.string(), breakfast: z.string().optional(), lunch: z.string().optional(), snacks: z.string().optional(), dinner: z.string().optional(), exceptions: z.string().optional(), uncertain: z.array(z.string()).default([]) })).max(7),
  uncertainties: z.array(z.string()).default([]), source: z.enum(["typed_text", "upload"]),
});
export type FamilyDocumentImport = z.infer<typeof familyDocumentImportSchema>;

const list = (value: string) => value.split(/[,;|]/).map((item) => item.trim()).filter(Boolean);
const valueAfter = (line: string) => line.replace(/^[^:=-]+[:=-]\s*/, "").trim();
const cleanKey = (line: string) => line.toLowerCase().replace(/[^a-z]/g, "");

/** Conservative text parser: absent and unclear fields stay absent for user review. */
export function parseFamilyProfileDocumentText(text: string): FamilyDocumentImport {
  const household: FamilyDocumentImport["household"] = { mealsToPlan: [], cuisines: [], dietaryPractices: [] };
  const members: FamilyDocumentImport["members"] = [];
  const mealHistory: FamilyDocumentImport["mealHistory"] = [];
  const uncertainties: string[] = [];
  let member: FamilyDocumentImport["members"][number] | undefined;
  let history: FamilyDocumentImport["mealHistory"][number] | undefined;
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim(); if (!line) continue;
    const key = cleanKey(line); const value = valueAfter(line);
    const memberStart = line.match(/^(?:person|member)\s*\d*\s*[:=-]\s*(.+)$/i) || line.match(/^name\s*[:=-]\s*(.+)$/i);
    const dayStart = line.match(/^(?:day\s*[1-7]|monday|tuesday|wednesday|thursday|friday|saturday|sunday)\s*[:=-]?/i);
    if (memberStart) { member = { name: memberStart[1].trim(), relation: "Family member", favouriteFoods: [], dislikes: [], allergies: [], allergyStatus: "unanswered", healthConditions: [], doctorAdvice: [], uncertain: [] }; members.push(member); history = undefined; continue; }
    if (dayStart) { history = { day: line.split(/[:=-]/)[0].trim().toLowerCase().replace(/\s+/g, "_"), uncertain: [] }; mealHistory.push(history); member = undefined; continue; }
    if (member) {
      if (key.includes("relation")) member.relation = value || member.relation;
      else if (key === "age" || key.includes("age group")) { const age = Number(value.match(/\d{1,3}/)?.[0]); if (Number.isFinite(age)) member.age = age; else member.uncertain.push("age"); }
      else if (key.includes("doctor") || key.includes("dietitian") || key.includes("clinician")) member.doctorAdvice = list(value);
      else if (key.includes("diet")) { const diet = value.toLowerCase().replace(/[ -]/g, "_"); member.dietType = (["vegetarian","eggetarian","non_vegetarian","semi_vegetarian","vegan","other"] as string[]).includes(diet) ? diet as typeof member.dietType : undefined; if (!member.dietType && value) member.uncertain.push("diet type"); }
      else if (key.includes("favourite") || key.includes("favorite")) member.favouriteFoods = list(value);
      else if (key.includes("dislike") || key.includes("avoid")) member.dislikes = list(value);
      else if (key.includes("allerg") || key.includes("intoleran")) { member.allergyStatus = /^no\s+(known\s+)?allerg/i.test(value) ? "no_known" : value ? "provided" : "unanswered"; member.allergies = member.allergyStatus === "provided" ? list(value) : []; if (!value) member.uncertain.push("allergies"); }
      else if (key.includes("health") || key.includes("condition")) member.healthConditions = list(value);
    } else if (history) {
      if (key.includes("breakfast")) history.breakfast = value;
      else if (key.includes("lunch")) history.lunch = value;
      else if (key.includes("dinner")) history.dinner = value;
      else if (key.includes("snack") || key.includes("high tea")) history.snacks = value;
      else if (key.includes("exception")) history.exceptions = value;
    } else {
      if (key.includes("number of people") || key === "people") { const n = Number(value.match(/\d+/)?.[0]); if (Number.isFinite(n)) household.people = n; }
      else if (key.includes("meal")) household.mealsToPlan = list(value);
      else if (key.includes("cuisine")) household.cuisines = list(value);
      else if (key.includes("budget")) household.budget = value;
      else if (key.includes("cooking time")) household.cookingTime = value;
      else if (key.includes("household") && (key.includes("diet") || key.includes("practice"))) household.dietaryPractices = list(value);
    }
  }
  if (!members.length) uncertainties.push("No family members were recognised. Use ‘Person: Name’ headings or add members manually.");
  return familyDocumentImportSchema.parse({ household, members, mealHistory, uncertainties, source: "typed_text" });
}

export const FAMILY_PROFILE_DOCUMENT_TEMPLATE = `HOUSEHOLD\nNumber of people: [required]\nMeals to plan: breakfast, lunch, dinner, snacks [required]\nPreferred cuisines: [optional]\nFood budget: [optional]\nCooking time: [optional]\nHousehold dietary practices: [optional]\n\nPERSON 1\nName: [required]\nRelation: [optional]\nAge or age group: [optional]\nDiet type: [optional]\nFavourite foods: [optional]\nFoods disliked or avoided: [optional]\nAllergies or intolerances: [optional — write “No known allergies” if confirmed]\nHealth conditions: [optional]\nDoctor or dietitian advice: [optional]\n\nLAST 7 DAYS\nMonday\nBreakfast: [optional]\nLunch: [optional]\nSnacks: [optional]\nDinner: [optional]\nExceptions: [optional]`;
export const FAMILY_PROFILE_DOCUMENT_EXAMPLE = `HOUSEHOLD\nNumber of people: 2\nMeals to plan: breakfast, lunch, dinner\nPreferred cuisines: South Indian, North Indian\nFood budget: INR 6000/month\nCooking time: 30 minutes\nHousehold dietary practices: vegetarian on Monday\n\nPERSON 1: Asha\nRelation: Mother\nAge: 42\nDiet type: vegetarian\nFavourite foods: dosa, rajma\nFoods disliked or avoided: bitter gourd\nAllergies or intolerances: No known allergies\nHealth conditions: high blood pressure\nDoctor or dietitian advice: keep salt low\n\nPERSON 2: Arjun\nRelation: Son\nAge: 12\nDiet type: eggetarian\nAllergies or intolerances: peanuts\n\nMonday\nBreakfast: idli\nLunch: shared sambar rice\nDinner: roti and dal\nExceptions: Arjun ate egg bhurji`;
