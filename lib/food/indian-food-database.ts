import type { Family, FamilyDietPreference, Ingredient, MealTime } from "@/lib/shared/contracts";

export type IndianFoodPreferenceCode = "VEG" | "EGG" | "NV-CH" | "NV-MT" | "NV-FI" | "NV-SF" | "NV-MIX";
export type MealStyle = "everyday" | "occasional" | "festive";

export interface IndianFoodRecord {
  id: string;
  country: "India";
  region: string;
  state: string;
  subRegionOrCuisine: string;
  foodPreferences: IndianFoodPreferenceCode[];
  mealTypes: MealTime[];
  dishName: string;
  dishCategory: "meal_combination" | "breakfast" | "snack" | "one_pot" | "bread" | "curry" | "accompaniment";
  proteinSource: string;
  grainBase: string;
  mainVegetable?: string;
  typicalCombination: string;
  mealStyle: MealStyle;
  seasonalSuitability: string;
  prepTimeMinutes: number;
  difficulty: "easy" | "medium" | "hard";
  ingredients: Ingredient[];
}

const money = (amount: number) => ({ amount, currency: "INR" as const });

const ingredients = (items: Array<[string, string, Ingredient["category"], number]>): Ingredient[] =>
  items.map(([name, quantity, category, amount]) => ({ name, quantity, category, estimatedCost: money(amount) }));

export const indianRegionalStructure = [
  { country: "India", region: "North", state: "Punjab", cuisines: ["Punjabi"] },
  { country: "India", region: "North", state: "Haryana", cuisines: ["Haryanvi"] },
  { country: "India", region: "North", state: "Uttar Pradesh", cuisines: ["Awadhi", "Purvanchal", "Western UP"] },
  { country: "India", region: "North", state: "Delhi", cuisines: ["Delhi/North Indian home style"] },
  { country: "India", region: "North", state: "Rajasthan", cuisines: ["Marwari", "Mewari", "Rajasthani"] },
  { country: "India", region: "North", state: "Jammu & Kashmir", cuisines: ["Kashmiri"] },
  { country: "India", region: "Himalayan", state: "Himachal Pradesh", cuisines: ["Himachali"] },
  { country: "India", region: "Himalayan", state: "Uttarakhand", cuisines: ["Garhwali", "Kumaoni", "Pahadi"] },
  { country: "India", region: "Central", state: "Madhya Pradesh", cuisines: ["Malwa", "Bundelkhand", "MP home style"] },
  { country: "India", region: "Central", state: "Chhattisgarh", cuisines: ["Chhattisgarhi"] },
  { country: "India", region: "East", state: "West Bengal", cuisines: ["Bengali"] },
  { country: "India", region: "East", state: "Odisha", cuisines: ["Odia"] },
  { country: "India", region: "East", state: "Bihar", cuisines: ["Bihari", "Mithila", "Bhojpuri-region"] },
  { country: "India", region: "East", state: "Jharkhand", cuisines: ["Jharkhandi"] },
  { country: "India", region: "West", state: "Maharashtra", cuisines: ["Maharashtrian", "Kolhapuri", "Malvani"] },
  { country: "India", region: "West", state: "Gujarat", cuisines: ["Gujarati", "Kathiawadi"] },
  { country: "India", region: "West", state: "Goa", cuisines: ["Goan", "Konkani"] },
  { country: "India", region: "South", state: "Karnataka", cuisines: ["Karnataka", "North Karnataka", "Udupi", "Mangalorean"] },
  { country: "India", region: "South", state: "Tamil Nadu", cuisines: ["Tamil", "Chettinad"] },
  { country: "India", region: "South", state: "Kerala", cuisines: ["Kerala", "Malayali"] },
  { country: "India", region: "South", state: "Andhra Pradesh", cuisines: ["Andhra"] },
  { country: "India", region: "South", state: "Telangana", cuisines: ["Telangana"] },
  { country: "India", region: "North-East", state: "Assam", cuisines: ["Assamese"] },
  { country: "India", region: "North-East", state: "Sikkim", cuisines: ["Sikkimese"] },
  { country: "India", region: "North-East", state: "Meghalaya", cuisines: ["Khasi", "Garo"] },
  { country: "India", region: "North-East", state: "Nagaland", cuisines: ["Naga"] },
  { country: "India", region: "North-East", state: "Manipur", cuisines: ["Manipuri"] },
  { country: "India", region: "North-East", state: "Mizoram", cuisines: ["Mizo"] },
  { country: "India", region: "North-East", state: "Tripura", cuisines: ["Tripuri"] },
  { country: "India", region: "North-East", state: "Arunachal Pradesh", cuisines: ["State/community-specific regional"] },
] as const;

const r = (record: Omit<IndianFoodRecord, "country">): IndianFoodRecord => ({ country: "India", ...record });

