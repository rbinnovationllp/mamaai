export interface GroceryRequirement {
  ingredient: string;
  requiredQty: number;
  pantryQty: number;
  toPurchaseQty: number;
  unit: string;
}

export function calculateGroceryList(recipeNeeds: GroceryRequirement[], currentPantry: any[]): GroceryRequirement[] {
  return recipeNeeds.map((need) => {
    const pantryItem = currentPantry.find(
      (p) => p.ingredientName.toLowerCase() === need.ingredient.toLowerCase()
    );
    const available = pantryItem ? pantryItem.quantity : 0;
    const toBuy = Math.max(0, need.requiredQty - available);

    return {
      ...need,
      pantryQty: available,
      toPurchaseQty: toBuy,
    };
  });
}