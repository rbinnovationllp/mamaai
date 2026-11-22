import { z } from "zod";

/**
 * Canonical, display-ready ingredient catalogue for the daily planner.  Values
 * are stable identifiers/text that can be sent to the planning service; labels
 * can be translated in the UI without creating duplicate pantry ingredients.
 */
export const DAILY_INGREDIENT_CATALOGUE = [
  { id: "vegetables", label: "Vegetables", items: ["Potato / Aloo", "Onion / Pyaz", "Tomato / Tamatar", "Brinjal / Baingan", "Cauliflower / Gobhi", "Cabbage / Patta Gobhi", "Green peas / Matar", "Carrot / Gajar", "Capsicum / Shimla Mirch", "Bottle gourd / Lauki", "Ridge gourd / Turai", "Bitter gourd / Karela", "Ladyfinger / Bhindi", "Spinach / Palak", "Fenugreek leaves / Methi", "Pumpkin / Kaddu", "Radish / Mooli", "Beans", "Beetroot", "Mushroom", "Sweet potato"] },
  { id: "pulses", label: "Dal, pulses and legumes", items: ["Arhar / Toor Dal", "Moong Dal", "Masoor Dal", "Chana Dal", "Urad Dal", "Mixed Dal", "Rajma", "Kabuli Chana", "Kala Chana", "Whole Moong", "Soybean", "Dried peas"] },
  { id: "grains", label: "Rice, flour and grains", items: ["Regular rice", "Basmati rice", "Brown rice", "Wheat flour / Atta", "Multigrain flour", "Besan", "Suji / Rava", "Poha", "Dalia", "Oats", "Vermicelli / Sevaiyan", "Maida", "Ragi", "Bajra", "Jowar"] },
  { id: "spices", label: "Masalas and spices", items: ["Haldi Powder", "Dhania Powder", "Jeera Powder", "Red Chilli Powder", "Kashmiri Chilli Powder", "Garam Masala", "Kitchen King Masala", "Sabzi Masala", "Sambhar Masala", "Chana Masala", "Rajma Masala", "Pav Bhaji Masala", "Chaat Masala", "Black Pepper", "Hing", "Ajwain", "Whole Jeera", "Mustard Seeds", "Curry Leaves", "Kasuri Methi", "Salt"] },
  { id: "dairy", label: "Dairy products", items: ["Milk", "Curd / Dahi", "Paneer", "Butter", "Ghee", "Buttermilk", "Cheese", "Cream"] },
  { id: "salad", label: "Salad ingredients", items: ["Cucumber", "Tomato", "Onion", "Carrot", "Radish", "Beetroot", "Lettuce", "Lemon", "Sprouts", "Green coriander"] },
  { id: "essentials", label: "Cooking essentials", items: ["Mustard oil", "Refined oil", "Groundnut oil", "Coconut oil", "Olive oil", "Ghee", "Ginger", "Garlic", "Green chilli", "Sugar", "Jaggery", "Tamarind", "Lemon"] },
  { id: "fruit_snacks", label: "Fruits, dry fruits and snacks", items: ["Banana", "Apple", "Papaya", "Orange", "Almonds", "Cashew nuts", "Raisins", "Peanuts", "Makhana", "Biscuits", "Bread"] },
  { id: "non_veg", label: "Eggs and non-vegetarian ingredients", items: ["Eggs", "Chicken", "Fish", "Mutton", "Prawns"] },
  { id: "leftovers", label: "Leftovers and ready food", items: ["Leftover cooked food", "Previously prepared dal", "Cooked rice", "Leftover vegetables", "Chapati", "Ready-to-cook items"] },
] as const;

export const dailyDietSchema = z.enum(["vegetarian", "eggetarian", "non_vegetarian", "semi_vegetarian", "vegan", "jain", "satvik", "mixed", "other"]);
export const dailyMealSchema = z.enum(["breakfast", "lunch", "high_tea", "dinner"]);

export const quickDailyMemberSchema = z.object({
  id: z.string().min(1).optional(),
  name: z.string().trim().min(1).max(80).optional(),
  age: z.number().int().min(0).max(120).optional(),
  diet: dailyDietSchema.default("vegetarian"),
  likes: z.array(z.string().trim().min(1).max(120)).max(30).default([]),
  dislikes: z.array(z.string().trim().min(1).max(120)).max(30).default([]),
  allergies: z.array(z.string().trim().min(1).max(120)).max(20).default([]),
  restrictions: z.array(z.string().trim().min(1).max(160)).max(20).default([]),
  needsSeparateMeal: z.boolean().default(false),
  needsTiffin: z.boolean().default(false),
});

export const quickDailyMealRequestSchema = z.object({
  ingredients: z.array(z.string().trim().min(1).max(120)).min(1).max(100),
  otherIngredients: z.array(z.string().trim().min(1).max(120)).max(30).default([]),
  memberCount: z.number().int().min(1).max(50),
  members: z.array(quickDailyMemberSchema).max(50).default([]),
  householdDiet: dailyDietSchema.default("vegetarian"),
  meals: z.array(dailyMealSchema).min(1).max(4),
  schoolTiffins: z.number().int().min(0).max(20).default(0),
  officeTiffins: z.number().int().min(0).max(20).default(0),
  cookingPreference: z.enum(["quick", "home_style", "budget", "light", "regional", "special", "minimum_effort", "use_available"]).default("use_available"),
  preferredLanguage: z.enum(["en", "hi", "kn"]).default("en"),
  aiProcessingConsent: z.literal(true),
});

export type QuickDailyMealRequest = z.infer<typeof quickDailyMealRequestSchema>;
export type QuickDailyMember = z.infer<typeof quickDailyMemberSchema>;

export const FREE_DAILY_FAMILY_PREFIX = "free_daily_";

export function freeDailyFamilyId(experienceId: string) {
  return `${FREE_DAILY_FAMILY_PREFIX}${experienceId}`;
}
