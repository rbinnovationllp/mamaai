import type { CommonMeal, GroceryItem } from "@/lib/shared/contracts";

export class GroceryService {
  fromCommonMeal(meal: CommonMeal): GroceryItem[] {
    return meal.ingredients.map((ingredient, index) => ({
      itemId: `grocery-${meal.mealId}-${index + 1}`,
      name: ingredient.name,
      category: ingredient.category,
      quantity: ingredient.quantity,
      estimatedCost: ingredient.estimatedCost,
      quantityToPurchase: ingredient.quantity
    }));
  }

  totalCost(items: GroceryItem[]) {
    return items.reduce((sum, item) => sum + item.estimatedCost.amount, 0);
  }
}
