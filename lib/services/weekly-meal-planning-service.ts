import { createId, nowIso } from "@/lib/repositories/in-memory-store";
import { AIService } from "@/lib/ai/ai-service";
import { SafetyValidationService } from "@/lib/ai/safety-validation-service";
import { resolvePlanningHousehold } from "./planning-household";
import { FamilyMealRepository } from "@/lib/repositories/family-meal-repository";
import { PantryRepository } from "@/lib/repositories/pantry-repository";
import { aggregateWeeklyGroceries } from "@/lib/grocery/weekly-aggregation";
import type {
  CreateMealPlanRequest,
  Family,
  FamilyMealPlan,
  FamilyMember,
  MealAttendanceEntry,
  MealTime,
  ProcurementPurchaseWindow,
  ProcurementScheduleGroup,
  SabSewaShoppingRequirement,
  TomorrowIngredientReminder,
  WeeklyFamilyMealPlan,
  WeeklyGroceryRequirement,
  WeeklyMealPlanSlot,
} from "@/lib/shared/contracts";

const weekDays: WeeklyMealPlanSlot["day"][] = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

// Tiffins are independently generated requirements; legacy generic tiffin attendance is retained.
const mealTimes: MealTime[] = ["breakfast", "school_tiffin", "office_tiffin", "lunch", "high_tea", "dinner"];

