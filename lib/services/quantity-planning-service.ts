import type {
  FamilyMember,
  FastingMealRequirement,
  GroceryItem,
  Ingredient,
  IngredientRequirement,
  MealAttendanceEntry,
  MealTime
} from "@/lib/shared/contracts";

function round(value: number) {
  return Math.round(value * 10) / 10;
}

function portionFactor(member: FamilyMember) {
  if (member.age < 6) return 0.35;
  if (member.age < 13) return 0.55;
  if (member.age > 70) return 0.75;
  if (member.activityLevel === "heavy" || member.activityLevel === "athlete") return 1.25;
  if (member.activityLevel === "sedentary") return 0.85;
  return 1;
}

function parseQuantity(quantity: string) {
  const match = quantity.match(/^(\d+(?:\.\d+)?)\s*(.*)$/);
  if (!match) return null;
  return { amount: Number(match[1]), unit: match[2].trim() };
}

function scaleQuantity(quantity: string, scale: number) {
  const parsed = parseQuantity(quantity);
  if (!parsed) return `${round(scale)}x ${quantity}`;
  return `${round(parsed.amount * scale)} ${parsed.unit}`.trim();
}

function fastingSuggestion(member: FamilyMember, mealTime: MealTime): FastingMealRequirement {
  const preference = member.fastingPreference;
  const allowed = preference?.allowedFoods.length ? preference.allowedFoods : ["Fruit", "Curd", "Nuts", "Potato", "Millet or family-approved fasting grain"];
  const avoided = preference?.avoidedFoods ?? [];
  const suggestion = preference?.grainsRestricted
    ? `${allowed.slice(0, 3).join(", ")} plate with light seasoning`
    : `${allowed.slice(0, 3).join(", ")} with a small fasting-compatible grain portion if allowed`;

  return {
    memberId: member.memberId,
    memberName: member.name,
    mealTime,
    suggestion,
    allowedFoodsUsed: allowed.slice(0, 4),
    avoidedFoods: avoided,
    notes: [
      "Generated from user-confirmed fasting rules, not a universal fasting diet.",
      preference?.dairyAllowed ? "Dairy allowed by saved preference." : "Avoid dairy unless the user confirms it is allowed.",
      preference?.fruitsAllowed ? "Fruit can be included." : "Avoid fruit unless the user confirms it is allowed."
    ]
  };
}

export class QuantityPlanningService {
  defaultAttendance(mealTime: MealTime, members: FamilyMember[]): MealAttendanceEntry {
    return {
      mealTime,
      participatingMemberIds: members.map((member) => member.memberId),
      absentMemberIds: [],
      fastingMemberIds: members
        .filter((member) => member.fastingPreference?.observesFasting === "yes")
        .map((member) => member.memberId),
      guestCount: 0,
      enabled: true
    };
  }

  portionUnits(attendance: MealAttendanceEntry, members: FamilyMember[]) {
    const activeMemberIds = new Set(attendance.participatingMemberIds);
    const absentMemberIds = new Set(attendance.absentMemberIds);
    const fastingMemberIds = new Set(attendance.fastingMemberIds);
    const memberUnits = members
      .filter((member) => activeMemberIds.has(member.memberId))
      .filter((member) => !absentMemberIds.has(member.memberId))
      .filter((member) => !fastingMemberIds.has(member.memberId))
      .reduce((sum, member) => sum + portionFactor(member), 0);
    return round(memberUnits + attendance.guestCount);
  }

  mealRequirements(mealTime: MealTime, ingredients: Ingredient[], attendance: MealAttendanceEntry, members: FamilyMember[]) {
    const units = this.portionUnits(attendance, members);
    const scale = units / Math.max(members.length, 1);
    return ingredients.map((ingredient, index): IngredientRequirement => ({
      itemId: `${mealTime}-${index + 1}-${ingredient.name.toLowerCase().replace(/\s+/g, "-")}`,
      mealTime,
      name: ingredient.name,
      category: ingredient.category,
      baseQuantity: ingredient.quantity,
      adjustedQuantity: scaleQuantity(ingredient.quantity, scale),
      quantityToPurchase: scaleQuantity(ingredient.quantity, scale),
      portionUnits: units,
      estimatedCost: {
        amount: Math.round(ingredient.estimatedCost.amount * scale),
        currency: "INR"
      },
      notes: [
        `Calculated for ${units} adult-equivalent portion units.`,
        "Absent and fasting members are excluded from normal meal quantities."
      ]
    }));
  }

  fastingRequirements(mealTime: MealTime, attendance: MealAttendanceEntry, members: FamilyMember[]) {
    const fastingIds = new Set(attendance.fastingMemberIds);
    return members.filter((member) => fastingIds.has(member.memberId)).map((member) => fastingSuggestion(member, mealTime));
  }

  consolidate(requirements: IngredientRequirement[]) {
    const grouped = new Map<string, IngredientRequirement[]>();
    for (const requirement of requirements) {
      const key = requirement.name.toLowerCase();
      grouped.set(key, [...(grouped.get(key) ?? []), requirement]);
    }

    return Array.from(grouped.entries()).map(([key, items], index): IngredientRequirement => {
      const first = items[0];
      return {
        itemId: `daily-${index + 1}-${key.replace(/\s+/g, "-")}`,
        mealTime: "daily_total",
        name: first.name,
        category: first.category,
        baseQuantity: items.map((item) => item.baseQuantity).join(" + "),
        adjustedQuantity: items.map((item) => item.adjustedQuantity).join(" + "),
        quantityToPurchase: items.map((item) => item.quantityToPurchase).join(" + "),
        portionUnits: round(items.reduce((sum, item) => sum + item.portionUnits, 0)),
        estimatedCost: {
          amount: items.reduce((sum, item) => sum + item.estimatedCost.amount, 0),
          currency: "INR"
        },
        notes: ["Consolidated deterministic daily grocery requirement."]
      };
    });
  }

  groceryFromRequirements(requirements: IngredientRequirement[]): GroceryItem[] {
    return requirements.map((requirement) => ({
      itemId: requirement.itemId,
      name: requirement.name,
      category: requirement.category,
      quantity: requirement.adjustedQuantity,
      estimatedCost: requirement.estimatedCost,
      quantityToPurchase: requirement.quantityToPurchase
    }));
  }
}