export const indianFoodDatabase: IndianFoodRecord[] = [
  r({ id: "ka-north-jolada-rotti", region: "South", state: "Karnataka", subRegionOrCuisine: "North Karnataka", foodPreferences: ["VEG"], mealTypes: ["lunch", "dinner"], dishName: "Jolada Rotti", dishCategory: "meal_combination", proteinSource: "Dal/legume", grainBase: "Jowar", mainVegetable: "Seasonal palya", typicalCombination: "Jolada Rotti + Palya + Dal", mealStyle: "everyday", seasonalSuitability: "All season", prepTimeMinutes: 40, difficulty: "medium", ingredients: ingredients([["Jowar flour", "3 cups", "grains", 80], ["Toor dal", "1.25 cups", "pulses", 55], ["Seasonal palya vegetables", "4 cups", "vegetables", 120], ["Curd or buttermilk", "600 g", "dairy", 70], ["Peanut chutney powder", "0.5 cup", "protein", 45]]) }),
  r({ id: "ka-bisibele-bath", region: "South", state: "Karnataka", subRegionOrCuisine: "Karnataka", foodPreferences: ["VEG"], mealTypes: ["lunch", "dinner"], dishName: "Bisibele Bath", dishCategory: "one_pot", proteinSource: "Toor dal", grainBase: "Rice", mainVegetable: "Mixed vegetables", typicalCombination: "Bisibele Bath + Curd + Kosambari", mealStyle: "everyday", seasonalSuitability: "All season", prepTimeMinutes: 45, difficulty: "medium", ingredients: ingredients([["Rice", "1.5 cups", "grains", 55], ["Toor dal", "1.25 cups", "pulses", 55], ["Mixed vegetables", "4 cups", "vegetables", 130], ["Curd", "650 g", "dairy", 75], ["Bisibele bath spice mix", "3 tbsp", "spices", 35]]) }),
  r({ id: "ka-akki-rotti", region: "South", state: "Karnataka", subRegionOrCuisine: "Karnataka", foodPreferences: ["VEG"], mealTypes: ["breakfast", "dinner"], dishName: "Akki Rotti", dishCategory: "breakfast", proteinSource: "Curd/peanut chutney", grainBase: "Rice flour", mainVegetable: "Onion and herbs", typicalCombination: "Akki Rotti + Coconut Chutney + Curd", mealStyle: "everyday", seasonalSuitability: "All season", prepTimeMinutes: 30, difficulty: "medium", ingredients: ingredients([["Rice flour", "3 cups", "grains", 70], ["Onion and coriander", "2 cups", "vegetables", 45], ["Coconut chutney", "1.5 cups", "other", 75], ["Curd", "500 g", "dairy", 60]]) }),
  r({ id: "ka-majjige-huli", region: "South", state: "Karnataka", subRegionOrCuisine: "Karnataka", foodPreferences: ["VEG"], mealTypes: ["lunch", "dinner"], dishName: "Majjige Huli", dishCategory: "meal_combination", proteinSource: "Curd and dal paste", grainBase: "Rice", mainVegetable: "Ash gourd/cucumber", typicalCombination: "Rice + Majjige Huli + Beans Palya", mealStyle: "everyday", seasonalSuitability: "Summer/all season", prepTimeMinutes: 35, difficulty: "easy", ingredients: ingredients([["Rice", "1.75 cups", "grains", 65], ["Curd", "800 g", "dairy", 90], ["Ash gourd or cucumber", "4 cups", "vegetables", 110], ["Chana dal", "0.75 cup", "pulses", 35], ["Beans palya", "3 cups", "vegetables", 90]]) }),
  r({ id: "ka-ragi-mudde-saaru", region: "South", state: "Karnataka", subRegionOrCuisine: "Karnataka", foodPreferences: ["VEG"], mealTypes: ["lunch", "dinner"], dishName: "Ragi Mudde", dishCategory: "meal_combination", proteinSource: "Soppu saaru/dal", grainBase: "Ragi", mainVegetable: "Greens", typicalCombination: "Ragi Mudde + Soppu Saaru + Palya", mealStyle: "everyday", seasonalSuitability: "All season", prepTimeMinutes: 40, difficulty: "medium", ingredients: ingredients([["Ragi flour", "3 cups", "grains", 80], ["Toor dal", "1.25 cups", "pulses", 55], ["Leafy greens", "4 cups", "vegetables", 110], ["Seasonal palya", "3 cups", "vegetables", 90], ["Buttermilk", "750 ml", "dairy", 65]]) }),
  r({ id: "ka-vangibath", region: "South", state: "Karnataka", subRegionOrCuisine: "Karnataka", foodPreferences: ["VEG"], mealTypes: ["lunch", "dinner"], dishName: "Vangibath", dishCategory: "one_pot", proteinSource: "Peanuts/curd", grainBase: "Rice", mainVegetable: "Brinjal", typicalCombination: "Vangibath + Mosaru Bajji + Kosambari", mealStyle: "everyday", seasonalSuitability: "All season", prepTimeMinutes: 35, difficulty: "easy", ingredients: ingredients([["Rice", "1.75 cups", "grains", 65], ["Brinjal", "4 cups", "vegetables", 110], ["Peanuts", "0.75 cup", "protein", 50], ["Curd raita", "2 cups", "dairy", 75], ["Vangibath powder", "3 tbsp", "spices", 35]]) }),
  r({ id: "ka-udupi-sambar-rice", region: "South", state: "Karnataka", subRegionOrCuisine: "Udupi", foodPreferences: ["VEG"], mealTypes: ["lunch"], dishName: "Udupi Sambar", dishCategory: "meal_combination", proteinSource: "Toor dal", grainBase: "Rice", mainVegetable: "Drumstick and pumpkin", typicalCombination: "Rice + Udupi Sambar + Cabbage Palya", mealStyle: "everyday", seasonalSuitability: "All season", prepTimeMinutes: 40, difficulty: "easy", ingredients: ingredients([["Rice", "1.75 cups", "grains", 65], ["Toor dal", "1.5 cups", "pulses", 70], ["Sambar vegetables", "5 cups", "vegetables", 145], ["Cabbage palya", "3 cups", "vegetables", 75], ["Coconut sambar masala", "0.75 cup", "spices", 45]]) }),
  r({ id: "tn-ven-pongal", region: "South", state: "Tamil Nadu", subRegionOrCuisine: "Tamil", foodPreferences: ["VEG"], mealTypes: ["breakfast", "dinner"], dishName: "Ven Pongal", dishCategory: "breakfast", proteinSource: "Moong dal", grainBase: "Rice", typicalCombination: "Ven Pongal + Sambar + Chutney", mealStyle: "everyday", seasonalSuitability: "All season", prepTimeMinutes: 30, difficulty: "easy", ingredients: ingredients([["Rice", "1.5 cups", "grains", 55], ["Moong dal", "1 cup", "pulses", 50], ["Sambar vegetables", "4 cups", "vegetables", 120], ["Coconut chutney", "1 cup", "other", 60], ["Pepper cumin tempering", "2 tbsp", "spices", 25]]) }),
  r({ id: "tn-chettinad-egg", region: "South", state: "Tamil Nadu", subRegionOrCuisine: "Chettinad", foodPreferences: ["EGG"], mealTypes: ["lunch", "dinner"], dishName: "Chettinad Egg Curry", dishCategory: "meal_combination", proteinSource: "Egg", grainBase: "Rice/Roti", mainVegetable: "Seasonal poriyal", typicalCombination: "Chettinad Egg Curry + Rice + Poriyal", mealStyle: "everyday", seasonalSuitability: "All season", prepTimeMinutes: 35, difficulty: "medium", ingredients: ingredients([["Eggs", "8 pieces", "protein", 90], ["Rice", "1.5 cups", "grains", 55], ["Poriyal vegetables", "4 cups", "vegetables", 120], ["Chettinad spice base", "3 tbsp", "spices", 40], ["Curd", "500 g", "dairy", 60]]) }),
  r({ id: "kl-fish-curry-rice", region: "South", state: "Kerala", subRegionOrCuisine: "Kerala/Malayali", foodPreferences: ["NV-FI"], mealTypes: ["lunch", "dinner"], dishName: "Kerala Fish Curry", dishCategory: "meal_combination", proteinSource: "Fish", grainBase: "Rice", mainVegetable: "Thoran vegetables", typicalCombination: "Rice + Fish Curry + Vegetable Thoran", mealStyle: "everyday", seasonalSuitability: "Coastal/all season", prepTimeMinutes: 40, difficulty: "medium", ingredients: ingredients([["Fish", "650 g", "protein", 260], ["Rice", "1.75 cups", "grains", 65], ["Thoran vegetables", "4 cups", "vegetables", 125], ["Coconut", "1 cup", "other", 60], ["Kokum or tamarind spice base", "2 tbsp", "spices", 30]]) }),
  r({ id: "kl-appam-chicken-stew", region: "South", state: "Kerala", subRegionOrCuisine: "Kerala/Malayali", foodPreferences: ["NV-CH"], mealTypes: ["dinner"], dishName: "Appam and Chicken Stew", dishCategory: "meal_combination", proteinSource: "Chicken", grainBase: "Rice batter", mainVegetable: "Carrot and beans", typicalCombination: "Appam + Chicken Stew + Vegetable Thoran", mealStyle: "occasional", seasonalSuitability: "All season", prepTimeMinutes: 55, difficulty: "medium", ingredients: ingredients([["Appam batter", "4 cups", "grains", 110], ["Chicken", "650 g", "protein", 220], ["Carrot and beans", "3 cups", "vegetables", 100], ["Coconut milk", "2 cups", "dairy", 120], ["Whole spices", "2 tbsp", "spices", 30]]) }),
  r({ id: "ap-andhra-chicken", region: "South", state: "Andhra Pradesh", subRegionOrCuisine: "Andhra", foodPreferences: ["NV-CH"], mealTypes: ["lunch", "dinner"], dishName: "Andhra Chicken Curry", dishCategory: "meal_combination", proteinSource: "Chicken", grainBase: "Rice", mainVegetable: "Vegetable fry", typicalCombination: "Rice + Andhra Chicken Curry + Vegetable Fry", mealStyle: "everyday", seasonalSuitability: "All season", prepTimeMinutes: 45, difficulty: "medium", ingredients: ingredients([["Chicken", "650 g", "protein", 220], ["Rice", "1.75 cups", "grains", 65], ["Vegetable fry mix", "4 cups", "vegetables", 125], ["Dal or rasam", "1 cup", "pulses", 45], ["Andhra spice base", "3 tbsp", "spices", 40]]) }),
  r({ id: "tg-pesarattu", region: "South", state: "Telangana", subRegionOrCuisine: "Telangana", foodPreferences: ["VEG"], mealTypes: ["breakfast"], dishName: "Pesarattu", dishCategory: "breakfast", proteinSource: "Green moong", grainBase: "Green moong batter", mainVegetable: "Ginger chutney", typicalCombination: "Pesarattu + Ginger Chutney + Curd", mealStyle: "everyday", seasonalSuitability: "All season", prepTimeMinutes: 30, difficulty: "medium", ingredients: ingredients([["Whole green moong", "2 cups", "pulses", 95], ["Rice", "0.5 cup", "grains", 20], ["Ginger chutney", "1 cup", "other", 45], ["Curd", "500 g", "dairy", 60]]) }),
  r({ id: "pb-chole-roti", region: "North", state: "Punjab", subRegionOrCuisine: "Punjabi", foodPreferences: ["VEG"], mealTypes: ["lunch", "dinner"], dishName: "Punjabi Chole", dishCategory: "meal_combination", proteinSource: "Kabuli chana", grainBase: "Wheat", mainVegetable: "Salad", typicalCombination: "Chole + Roti + Salad + Curd", mealStyle: "everyday", seasonalSuitability: "All season", prepTimeMinutes: 45, difficulty: "medium", ingredients: ingredients([["Kabuli chana", "2 cups", "pulses", 90], ["Whole wheat flour", "3 cups", "grains", 55], ["Salad vegetables", "3 cups", "vegetables", 80], ["Curd", "650 g", "dairy", 75], ["Chole masala", "2 tbsp", "spices", 25]]) }),
  r({ id: "up-awadhi-anda", region: "North", state: "Uttar Pradesh", subRegionOrCuisine: "Awadhi", foodPreferences: ["EGG"], mealTypes: ["dinner"], dishName: "Anda Curry", dishCategory: "meal_combination", proteinSource: "Egg", grainBase: "Wheat", mainVegetable: "Seasonal sabzi", typicalCombination: "Anda Curry + Roti + Seasonal Sabzi", mealStyle: "everyday", seasonalSuitability: "All season", prepTimeMinutes: 35, difficulty: "easy", ingredients: ingredients([["Eggs", "8 pieces", "protein", 90], ["Whole wheat flour", "3 cups", "grains", 55], ["Seasonal sabzi vegetables", "4 cups", "vegetables", 120], ["Onion tomato masala", "2 cups", "vegetables", 60], ["Curd", "500 g", "dairy", 60]]) }),
  r({ id: "rj-dal-baati", region: "North", state: "Rajasthan", subRegionOrCuisine: "Marwari", foodPreferences: ["VEG"], mealTypes: ["lunch", "dinner"], dishName: "Dal Baati", dishCategory: "meal_combination", proteinSource: "Panchmel dal", grainBase: "Wheat/Bajra", mainVegetable: "Lehsun chutney and salad", typicalCombination: "Dal Baati + Churma-light + Salad", mealStyle: "occasional", seasonalSuitability: "Cooler days/all season", prepTimeMinutes: 60, difficulty: "medium", ingredients: ingredients([["Wheat and bajra flour", "3 cups", "grains", 75], ["Mixed panchmel dal", "1.75 cups", "pulses", 85], ["Salad vegetables", "3 cups", "vegetables", 80], ["Ghee", "3 tbsp", "dairy", 45], ["Garlic chutney", "0.5 cup", "spices", 30]]) }),
  r({ id: "jk-rajma-rice", region: "North", state: "Jammu & Kashmir", subRegionOrCuisine: "Kashmiri/Jammu", foodPreferences: ["VEG"], mealTypes: ["lunch"], dishName: "Jammu Rajma", dishCategory: "meal_combination", proteinSource: "Rajma", grainBase: "Rice", mainVegetable: "Salad", typicalCombination: "Rajma + Rice + Salad + Curd", mealStyle: "everyday", seasonalSuitability: "All season", prepTimeMinutes: 50, difficulty: "medium", ingredients: ingredients([["Rajma", "2 cups", "pulses", 110], ["Rice", "1.75 cups", "grains", 65], ["Salad vegetables", "3 cups", "vegetables", 80], ["Curd", "650 g", "dairy", 75], ["Fennel ginger spices", "2 tbsp", "spices", 30]]) }),
  r({ id: "uk-mandua-gahat", region: "Himalayan", state: "Uttarakhand", subRegionOrCuisine: "Garhwali/Kumaoni", foodPreferences: ["VEG"], mealTypes: ["lunch", "dinner"], dishName: "Mandua Roti", dishCategory: "meal_combination", proteinSource: "Gahat dal", grainBase: "Ragi/Mandua", mainVegetable: "Seasonal saag", typicalCombination: "Mandua Roti + Gahat Dal + Seasonal Saag", mealStyle: "everyday", seasonalSuitability: "Cooler days/all season", prepTimeMinutes: 45, difficulty: "medium", ingredients: ingredients([["Mandua/ragi flour", "3 cups", "grains", 85], ["Gahat or horse gram dal", "1.5 cups", "pulses", 90], ["Seasonal saag", "4 cups", "vegetables", 120], ["Curd", "500 g", "dairy", 60], ["Pahadi spice tempering", "2 tbsp", "spices", 25]]) }),
  r({ id: "hp-madra-rice", region: "Himalayan", state: "Himachal Pradesh", subRegionOrCuisine: "Himachali", foodPreferences: ["VEG"], mealTypes: ["lunch"], dishName: "Chana Madra", dishCategory: "meal_combination", proteinSource: "Chana/rajma", grainBase: "Rice", mainVegetable: "Kachumber", typicalCombination: "Chana Madra + Rice + Kachumber", mealStyle: "everyday", seasonalSuitability: "All season", prepTimeMinutes: 45, difficulty: "medium", ingredients: ingredients([["Kala chana or rajma", "1.75 cups", "pulses", 95], ["Rice", "1.75 cups", "grains", 65], ["Curd", "750 g", "dairy", 85], ["Kachumber vegetables", "3 cups", "vegetables", 80], ["Madra spices", "2 tbsp", "spices", 30]]) }),
  r({ id: "mp-dal-bafla", region: "Central", state: "Madhya Pradesh", subRegionOrCuisine: "Malwa", foodPreferences: ["VEG"], mealTypes: ["lunch"], dishName: "Dal Bafla", dishCategory: "meal_combination", proteinSource: "Toor/mixed dal", grainBase: "Wheat", mainVegetable: "Kachumber", typicalCombination: "Dal Bafla + Kachumber + Curd", mealStyle: "occasional", seasonalSuitability: "Cooler days/all season", prepTimeMinutes: 60, difficulty: "medium", ingredients: ingredients([["Whole wheat flour", "3 cups", "grains", 55], ["Mixed dal", "1.75 cups", "pulses", 85], ["Kachumber vegetables", "3 cups", "vegetables", 80], ["Curd", "650 g", "dairy", 75], ["Ghee", "2 tbsp", "dairy", 35]]) }),
  r({ id: "cg-chila", region: "Central", state: "Chhattisgarh", subRegionOrCuisine: "Chhattisgarhi", foodPreferences: ["VEG"], mealTypes: ["breakfast", "high_tea"], dishName: "Chawal Chila", dishCategory: "breakfast", proteinSource: "Curd/chana side", grainBase: "Rice flour", mainVegetable: "Green chutney", typicalCombination: "Chawal Chila + Green Chutney + Curd", mealStyle: "everyday", seasonalSuitability: "All season", prepTimeMinutes: 25, difficulty: "easy", ingredients: ingredients([["Rice flour", "3 cups", "grains", 70], ["Curd", "500 g", "dairy", 60], ["Green chutney", "1 cup", "other", 40], ["Roasted chana", "0.75 cup", "pulses", 35]]) }),
  r({ id: "wb-shukto-cholar", region: "East", state: "West Bengal", subRegionOrCuisine: "Bengali", foodPreferences: ["VEG"], mealTypes: ["lunch"], dishName: "Shukto and Cholar Dal", dishCategory: "meal_combination", proteinSource: "Cholar dal", grainBase: "Rice", mainVegetable: "Mixed bitter vegetables", typicalCombination: "Rice + Shukto + Cholar Dal + Bhaja", mealStyle: "everyday", seasonalSuitability: "Summer/all season", prepTimeMinutes: 45, difficulty: "medium", ingredients: ingredients([["Rice", "1.75 cups", "grains", 65], ["Chana dal", "1.5 cups", "pulses", 70], ["Shukto vegetables", "4 cups", "vegetables", 130], ["Begun bhaja slices", "2 cups", "vegetables", 65], ["Panch phoron", "2 tsp", "spices", 20]]) }),
  r({ id: "wb-macher-jhol", region: "East", state: "West Bengal", subRegionOrCuisine: "Bengali", foodPreferences: ["NV-FI"], mealTypes: ["lunch"], dishName: "Macher Jhol", dishCategory: "meal_combination", proteinSource: "Fish", grainBase: "Rice", mainVegetable: "Vegetable side", typicalCombination: "Rice + Macher Jhol + Vegetable", mealStyle: "everyday", seasonalSuitability: "All season", prepTimeMinutes: 40, difficulty: "medium", ingredients: ingredients([["Fish", "650 g", "protein", 260], ["Rice", "1.75 cups", "grains", 65], ["Vegetable side", "4 cups", "vegetables", 120], ["Moong dal", "1 cup", "pulses", 45], ["Mustard and panch phoron", "2 tbsp", "spices", 30]]) }),
  r({ id: "od-dalma", region: "East", state: "Odisha", subRegionOrCuisine: "Odia", foodPreferences: ["VEG"], mealTypes: ["lunch", "dinner"], dishName: "Dalma", dishCategory: "meal_combination", proteinSource: "Toor/moong dal", grainBase: "Rice", mainVegetable: "Pumpkin/raw banana", typicalCombination: "Rice + Dalma + Begun Bhaja", mealStyle: "everyday", seasonalSuitability: "All season", prepTimeMinutes: 40, difficulty: "easy", ingredients: ingredients([["Rice", "1.75 cups", "grains", 65], ["Toor or moong dal", "1.5 cups", "pulses", 70], ["Dalma vegetables", "5 cups", "vegetables", 145], ["Begun bhaja", "2 cups", "vegetables", 65], ["Panch phoron", "2 tsp", "spices", 20]]) }),
  r({ id: "br-litti", region: "East", state: "Bihar", subRegionOrCuisine: "Bihari", foodPreferences: ["VEG"], mealTypes: ["lunch", "dinner"], dishName: "Litti Chokha", dishCategory: "meal_combination", proteinSource: "Sattu", grainBase: "Wheat", mainVegetable: "Baingan/aloo chokha", typicalCombination: "Litti + Chokha + Dal", mealStyle: "everyday", seasonalSuitability: "All season", prepTimeMinutes: 50, difficulty: "medium", ingredients: ingredients([["Whole wheat flour", "3 cups", "grains", 55], ["Sattu", "1.5 cups", "pulses", 80], ["Baingan and potato chokha", "4 cups", "vegetables", 120], ["Masoor or chana dal", "1.25 cups", "pulses", 60], ["Mustard oil and spices", "3 tbsp", "spices", 35]]) }),
  r({ id: "mh-varan-bhaat", region: "West", state: "Maharashtra", subRegionOrCuisine: "Maharashtrian", foodPreferences: ["VEG"], mealTypes: ["lunch"], dishName: "Varan Bhaat", dishCategory: "meal_combination", proteinSource: "Toor dal", grainBase: "Rice", mainVegetable: "Bhaji", typicalCombination: "Varan-Bhaat + Bhaji + Koshimbir", mealStyle: "everyday", seasonalSuitability: "All season", prepTimeMinutes: 35, difficulty: "easy", ingredients: ingredients([["Rice", "1.75 cups", "grains", 65], ["Toor dal", "1.5 cups", "pulses", 70], ["Seasonal bhaji", "4 cups", "vegetables", 120], ["Koshimbir salad", "2 cups", "vegetables", 60], ["Ghee and goda masala", "2 tbsp", "spices", 30]]) }),
  r({ id: "mh-pithla-bhakri", region: "West", state: "Maharashtra", subRegionOrCuisine: "Maharashtrian", foodPreferences: ["VEG"], mealTypes: ["dinner"], dishName: "Pithla Bhakri", dishCategory: "meal_combination", proteinSource: "Besan", grainBase: "Jowar/Bajra", mainVegetable: "Onion", typicalCombination: "Pithla + Bhakri + Onion + Thecha", mealStyle: "everyday", seasonalSuitability: "All season", prepTimeMinutes: 30, difficulty: "easy", ingredients: ingredients([["Jowar or bajra flour", "3 cups", "grains", 80], ["Besan", "1.5 cups", "pulses", 65], ["Onion and cucumber", "3 cups", "vegetables", 70], ["Curd", "500 g", "dairy", 60], ["Thecha spices", "2 tbsp", "spices", 25]]) }),
  r({ id: "mh-malvani-fish", region: "West", state: "Maharashtra", subRegionOrCuisine: "Malvani", foodPreferences: ["NV-FI"], mealTypes: ["lunch", "dinner"], dishName: "Malvani Fish Curry", dishCategory: "meal_combination", proteinSource: "Fish", grainBase: "Rice/Bhakri", mainVegetable: "Vegetable side", typicalCombination: "Malvani Fish Curry + Rice + Koshimbir", mealStyle: "everyday", seasonalSuitability: "Coastal/all season", prepTimeMinutes: 45, difficulty: "medium", ingredients: ingredients([["Fish", "650 g", "protein", 260], ["Rice", "1.75 cups", "grains", 65], ["Vegetable side", "4 cups", "vegetables", 120], ["Coconut malvani masala", "1 cup", "spices", 65], ["Koshimbir", "2 cups", "vegetables", 60]]) }),
  r({ id: "gj-kadhi-khichdi", region: "West", state: "Gujarat", subRegionOrCuisine: "Gujarati", foodPreferences: ["VEG"], mealTypes: ["lunch", "dinner"], dishName: "Kadhi Khichdi", dishCategory: "meal_combination", proteinSource: "Moong dal/curd", grainBase: "Rice", mainVegetable: "Shaak", typicalCombination: "Kadhi-Khichdi + Shaak + Kachumber", mealStyle: "everyday", seasonalSuitability: "All season", prepTimeMinutes: 35, difficulty: "easy", ingredients: ingredients([["Rice", "1.5 cups", "grains", 55], ["Moong dal", "1.25 cups", "pulses", 60], ["Curd", "750 g", "dairy", 85], ["Seasonal shaak", "4 cups", "vegetables", 120], ["Gujarati kadhi spices", "2 tbsp", "spices", 25]]) }),
  r({ id: "gj-thepla", region: "West", state: "Gujarat", subRegionOrCuisine: "Gujarati", foodPreferences: ["VEG"], mealTypes: ["breakfast", "high_tea", "dinner"], dishName: "Methi Thepla", dishCategory: "breakfast", proteinSource: "Curd", grainBase: "Wheat/millet", mainVegetable: "Methi", typicalCombination: "Methi Thepla + Curd + Chundo/Kachumber", mealStyle: "everyday", seasonalSuitability: "All season", prepTimeMinutes: 30, difficulty: "easy", ingredients: ingredients([["Whole wheat and millet flour", "3 cups", "grains", 70], ["Methi leaves", "2 cups", "vegetables", 55], ["Curd", "650 g", "dairy", 75], ["Kachumber", "2 cups", "vegetables", 60], ["Gujarati spices", "2 tbsp", "spices", 25]]) }),
  r({ id: "ga-fish-curry", region: "West", state: "Goa", subRegionOrCuisine: "Goan", foodPreferences: ["NV-FI", "NV-SF"], mealTypes: ["lunch"], dishName: "Goan Fish Curry", dishCategory: "meal_combination", proteinSource: "Fish", grainBase: "Rice", mainVegetable: "Vegetable side", typicalCombination: "Goan Fish Curry + Rice + Vegetable", mealStyle: "everyday", seasonalSuitability: "Coastal/all season", prepTimeMinutes: 40, difficulty: "medium", ingredients: ingredients([["Fish", "650 g", "protein", 260], ["Rice", "1.75 cups", "grains", 65], ["Vegetable side", "4 cups", "vegetables", 120], ["Coconut kokum curry base", "1.5 cups", "spices", 65], ["Sol kadhi or salad", "4 portions", "dairy", 90]]) }),
  r({ id: "as-masor-tenga", region: "North-East", state: "Assam", subRegionOrCuisine: "Assamese", foodPreferences: ["NV-FI"], mealTypes: ["lunch", "dinner"], dishName: "Masor Tenga", dishCategory: "meal_combination", proteinSource: "Fish", grainBase: "Rice", mainVegetable: "Xaak", typicalCombination: "Rice + Masor Tenga + Xaak", mealStyle: "everyday", seasonalSuitability: "Summer/all season", prepTimeMinutes: 35, difficulty: "medium", ingredients: ingredients([["Fish", "650 g", "protein", 260], ["Rice", "1.75 cups", "grains", 65], ["Xaak or leafy greens", "4 cups", "vegetables", 110], ["Masoor dal", "1 cup", "pulses", 50], ["Lemon/tomato tenga base", "2 cups", "vegetables", 55]]) }),
  r({ id: "as-khar-dal", region: "North-East", state: "Assam", subRegionOrCuisine: "Assamese", foodPreferences: ["VEG"], mealTypes: ["lunch"], dishName: "Khar Dal", dishCategory: "meal_combination", proteinSource: "Dal", grainBase: "Rice", mainVegetable: "Xaak", typicalCombination: "Rice + Khar Dal + Xaak Bhaji", mealStyle: "everyday", seasonalSuitability: "All season", prepTimeMinutes: 35, difficulty: "easy", ingredients: ingredients([["Rice", "1.75 cups", "grains", 65], ["Moong or masoor dal", "1.5 cups", "pulses", 70], ["Xaak leafy greens", "4 cups", "vegetables", 110], ["Raw papaya or bottle gourd", "2 cups", "vegetables", 55], ["Mild khar seasoning", "1 tbsp", "spices", 20]]) }),
  r({ id: "sk-thukpa", region: "North-East", state: "Sikkim", subRegionOrCuisine: "Sikkimese", foodPreferences: ["VEG", "EGG", "NV-CH"], mealTypes: ["dinner"], dishName: "Vegetable Thukpa", dishCategory: "one_pot", proteinSource: "Tofu/egg/chicken as selected", grainBase: "Noodles", mainVegetable: "Mixed vegetables", typicalCombination: "Vegetable Thukpa + Salad", mealStyle: "everyday", seasonalSuitability: "Cooler days", prepTimeMinutes: 35, difficulty: "easy", ingredients: ingredients([["Noodles", "450 g", "grains", 100], ["Mixed vegetables", "5 cups", "vegetables", 150], ["Tofu or selected protein", "2 cups", "protein", 130], ["Clear broth spices", "2 tbsp", "spices", 30]]) }),
  r({ id: "mn-ooti-rice", region: "North-East", state: "Manipur", subRegionOrCuisine: "Manipuri", foodPreferences: ["VEG"], mealTypes: ["lunch", "dinner"], dishName: "Ooti", dishCategory: "meal_combination", proteinSource: "Peas/dal", grainBase: "Rice", mainVegetable: "Seasonal greens", typicalCombination: "Rice + Ooti + Seasonal Greens", mealStyle: "everyday", seasonalSuitability: "All season", prepTimeMinutes: 35, difficulty: "easy", ingredients: ingredients([["Rice", "1.75 cups", "grains", 65], ["Peas or lentils", "1.5 cups", "pulses", 75], ["Seasonal greens", "4 cups", "vegetables", 110], ["Mild herbs", "1 cup", "other", 35]]) }),
];