function parseDateOnly(date: string) {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

function dateOnly(date: Date) {
  return date.toISOString().slice(0, 10);
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

export function mondayForDate(targetDate: string) {
  const date = parseDateOnly(targetDate);
  const day = date.getUTCDay();
  const distanceFromMonday = day === 0 ? 6 : day - 1;
  return dateOnly(addDays(date, -distanceFromMonday));
}

function slotAttendance(request: CreateMealPlanRequest, mealTime: MealTime): MealAttendanceEntry[] | undefined {
  if (request.mealAttendance?.length) {
    const existing = request.mealAttendance.find((entry) => entry.mealTime === mealTime);
    if (existing) return [{ ...existing, mealTime }];
  }

  if (!request.dayAttendancePlan) return undefined;
  if (mealTime === "school_tiffin" || mealTime === "office_tiffin") return undefined;
  const key = mealTime === "high_tea" || mealTime === "evening_snack" || mealTime === "snack" ? "snacks" : mealTime;
  const slot = request.dayAttendancePlan[key as "breakfast" | "lunch" | "snacks" | "dinner"] ?? {};
  const memberIds = Object.keys(slot);
  return [
    {
      mealTime,
      participatingMemberIds: memberIds.filter((id) => slot[id] === "home" || slot[id] === "tiffin"),
      absentMemberIds: memberIds.filter((id) => slot[id] === "skip"),
      fastingMemberIds: memberIds.filter((id) => slot[id] === "fasting"),
      guestCount: request.dayAttendancePlan.guestCountBySlot?.[key as "breakfast" | "lunch" | "snacks" | "dinner"] ?? 0,
      enabled: true,
    },
  ];
}

function storageCharacteristicFor(itemName: string, category: string): WeeklyGroceryRequirement["storageCharacteristic"] {
  const name = itemName.toLowerCase();
  if (["grains", "pulses", "spices"].includes(category) || /rice|atta|flour|dal|rajma|chana|masoor|moong|spice|salt|oil|ghee/.test(name)) {
    return "shelf_stable";
  }
  if (category === "dairy" || /milk|curd|paneer|yogurt|cheese|butter/.test(name)) return "dairy_or_chilled";
  if (category === "protein" || /chicken|fish|mutton|egg|seafood|prawn/.test(name)) return "protein_or_non_veg";
  if (/spinach|leafy|methi|coriander|mint|greens|palak|lettuce/.test(name)) return "leafy_or_highly_perishable";
  if (category === "fruits") return "fresh_short_window";
  if (category === "vegetables" && /potato|onion|garlic|ginger|carrot|cabbage|pumpkin/.test(name)) return "longer_keeping_produce";
  if (category === "vegetables") return "fresh_short_window";
  return "other";
}

function procurementWindowFor(
  characteristic: WeeklyGroceryRequirement["storageCharacteristic"],
  firstConsumptionDate: string,
  weekStartDate: string
): ProcurementPurchaseWindow {
  const dayOffset = Math.round((parseDateOnly(firstConsumptionDate).getTime() - parseDateOnly(weekStartDate).getTime()) / 86400000);
  if (characteristic === "shelf_stable" || characteristic === "longer_keeping_produce") return "buy_this_weekend";
  if (characteristic === "leafy_or_highly_perishable" || characteristic === "dairy_or_chilled" || characteristic === "protein_or_non_veg") {
    return dayOffset <= 1 ? "buy_monday_tuesday" : "buy_day_before";
  }
  if (dayOffset <= 1) return "buy_monday_tuesday";
  if (dayOffset <= 3) return "buy_midweek";
  return "buy_later_this_week";
}

function freshnessNoteFor(characteristic: WeeklyGroceryRequirement["storageCharacteristic"]) {
  if (characteristic === "shelf_stable") return "Shelf-stable item; check existing stock and storage space before buying for the week.";
  if (characteristic === "longer_keeping_produce") return "Usually keeps longer with suitable storage, but check freshness before cooking.";
  if (characteristic === "leafy_or_highly_perishable") return "For best freshness, consider purchasing close to the planned meal.";
  if (characteristic === "dairy_or_chilled") return "Buy in smaller windows and keep chilled as appropriate.";
  if (characteristic === "protein_or_non_veg") return "Arrange close to cooking day and follow safe handling/storage practices.";
  if (characteristic === "fresh_short_window") return "Plan in smaller quantities according to consumption date and ripeness.";
  return "Use practical storage judgement; climate, ripeness and refrigeration can affect freshness.";
}

async function weeklyGroceries(days: WeeklyFamilyMealPlan["days"], weekStartDate: string, userId?: string): Promise<WeeklyGroceryRequirement[]> {
  const grouped = new Map<string, WeeklyGroceryRequirement>();
  const sourceLines: Array<{ name: string; category: string; quantity: string; quantityToPurchase: string }> = [];

  days.flatMap((day) => day.meals).forEach((slot) => {
    slot.selectedOption.groceryItems.forEach((item) => {
      sourceLines.push({ name: item.name, category: item.category, quantity: item.quantity, quantityToPurchase: item.quantityToPurchase });
      const key = `${item.name.toLowerCase()}#${item.category}`;
      const existing = grouped.get(key);
      const reference = { date: slot.date, mealTime: slot.mealTime, mealName: slot.selectedMealName };
      if (existing) {
        existing.totalQuantity = `${existing.totalQuantity}; ${item.quantity}`;
        existing.quantityToPurchase = `${existing.quantityToPurchase}; ${item.quantityToPurchase}`;
        existing.remainingQuantity = existing.quantityToPurchase;
        existing.estimatedCost.amount += item.estimatedCost.amount;
        existing.mealReferences.push(reference);
        existing.plannedConsumptionDates = Array.from(new Set([...(existing.plannedConsumptionDates ?? []), slot.date])).sort();
        const firstDate = existing.plannedConsumptionDates[0] ?? slot.date;
        existing.procurementWindow = procurementWindowFor(existing.storageCharacteristic, firstDate, weekStartDate);
        return;
      }
      const storageCharacteristic = storageCharacteristicFor(item.name, item.category);
      grouped.set(key, {
        itemId: createId("weekly-grocery"),
        name: item.name,
        category: item.category,
        totalQuantity: item.quantity,
        quantityToPurchase: item.quantityToPurchase,
        remainingQuantity: item.quantityToPurchase,
        purchaseWindow: storageCharacteristic === "shelf_stable" || storageCharacteristic === "longer_keeping_produce" ? "buy_in_advance" : "buy_fresh",
        procurementWindow: procurementWindowFor(storageCharacteristic, slot.date, weekStartDate),
        storageCharacteristic,
        purchasePriority: storageCharacteristic === "leafy_or_highly_perishable" || storageCharacteristic === "protein_or_non_veg" ? "high" : "medium",
        plannedConsumptionDates: [slot.date],
        freshnessNote: freshnessNoteFor(storageCharacteristic),
        estimatedCost: { ...item.estimatedCost },
        mealReferences: [reference],
      });
    });
  });

  const pantry = userId ? await new PantryRepository().listForUser(userId).catch(() => []) : [];
  const precise = aggregateWeeklyGroceries(sourceLines, pantry);
  return Array.from(grouped.values()).map((item) => {
    const result = precise.find((line) => line.name === item.name && line.category === item.category);
    return result ? { ...item, totalQuantity: result.totalQuantity, pantryQuantity: result.pantryQuantity, quantityToPurchase: result.quantityToPurchase, remainingQuantity: result.quantityToPurchase, freshnessNote: result.quantityNeedsConfirmation ? "Quantity needs confirmation; incompatible or unverified measurements were not combined." : item.freshnessNote } : item;
  }).sort((a, b) => a.name.localeCompare(b.name));
}

function procurementTitle(window: ProcurementPurchaseWindow) {
  return {
    buy_this_weekend: "Buy or check this weekend",
    buy_monday_tuesday: "Arrange for Monday-Tuesday",
    buy_midweek: "Arrange midweek",
    buy_later_this_week: "Later this week",
    buy_day_before: "Buy close to cooking day",
    buy_same_day: "Buy same day if possible",
  }[window];
}

function buildProcurementSchedule(items: WeeklyGroceryRequirement[], weekStartDate: string): ProcurementScheduleGroup[] {
  const windows: ProcurementPurchaseWindow[] = ["buy_this_weekend", "buy_monday_tuesday", "buy_midweek", "buy_day_before", "buy_later_this_week", "buy_same_day"];
  return windows
    .map((window) => {
      const groupedItems = items.filter((item) => item.procurementWindow === window);
      return {
        groupId: createId("procurement-group"),
        title: procurementTitle(window),
        description:
          window === "buy_this_weekend"
            ? "Good candidates to check or buy before the week starts, after pantry review."
            : "Freshness-sensitive items should be arranged closer to the meals that need them.",
        recommendedPurchaseDate: window === "buy_this_weekend" ? dateOnly(addDays(parseDateOnly(weekStartDate), -1)) : groupedItems[0]?.plannedConsumptionDates?.[0],
        recommendedWindow: window,
        items: groupedItems,
      };
    })
    .filter((group) => group.items.length > 0);
}

function buildTomorrowReminder(days: WeeklyFamilyMealPlan["days"], items: WeeklyGroceryRequirement[], targetDate: string): TomorrowIngredientReminder {
  const tomorrow = dateOnly(addDays(parseDateOnly(targetDate), 1));
  const tomorrowDay = days.find((day) => day.date === tomorrow);
  const meals = (tomorrowDay?.meals ?? []).map((slot) => ({
    mealTime: slot.mealTime,
    mealName: slot.selectedMealName,
    items: items.filter((item) => item.mealReferences.some((ref) => ref.date === tomorrow && ref.mealTime === slot.mealTime)),
  }));
  const stillToArrange = items.filter((item) => item.plannedConsumptionDates?.includes(tomorrow));
  return { date: tomorrow, meals, stillToArrange };
}

function buildSabSewaRequirement(items: WeeklyGroceryRequirement[]): SabSewaShoppingRequirement[] {
  return items.slice(0, 80).map((item) => ({
    shoppingDate: item.plannedConsumptionDates?.[0] ?? new Date().toISOString().slice(0, 10),
    itemCategory: item.category,
    itemName: item.name,
    requiredQuantity: item.quantityToPurchase,
    preferredPurchaseWindow: item.procurementWindow ?? "buy_this_weekend",
  }));
}

export class WeeklyPlanOwnershipError extends Error {
  constructor() { super("This household is unavailable to the signed-in customer."); }
}

export class WeeklyMealPlanningService {
  private readonly repository = new FamilyMealRepository();
  private readonly aiService = new AIService();
  private readonly safetyValidationService = new SafetyValidationService();

  async getCurrent(familyId: string, targetDate: string) {
    return this.repository.getWeeklyMealPlan(familyId, mondayForDate(targetDate));
  }

  async generateOrGet(request: CreateMealPlanRequest) {
    if (!request.userId) throw new WeeklyPlanOwnershipError();
    const ownPlan = (plan: WeeklyFamilyMealPlan) => {
      if (plan.userId !== request.userId) throw new WeeklyPlanOwnershipError();
      return { weeklyPlan: plan, reusedExisting: true };
    };
    const targetDate = request.targetDate ?? new Date().toISOString().slice(0, 10);
    const weekStartDate = mondayForDate(targetDate);
    const existing = await this.repository.getWeeklyMealPlan(request.familyId, weekStartDate);
    if (existing) return ownPlan(existing);

    const lockAcquired = await this.repository.tryBeginWeeklyMealPlanGeneration(request.familyId, weekStartDate);
    if (!lockAcquired) {
      const inProgressExisting = await this.repository.getWeeklyMealPlan(request.familyId, weekStartDate);
      if (inProgressExisting) return ownPlan(inProgressExisting);
      throw new Error("This weekly plan is already being prepared. Please try again in a moment.");
    }

    try {
      const recheckedExisting = await this.repository.getWeeklyMealPlan(request.familyId, weekStartDate);
      if (recheckedExisting) return ownPlan(recheckedExisting);

      const familyContext = await resolvePlanningHousehold(request);
      if (!familyContext) throw new WeeklyPlanOwnershipError();

      const generatedAt = nowIso();
      const recentMeals: string[] = [...(request.previousMeals ?? [])];
      const days: WeeklyFamilyMealPlan["days"] = [];

      for (let dayIndex = 0; dayIndex < 7; dayIndex += 1) {
      const date = dateOnly(addDays(parseDateOnly(weekStartDate), dayIndex));
      const day = weekDays[dayIndex];
      const meals: WeeklyMealPlanSlot[] = [];

      for (const mealTime of mealTimes) {
        const tiffinRole = mealTime === "school_tiffin" ? "school_going" : mealTime === "office_tiffin" ? "working" : undefined;
        const tiffinMemberIds = tiffinRole ? familyContext.members.filter((member) => member.scheduleRole === tiffinRole && !(member.holidayOrLeaveDates ?? []).includes(date) && (!(member.attendanceDays?.length) || member.attendanceDays.includes(day))).map((member) => member.memberId) : [];
        if (tiffinRole && tiffinMemberIds.length === 0) continue;
        const attendance = tiffinRole ? [{ mealTime, participatingMemberIds: tiffinMemberIds, absentMemberIds: [], fastingMemberIds: [], guestCount: 0, enabled: tiffinMemberIds.length > 0 }] : slotAttendance(request, mealTime);
        const rejected: string[] = [];
        let localized: FamilyMealPlan | undefined;
        for (let attempt = 0; attempt < 5; attempt++) {
          const generated = this.aiService.generateFamilyMealPlan({
          family: {
            ...familyContext.family,
            mealTimings: request.customMealTimings || familyContext.family.mealTimings,
          },
          members: familyContext.members,
          planType: "weekly",
          mealTime,
          mealTimeContext: request.mealTimeContext,
          mealAttendance: attendance,
          highTeaPreference: request.highTeaPreference,
          userPlanningMode: "returning_user_weekly_editable",
          userPromptOverride: request.userPromptOverride,
          previousMeals: recentMeals.slice(-18),
          excludeDishes: [...(request.excludeDishes ?? []), ...rejected],
          targetDate: date,
        });

          const safety = this.safetyValidationService.validateMealPlan(generated, familyContext.members);
          if (safety.ok) {
            const candidate = this.aiService.localizeFamilyMealPlan(generated, request.preferredLanguage || request.mealTimeContext?.locale);
            if (this.safetyValidationService.validateMealPlan(candidate, familyContext.members).ok) {
              localized = candidate;
              break;
            }
          }
          rejected.push(generated.commonMeal.name);
        }
        if (!localized) throw new Error(`No safe weekly meal option found for ${date} ${mealTime}.`);
        recentMeals.push(localized.commonMeal.name);
        meals.push({
          slotId: createId("weekly-slot"),
          date,
          day,
          mealTime,
          primaryOption: localized,
          alternatives: localized.commonMeal.alternativeOptions ?? [],
          selectedOption: localized,
          originalMealName: localized.commonMeal.name,
          selectedMealName: localized.commonMeal.name,
          status: "planned",
          updatedAt: generatedAt,
        });
      }

      days.push({ date, day, meals });
    }

    const weeklyGroceryRequirements = await weeklyGroceries(days, weekStartDate, request.userId);
    const weeklyPlan: WeeklyFamilyMealPlan = {
      weekPlanId: createId("weekly-plan"),
      familyId: request.familyId,
      userId: request.userId,
      weekStartDate,
      weekEndDate: dateOnly(addDays(parseDateOnly(weekStartDate), 6)),
      timezone: request.userTimeZone || request.mealTimeContext?.timeZone || "Asia/Kolkata",
      preferredLanguage: request.preferredLanguage || request.mealTimeContext?.locale || "en",
      planVersion: 1,
      generatedAt,
      updatedAt: generatedAt,
      status: "active",
      days,
      weeklyGroceryRequirements,
      procurementSchedule: buildProcurementSchedule(weeklyGroceryRequirements, weekStartDate),
      tomorrowIngredientReminder: buildTomorrowReminder(days, weeklyGroceryRequirements, targetDate),
      sabSewaShoppingRequirement: buildSabSewaRequirement(weeklyGroceryRequirements),
      procurementSafetyNote: "Advance planning shows approximate requirements only. For best freshness, buy perishable foods closer to cooking day and follow safe storage practices.",
      changeLog: [],
    };

      await this.repository.saveWeeklyMealPlan(weeklyPlan);
      return { weeklyPlan, reusedExisting: false };
    } finally {
      await this.repository.endWeeklyMealPlanGeneration(request.familyId, weekStartDate).catch(() => undefined);
    }
  }

  async selectSlot(input: { familyId: string; weekStartDate: string; slotId: string; selectedMealPlan: FamilyMealPlan; reason?: string; expectedPlanVersion: number }) {
    const existing = await this.repository.getWeeklyMealPlan(input.familyId, input.weekStartDate);
    if (!existing) throw new Error("Weekly meal plan not found.");
    const familyContext = await resolvePlanningHousehold({ familyId: input.familyId, userId: existing.userId, planType: "weekly" } as CreateMealPlanRequest);
    if (!familyContext) throw new Error("Family not found.");
    const substitutionSafety = this.safetyValidationService.validateMealPlan(input.selectedMealPlan, familyContext.members);
    if (!substitutionSafety.ok) throw new Error(`Weekly meal substitution failed safety validation: ${[...substitutionSafety.errors, ...substitutionSafety.warnings].join(" ")}`);
    const updatedAt = nowIso();
    const nextDays = existing.days.map((day) => ({
      ...day,
      meals: day.meals.map((slot) => {
        if (slot.slotId !== input.slotId) return slot;
        return {
          ...slot,
          selectedOption: input.selectedMealPlan,
          selectedMealName: input.selectedMealPlan.commonMeal.name,
          status: "changed" as const,
          userChangeReason: input.reason,
          updatedAt,
        };
      }),
    }));
    const changedSlot = nextDays.flatMap((day) => day.meals).find((slot) => slot.slotId === input.slotId);
    const weeklyGroceryRequirements = await weeklyGroceries(nextDays, existing.weekStartDate, existing.userId);
    const nextPlan: WeeklyFamilyMealPlan = {
      ...existing,
      days: nextDays,
      planVersion: existing.planVersion + 1,
      updatedAt,
      weeklyGroceryRequirements,
      procurementSchedule: buildProcurementSchedule(weeklyGroceryRequirements, existing.weekStartDate),
      tomorrowIngredientReminder: buildTomorrowReminder(nextDays, weeklyGroceryRequirements, new Date().toISOString().slice(0, 10)),
      sabSewaShoppingRequirement: buildSabSewaRequirement(weeklyGroceryRequirements),
      changeLog: changedSlot
        ? [
          ...existing.changeLog,
          {
            changedAt: updatedAt,
            date: changedSlot.date,
            mealTime: changedSlot.mealTime,
            originalMealName: changedSlot.originalMealName,
            selectedMealName: changedSlot.selectedMealName,
            reason: input.reason,
            planVersion: existing.planVersion + 1,
          },
        ]
        : existing.changeLog,
    };
    if (existing.planVersion !== input.expectedPlanVersion) throw new Error("WEEKLY_PLAN_VERSION_CONFLICT");
    await this.repository.saveWeeklyMealPlan(nextPlan, input.expectedPlanVersion);
    return { weeklyPlan: nextPlan };
  }
}


