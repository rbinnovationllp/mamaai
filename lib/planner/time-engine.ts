import {
    MealTimetableSchedule,
    MealTimingPattern,
    MealOccasion,
    MealSlot,
    DayAttendancePlan,
} from "@/lib/shared/contracts";

export type { MealSlot, MealOccasion };

export interface NextMealSlotResult {
    slot: MealSlot;
    occasion: MealOccasion;
    targetTime: string;
    scheduledTime: string;
    isTomorrow: boolean;
}

export const DEFAULT_MEAL_SCHEDULE: MealTimetableSchedule = {
    reminderLeadTimeMinutes: 45,
    weekday: {
        breakfast: { enabled: true, time: "08:00" },
        brunch: { enabled: false, time: "11:00" },
        lunch: { enabled: true, time: "13:00" },
        afternoon_snack: { enabled: false, time: "16:00" },
        high_tea: { enabled: true, time: "17:00" },
        dinner: { enabled: true, time: "20:00" },
        supper: { enabled: false, time: "22:00" },
    },
    useSeparateWeekendSchedule: false,
};

export function mapOccasionToSlot(occasion: MealOccasion): MealSlot {
    if (occasion === "breakfast" || occasion === "brunch") return "breakfast";
    if (occasion === "lunch") return "lunch";
    if (occasion === "afternoon_snack" || occasion === "high_tea") return "snacks";
    return "dinner";
}

export function timeToMinutes(timeStr: string): number {
    const [hours = 0, minutes = 0] = timeStr.split(":").map(Number);
    return hours * 60 + minutes;
}

/**
 * Normalizes either a structured MealTimetableSchedule or a legacy MealTimingPattern
 * into a standard Record<MealOccasion, { enabled: boolean; time: string }>
 */
export function resolveCurrentSchedule(
    schedule?: MealTimetableSchedule | MealTimingPattern,
    localDate: Date = new Date()
): Record<MealOccasion, { enabled: boolean; time: string }> {
    if (!schedule) {
        return DEFAULT_MEAL_SCHEDULE.weekday;
    }

    // Handle structured MealTimetableSchedule
    if ("weekday" in schedule && schedule.weekday) {
        const isWeekend = localDate.getDay() === 0 || localDate.getDay() === 6;
        if (isWeekend && schedule.useSeparateWeekendSchedule && schedule.weekend) {
            return schedule.weekend;
        }
        return schedule.weekday;
    }

    // Handle legacy/simple MealTimingPattern ({ breakfast?: string, lunch?: string, ... })
    const pattern = schedule as MealTimingPattern;
    return {
        breakfast: { enabled: Boolean(pattern.breakfast), time: pattern.breakfast || "08:00" },
        brunch: { enabled: false, time: "11:00" },
        lunch: { enabled: Boolean(pattern.lunch), time: pattern.lunch || "13:00" },
        afternoon_snack: { enabled: false, time: "16:00" },
        high_tea: { enabled: Boolean(pattern.snacks), time: pattern.snacks || "17:00" },
        dinner: { enabled: Boolean(pattern.dinner), time: pattern.dinner || "20:00" },
        supper: { enabled: false, time: "22:00" },
    };
}

export function resolveNextMealSlot(
    schedule?: MealTimetableSchedule | MealTimingPattern,
    localDate: Date = new Date()
): NextMealSlotResult {
    const activeSched = resolveCurrentSchedule(schedule, localDate);
    const currentMinutes = localDate.getHours() * 60 + localDate.getMinutes();

    const enabledSlots = Object.entries(activeSched)
        .filter(([, cfg]) => cfg.enabled)
        .map(([occasion, cfg]) => ({
            occasion: occasion as MealOccasion,
            time: cfg.time,
            minutes: timeToMinutes(cfg.time),
        }))
        .sort((a, b) => a.minutes - b.minutes);

    // Find next upcoming meal with a 30-minute transition buffer
    for (const slot of enabledSlots) {
        if (currentMinutes <= slot.minutes + 30) {
            return {
                slot: mapOccasionToSlot(slot.occasion),
                occasion: slot.occasion,
                targetTime: slot.time,
                scheduledTime: slot.time,
                isTomorrow: false,
            };
        }
    }

    // Loop back to the first meal of tomorrow if past today's last slot
    const firstSlot = enabledSlots[0] || { occasion: "breakfast" as MealOccasion, time: "08:00" };
    return {
        slot: mapOccasionToSlot(firstSlot.occasion),
        occasion: firstSlot.occasion,
        targetTime: firstSlot.time,
        scheduledTime: firstSlot.time,
        isTomorrow: true,
    };
}

export function checkUpcomingReminder(params: {
    schedule?: MealTimetableSchedule | MealTimingPattern;
    attendance?: DayAttendancePlan;
    confirmedSlots?: string[];
    dismissedUntil?: Record<string, number>;
    localDate?: Date;
}): { shouldRemind: boolean; occasion?: MealOccasion; slot?: MealSlot; targetTime?: string; scheduledTime?: string } {
    const now = params.localDate || new Date();
    const leadMinutes =
        params.schedule && "reminderLeadTimeMinutes" in params.schedule && params.schedule.reminderLeadTimeMinutes
            ? params.schedule.reminderLeadTimeMinutes
            : 45;
    const activeSched = resolveCurrentSchedule(params.schedule, now);
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const dateKey = now.toISOString().slice(0, 10);

    for (const [occStr, cfg] of Object.entries(activeSched)) {
        if (!cfg.enabled) continue;

        const occasion = occStr as MealOccasion;
        const slot = mapOccasionToSlot(occasion);
        const slotKey = `${dateKey}_${slot}`;
        const mealMinutes = timeToMinutes(cfg.time);

        // 1. Check if within reminder window (leadMinutes before up to 15 mins after)
        const isInWindow =
            currentMinutes >= mealMinutes - leadMinutes && currentMinutes <= mealMinutes + 15;
        if (!isInWindow) continue;

        // 2. Skip if already confirmed/viewed
        if (params.confirmedSlots?.includes(slotKey)) continue;

        // 3. Skip if snoozed/dismissed
        if (params.dismissedUntil?.[slotKey] && Date.now() < params.dismissedUntil[slotKey]) continue;

        // 4. Skip if all members are marked as "skip" / Not Eating
        if (params.attendance) {
            const slotAttendance = params.attendance[slot];
            if (slotAttendance) {
                const activeEaters = Object.values(slotAttendance).filter((s) => s !== "skip");
                if (activeEaters.length === 0) continue;
            }
        }

        return { shouldRemind: true, occasion, slot, targetTime: cfg.time, scheduledTime: cfg.time };
    }

    return { shouldRemind: false };
}