function textForFamily(family: Family) {
  return [
    family.country,
    family.state,
    family.city,
    ...(family.cuisinePreferences ?? []),
    ...(family.indianRegionalPreferences ?? []),
    ...(family.cultureProfile?.preferredCuisines ?? []),
    family.cultureProfile?.region,
    family.cultureProfile?.cookingStyle,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

export function isIndianFoodContext(family: Family) {
  const text = textForFamily(family);
  return /india|bharat|indian|punjabi|gujarati|bengali|odia|bihari|marathi|maharashtra|karnataka|tamil|kerala|andhra|telangana|assam|assamese|rajasthan|uttarakhand|himachal|kashmir|goa|konkani/.test(text);
}

function preferenceCodesFor(diet: FamilyDietPreference): IndianFoodPreferenceCode[] {
  if (diet === "vegan" || diet === "vegetarian") return ["VEG"];
  if (diet === "eggetarian") return ["VEG", "EGG"];
  if (diet === "mixed" || diet === "semi_vegetarian") return ["VEG", "EGG", "NV-CH", "NV-FI", "NV-MT", "NV-SF", "NV-MIX"];
  return ["VEG", "EGG", "NV-CH", "NV-FI", "NV-MT", "NV-SF", "NV-MIX"];
}

function allowedByNonVegChoices(record: IndianFoodRecord, family: Family) {
  if (!record.foodPreferences.some((code) => code.startsWith("NV-"))) return true;
  const choices = (family.nonVegPreferredFoods ?? []).join(" ").toLowerCase();
  if (!choices) return true;
  return (
    (record.foodPreferences.includes("NV-CH") && /chicken/.test(choices)) ||
    (record.foodPreferences.includes("NV-MT") && /mutton|goat/.test(choices)) ||
    (record.foodPreferences.includes("NV-FI") && /fish/.test(choices)) ||
    (record.foodPreferences.includes("NV-SF") && /seafood|prawn|crab|squid|clam/.test(choices)) ||
    (record.foodPreferences.includes("NV-MIX") && /chicken|mutton|goat|fish|seafood|prawn|crab|egg/.test(choices))
  );
}

function matchesFamilyRegion(record: IndianFoodRecord, family: Family) {
  const text = textForFamily(family);
  const terms = [record.state, record.subRegionOrCuisine, record.dishName]
    .flatMap((value) => value.split(/[\/,]/))
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
  return terms.some((term) => text.includes(term));
}

function recentPenalty(record: IndianFoodRecord, recentMeals: string[]) {
  const haystack = recentMeals.join(" ").toLowerCase();
  const tokens = [record.dishName, record.typicalCombination, record.proteinSource, record.grainBase, record.mainVegetable ?? ""]
    .join(" ")
    .toLowerCase();
  return tokens
    .split(/\s+|\+|,|\//)
    .filter((token) => token.length > 3 && haystack.includes(token)).length;
}

export function indianFoodCandidatesFor(input: {
  family: Family;
  mealTime: MealTime;
  recentMeals: string[];
  targetDate: string;
  includePanIndiaFallback?: boolean;
}) {
  const allowedCodes = preferenceCodesFor(input.family.dietPreference);
  const mealTime = input.mealTime === "snack" || input.mealTime === "evening_snack" ? "high_tea" : input.mealTime;
  const strictRegional = textForFamily(input.family).includes("strict regional") || textForFamily(input.family).includes("mostly my regional");
  const pool = indianFoodDatabase
    .filter((record) => record.mealTypes.includes(mealTime))
    .filter((record) => record.foodPreferences.some((code) => allowedCodes.includes(code)))
    .filter((record) => allowedByNonVegChoices(record, input.family))
    .filter((record) => !strictRegional || matchesFamilyRegion(record, input.family));

  const regional = pool.filter((record) => matchesFamilyRegion(record, input.family));
  const candidates = regional.length ? regional : input.includePanIndiaFallback === false ? [] : pool;
  const date = new Date(`${input.targetDate}T12:00:00`);
  const seed = Number.isNaN(date.getTime()) ? 0 : date.getDate();

  return [...candidates].sort((a, b) => {
    const regionScore = Number(matchesFamilyRegion(b, input.family)) - Number(matchesFamilyRegion(a, input.family));
    if (regionScore) return regionScore;
    const styleScore = Number(b.mealStyle === "everyday") - Number(a.mealStyle === "everyday");
    if (styleScore) return styleScore;
    const recentScore = recentPenalty(a, input.recentMeals) - recentPenalty(b, input.recentMeals);
    if (recentScore) return recentScore;
    return (a.id.length + seed) % 7 - ((b.id.length + seed) % 7);
  });
}
