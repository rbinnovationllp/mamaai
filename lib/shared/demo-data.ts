import type { CreateFamilyMemberInput, Family, FamilyMember, User } from "./contracts";

const now = new Date().toISOString();

const defaultFastingPreference: CreateFamilyMemberInput["fastingPreference"] = {
  observesFasting: "no",
  regularDays: [],
  allowedFoods: [],
  avoidedFoods: [],
  fruitsAllowed: true,
  dairyAllowed: true,
  grainsRestricted: false,
  customRules: []
};

export const demoUser: User = {
  userId: "demo-user",
  name: "MAMA AI Demo User",
  email: "demo@mamaai.in",
  country: "India",
  state: "Karnataka",
  city: "Bengaluru",
  preferredLanguage: "en",
  authProvider: "guest",
  role: "user",
  healthDataConsentAt: now,
  aiMemoryConsentAt: now
};

export const demoFamily: Family = {
  familyId: "demo-family",
  userId: demoUser.userId,
  name: "Bhartiya Demo Family",
  country: "India",
  state: "Karnataka",
  city: "Bengaluru",
  dietPreference: "vegetarian",
  cuisinePreferences: ["Indian", "North Indian", "South Indian"],
  cuisinePreferenceWeights: [
    { cuisine: "Indian", frequency: "mostly", percentage: 80 },
    { cuisine: "Local seasonal family food", frequency: "sometimes", percentage: 20 }
  ],
  indianRegionalPreferences: ["North Indian", "South Indian", "Millet-based"],
  localIngredientAvailabilityNotes: ["Use ingredients commonly available in Bengaluru markets."],
  budget: { type: "daily", amount: 450, currency: "INR" },
  kitchenProfile: {
    equipment: ["Gas stove", "Pressure cooker", "Mixer/grinder"],
    cookingTimePreference: "under_30"
  },
  subscriptionPlan: "family_premium",
  createdAt: now,
  updatedAt: now
};

export const demoMemberInputs: CreateFamilyMemberInput[] = [
  {
    name: "Grandmother",
    relationship: "Grandmother",
    age: 72,
    gender: "female",
    heightCm: 154,
    weightKg: 58,
    activityLevel: "light",
    goals: ["Easy digestion"],
    dietType: "vegetarian",
    likes: ["Khichdi", "Curd rice"],
    dislikes: ["Very spicy food"],
    allergies: [],
    foodAllergies: [],
    ingredientAllergies: [],
    foodDislikes: ["Very spicy food"],
    dislikedMeals: [],
    excludedIngredients: [],
    dietaryRestrictions: ["Mild spice", "Soft texture"],
    healthConditions: [],
    doctorRestrictions: [],
    specialStatuses: ["Senior requiring soft food"],
    fastingPreference: defaultFastingPreference
  },
  {
    name: "Father",
    relationship: "Father",
    age: 50,
    gender: "male",
    heightCm: 172,
    weightKg: 82,
    activityLevel: "light",
    goals: ["Disease-aware nutrition support"],
    dietType: "vegetarian",
    likes: ["Dal", "Sabzi"],
    dislikes: ["Sweet drinks"],
    allergies: [],
    foodAllergies: [],
    ingredientAllergies: [],
    foodDislikes: ["Sweet drinks"],
    dislikedMeals: [],
    excludedIngredients: [],
    dietaryRestrictions: ["Avoid sugary beverages"],
    healthConditions: ["Type 2 diabetes"],
    doctorRestrictions: ["Avoid sugary beverages"],
    specialStatuses: [],
    fastingPreference: {
      observesFasting: "occasionally",
      regularDays: ["Monday"],
      fastType: "restricted_food_fast",
      reasonOrTradition: "Family fasting day",
      allowedFoods: ["Fruit", "Curd", "Roasted makhana", "Potato"],
      avoidedFoods: ["Rice", "Wheat", "Onion"],
      fastingMealCount: 2,
      fruitsAllowed: true,
      dairyAllowed: true,
      grainsRestricted: true,
      customRules: ["Keep salt and sugar moderate."]
    }
  },
  {
    name: "Mother",
    relationship: "Mother",
    age: 45,
    gender: "female",
    heightCm: 160,
    weightKg: 64,
    activityLevel: "moderate",
    goals: ["Balanced nutrition"],
    dietType: "vegetarian",
    likes: ["Vegetables", "Curd"],
    dislikes: [],
    allergies: [],
    foodAllergies: [],
    ingredientAllergies: [],
    foodDislikes: [],
    dislikedMeals: [],
    excludedIngredients: [],
    dietaryRestrictions: [],
    healthConditions: [],
    doctorRestrictions: [],
    specialStatuses: [],
    fastingPreference: defaultFastingPreference
  },
  {
    name: "Son",
    relationship: "Son",
    age: 19,
    gender: "male",
    heightCm: 178,
    weightKg: 70,
    activityLevel: "heavy",
    goals: ["Protein support"],
    dietType: "vegetarian",
    likes: ["Paneer", "Dal"],
    dislikes: [],
    allergies: [],
    foodAllergies: [],
    ingredientAllergies: [],
    foodDislikes: [],
    dislikedMeals: [],
    excludedIngredients: [],
    dietaryRestrictions: [],
    healthConditions: [],
    doctorRestrictions: [],
    specialStatuses: [],
    fastingPreference: defaultFastingPreference
  },
  {
    name: "Daughter",
    relationship: "Daughter",
    age: 10,
    gender: "female",
    heightCm: 138,
    weightKg: 32,
    activityLevel: "moderate",
    goals: ["Growth-supportive nutrition"],
    dietType: "vegetarian",
    likes: ["Fruit", "Curd"],
    dislikes: ["Bitter gourd"],
    allergies: [],
    foodAllergies: [],
    ingredientAllergies: [],
    foodDislikes: ["Bitter gourd"],
    dislikedMeals: [],
    excludedIngredients: ["Bitter gourd"],
    dietaryRestrictions: [],
    healthConditions: [],
    doctorRestrictions: [],
    specialStatuses: ["Child growth stage"],
    fastingPreference: defaultFastingPreference
  }
];

export const demoMembers: FamilyMember[] = demoMemberInputs.map((member, index) => ({
  ...member,
  familyId: demoFamily.familyId,
  memberId: `demo-member-${index + 1}`
}));

export const mandatoryDisclaimer =
  "MAMA AI provides AI-generated food and nutrition planning suggestions based on information supplied by users. Recommendations are for informational and educational purposes and are not a substitute for professional medical advice, diagnosis, or treatment. Users with chronic medical conditions, allergies, pregnancy, recent hospitalization, surgery, medication requirements, or other special health needs should consult their doctor, registered dietitian, or qualified healthcare professional before following or materially changing a meal plan. Rashi Bhartiya Innovation LLP and MAMA AI do not guarantee that AI-generated recommendations are suitable for every individual. Users remain responsible for reviewing recommendations and seeking professional advice where appropriate.";
