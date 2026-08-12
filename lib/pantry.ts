// lib/pantry.ts
import { PantryItem, GroceryCategory, EnhancedGroceryItem } from './types';

export interface RequiredIngredient {
  ingredientName: string;
  requiredQty: number;
  unit: string;
  category: string;
  estimatedUnitPrice: number;
}

export interface CalculatedGroceryItem {
  ingredientName: string;
  requiredQty: number;
  pantryQty: number;
  toPurchaseQty: number;
  unit: string;
  category: string;
  estimatedCost: number;
}

// 1. Calculate Groceries after subtracting Pantry quantities
export function calculateGroceryList(
  recipeNeeds: RequiredIngredient[],
  pantryItems: PantryItem[]
): CalculatedGroceryItem[] {
  return recipeNeeds.map((need) => {
    const pantryMatch = pantryItems.find(
      (p) => p.ingredientName.toLowerCase() === need.ingredientName.toLowerCase()
    );

    const pantryQty = pantryMatch ? pantryMatch.quantity : 0;
    const toPurchaseQty = Math.max(0, need.requiredQty - pantryQty);
    const estimatedCost = toPurchaseQty * need.estimatedUnitPrice;

    return {
      ingredientName: need.ingredientName,
      requiredQty: need.requiredQty,
      pantryQty,
      toPurchaseQty,
      unit: need.unit,
      category: need.category,
      estimatedCost,
    };
  });
}

// 2. Classify Pantry Inventory Status
export function evaluatePantryStatus(items: PantryItem[], daysToExpiryThreshold = 3): PantryItem[] {
  const now = new Date();

  return items.map((item) => {
    let status: PantryItem['status'] = 'AVAILABLE';

    if (item.quantity <= 0) {
      status = 'OUT_OF_STOCK';
    } else if (item.quantity <= item.minimumStock) {
      status = 'RUNNING_LOW';
    } else if (item.expiryDate) {
      const diffDays = (new Date(item.expiryDate).getTime() - now.getTime()) / (1000 * 3600 * 24);
      if (diffDays <= daysToExpiryThreshold) {
        status = 'USE_SOON';
      }
    }

    return { ...item, status };
  });
}

// 3. Categorize Groceries into Fresh, Frozen/Ready, and Pantry departments
export function categorizeGroceryItems(rawItems: any[]): Record<GroceryCategory, EnhancedGroceryItem[]> {
  const result: Record<GroceryCategory, EnhancedGroceryItem[]> = {
    FRESH: [],
    FROZEN_READY_TO_COOK: [],
    PANTRY: [],
  };

  rawItems.forEach((item) => {
    const categoryLower = (item.category || '').toLowerCase();
    const nameLower = (item.ingredientName || '').toLowerCase();

    let assignedCategory: GroceryCategory = 'PANTRY';

    if (
      categoryLower.includes('vegetable') ||
      categoryLower.includes('fruit') ||
      categoryLower.includes('dairy') ||
      categoryLower.includes('fresh') ||
      nameLower.includes('spinach') ||
      nameLower.includes('milk')
    ) {
      assignedCategory = 'FRESH';
    } else if (
      categoryLower.includes('frozen') ||
      categoryLower.includes('ready') ||
      nameLower.includes('frozen') ||
      nameLower.includes('ready meal') ||
      nameLower.includes('sauce')
    ) {
      assignedCategory = 'FROZEN_READY_TO_COOK';
    }

    result[assignedCategory].push({
      ingredientName: item.ingredientName || 'Unknown Ingredient',
      requiredQty: Number(item.requiredQty || item.quantity || 0),
      pantryQty: Number(item.pantryQty || 0),
      toPurchaseQty: Number(item.toPurchaseQty || item.requiredQty || 0),
      unit: item.unit || 'units',
      category: assignedCategory,
      storeDepartment: item.storeDepartment || assignedCategory,
      estimatedCost: Number(item.estimatedCost || 0),
    });
  });

  return result;
}