import { NextResponse } from "next/server";
import { z } from "zod";
import { CustomerProfileRepository } from "@/lib/repositories/customer-profile-repository";
import { authErrorResponse, requireUser } from "@/lib/server/auth";

const attendanceStatusSchema = z.enum(["home", "tiffin", "skip", "fasting"]);

const dayAttendancePlanSchema = z.object({
  breakfast: z.record(z.string(), attendanceStatusSchema).default({}),
  lunch: z.record(z.string(), attendanceStatusSchema).default({}),
  snacks: z.record(z.string(), attendanceStatusSchema).default({}),
  dinner: z.record(z.string(), attendanceStatusSchema).default({}),
  guestCountBySlot: z
    .object({
      breakfast: z.number().int().nonnegative().optional(),
      lunch: z.number().int().nonnegative().optional(),
      snacks: z.number().int().nonnegative().optional(),
      dinner: z.number().int().nonnegative().optional(),
    })
    .optional(),
});

export async function GET(request: Request) {
  try {
    const user = requireUser(request);
    const customer = await new CustomerProfileRepository().getCustomer(user.userId);
    return NextResponse.json({ regularAttendancePattern: customer?.regularAttendancePattern ?? null });
  } catch (error) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;
    return NextResponse.json(
      { error: { code: "ATTENDANCE_PATTERN_READ_FAILED", message: "Unable to read attendance pattern." } },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = requireUser(request);
    const body = await request.json();
    const parsed = dayAttendancePlanSchema.safeParse(body?.regularAttendancePattern ?? body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: "ATTENDANCE_PATTERN_INVALID", message: "Attendance pattern is invalid.", details: parsed.error.issues } },
        { status: 400 }
      );
    }

    const repository = new CustomerProfileRepository();
    const existing = await repository.getCustomer(user.userId);
    if (!existing) {
      return NextResponse.json(
        { error: { code: "CUSTOMER_PROFILE_MISSING", message: "Please save your family profile before saving an attendance pattern." } },
        { status: 404 }
      );
    }

    const regularAttendancePattern = {
      breakfast: parsed.data.breakfast ?? {},
      lunch: parsed.data.lunch ?? {},
      snacks: parsed.data.snacks ?? {},
      dinner: parsed.data.dinner ?? {},
      guestCountBySlot: parsed.data.guestCountBySlot,
    };

    const customer = await repository.upsertCustomer({
      userId: existing.userId,
      name: existing.name,
      email: existing.email,
      mobile: existing.mobile,
      preferredLanguage: existing.preferredLanguage,
      householdFoodPreference: existing.householdFoodPreference,
      cookingHabit: existing.cookingHabit,
      budgetPreference: existing.budgetPreference,
      customMonthlyFoodBudget: existing.customMonthlyFoodBudget,
      weeklyFoodRoutineStatus: existing.weeklyFoodRoutineStatus,
      weeklyFoodRoutine: existing.weeklyFoodRoutine,
      mealTypePreferences: existing.mealTypePreferences,
      mealTimings: existing.mealTimings,
      recentMealHistory: existing.recentMealHistory,
      regularAttendancePattern,
      nonVegPreferredFoods: existing.nonVegPreferredFoods,
    });

    return NextResponse.json({ saved: true, regularAttendancePattern: customer.regularAttendancePattern });
  } catch (error) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;
    return NextResponse.json(
      { error: { code: "ATTENDANCE_PATTERN_SAVE_FAILED", message: "Unable to save attendance pattern." } },
      { status: 500 }
    );
  }
}
