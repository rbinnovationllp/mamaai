// lib/types.ts

export type MemberType = 'HUMAN' | 'PET';

export interface FamilyMember {
  id: string;
  familyId: string;
  name: string;
  type: MemberType;
  
  // Human / Common Attributes
  age?: number;
  allergies: string[]; // Hard safety constraints
  dislikes: string[];  // Preference constraints
  isPickyEater?: boolean;

  // Pet-Specific Attributes (Nullable for Humans)
  species?: 'DOG' | 'CAT' | 'OTHER';
  breed?: string;
  weightKg?: number;
  activityLevel?: 'LOW' | 'MODERATE' | 'HIGH';
  foodType?: 'COMMERCIAL' | 'HOME_PREPARED' | 'MIXED' | 'VET_DIET';
  brandPreference?: string;
  vetInstructions?: string;
  isMedicalDiet?: boolean;
}

export interface PantryItem {
  id: string;
  familyId: string;
  ingredientName: string;
  category:
    | 'Vegetables'
    | 'Fruits'
    | 'Grains'
    | 'Pulses'
    | 'Dairy'
    | 'Eggs'
    | 'Meat/Fish'
    | 'Spices'
    | 'Oils'
    | 'Snacks'
    | 'Beverages'
    | 'Other';
  quantity: number;
  unit: string;
  minimumStock: number;
  purchaseDate?: Date;
  expiryDate?: Date;
  status: 'AVAILABLE' | 'RUNNING_LOW' | 'USE_SOON' | 'OUT_OF_STOCK';
}

export interface MealPreference {
  id: string;
  familyMemberId: string;
  dishName: string;
  rating: 'LOVED' | 'GOOD' | 'AVERAGE' | 'DISLIKED' | 'REJECTED';
  lastSuggestedAt: Date;
  timesSuggested: number;
  doNotSuggest: boolean;
}

export interface ProactivePlanSettings {
  familyId: string;
  enabled: boolean;
  planningDay: 'Sunday' | 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday';
  planningTime: string; // e.g., "18:00"
  usePantry: boolean;
  useMealHistory: boolean;
  considerFasting: boolean;
}

export type CookingStyle =
  | 'MOSTLY_FRESH'
  | 'MIX_FRESH_FROZEN'
  | 'MOSTLY_FROZEN_READY'
  | 'MOSTLY_READY_TO_EAT'
  | 'FREQUENT_TAKEAWAY'
  | 'MIXED_LIFESTYLE';

export interface LocationAndCultureProfile {
  country: string;               // e.g., "United Kingdom", "India", "USA", "Canada"
  region?: string;                // e.g., "London", "Karnataka", "Ontario"
  preferredCuisines: string[];    // e.g., ["Indian", "British", "Mediterranean"]
  culturalPreference?: string;
  cookingStyle: CookingStyle;
  cookingFrequency: string;      // e.g., "Daily", "3 times a week"
  preferredStores?: string[];     // e.g., ["Tesco", "Sainsbury's", "Trader Joe's", "Reliance Fresh"]
  availableAppliances?: string[]; // e.g., ["Air Fryer", "Microwave", "Oven", "Instant Pot"]
}

export type GroceryCategory = 'FRESH' | 'FROZEN_READY_TO_COOK' | 'PANTRY';

export interface EnhancedGroceryItem {
  ingredientName: string;
  requiredQty: number;
  pantryQty: number;
  toPurchaseQty: number;
  unit: string;
  category: GroceryCategory;
  storeDepartment?: string;
  estimatedCost: number;
}