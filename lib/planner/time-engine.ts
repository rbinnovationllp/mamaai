// lib/planner/time-engine.ts
import { MealTimingPattern } from "@/lib/shared/contracts";

export type MealSlot = "breakfast" | "lunch" | "snacks" | "dinner";

const DEFAULT_TIMINGS: Record<MealSlot, string> = {
    breakfast: "08:30",
    lunch: "13:30",
    snacks: "17:00",
    dinner: "20:30",
};

export function resolveNextMealSlot(
    savedTimings?: MealTimingPattern,
    clientDate: Date = new Date()
): { slot: MealSlot; scheduledTime: string; isTomorrow: boolean } {
    const timings = {
        breakfast: savedTimings?.breakfast || DEFAULT_TIMINGS.breakfast,
        lunch: savedTimings?.lunch || DEFAULT_TIMINGS.lunch,
        snacks: savedTimings?.snacks || DEFAULT_TIMINGS.snacks,
        dinner: savedTimings?.dinner || DEFAULT_TIMINGS.dinner,
    };

    const currentMinutes = clientDate.getHours() * 60 + clientDate.getMinutes();

    const toMinutes = (timeStr: string) => {
        const [h, m] = timeStr.split(":").map(Number);
        return h * 60 + m;
    };

    const order: MealSlot[] = ["breakfast", "lunch", "snacks", "dinner"];

    // Meal preparation lead window: 30 minutes past meal time transitions to next meal
    for (const slot of order) {
        const slotMinutes = toMinutes(timings[slot]);
        if (currentMinutes <= slotMinutes + 30) {
            return { slot, scheduledTime: timings[slot], isTomorrow: false };
        }
    }

    // After dinner -> Next day's breakfast
    return { slot: "breakfast", scheduledTime: timings.breakfast, isTomorrow: true };
}