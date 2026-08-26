import { NextResponse } from "next/server";
import { z } from "zod";
import { CustomerProfileRepository } from "@/lib/repositories/customer-profile-repository";
import {
  customerUserIdFromIdentity,
  setCustomerSessionCookie,
} from "@/lib/server/customer-session";
import { authErrorResponse, requireUser } from "@/lib/server/auth";

const memberSchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(1),
  relation: z.string().trim().min(1),
  foodPreference: z
    .enum(["vegetarian", "eggetarian", "non_vegetarian", "semi_vegetarian", "vegan", "other"])
    .default("vegetarian"),
  allergies: z.array(z.string()).default([]),
  doctorAdvisedRestrictions: z.array(z.string()).default([]),
  dislikes: z.array(z.string()).default([]),
  mealStrategyPreference: z.enum(["common", "allow_separate"]).default("common"),
});

const familyProfileSchema = z.object({
  customer: z.object({
    name: z.string().trim().min(2),
    email: z.string().trim().email().optional().or(z.literal("")),
    mobile: z.string().trim().min(6).optional().or(z.literal("")),
    preferredLanguage: z.string().optional(),
    householdFoodPreference: z
      .enum(["vegetarian", "eggetarian", "non_vegetarian", "semi_vegetarian", "vegan", "mixed", "other"])
      .default("vegetarian"),
    cookingHabit: z
      .enum(["fresh_home_cooked", "ready_frozen", "fresh_ready_mix", "takeaway_prepared", "other"])
      .default("fresh_home_cooked"),
  }),
  members: z.array(memberSchema).min(1),
});

function identityFor(customer: z.infer<typeof familyProfileSchema>["customer"]) {
  return customer.mobile || customer.email || customer.name;
}

export async function GET(request: Request) {
  try {
    const user = requireUser(request);
    const repository = new CustomerProfileRepository();
    const familyProfile = await repository.getFamilyProfile(user.userId);
    return NextResponse.json({ familyProfile });
  } catch (error) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;
    return NextResponse.json(
      { error: { code: "FAMILY_PROFILE_READ_FAILED", message: "Unable to read family profile." } },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = familyProfileSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: {
            code: "FAMILY_PROFILE_INVALID",
            message: "Please add at least one member and provide your account details.",
            details: parsed.error.issues,
          },
        },
        { status: 400 }
      );
    }

    const { customer } = parsed.data;
    const members = parsed.data.members.map((member) => ({
      id: member.id,
      name: member.name,
      relation: member.relation,
      foodPreference: member.foodPreference ?? "vegetarian",
      allergies: member.allergies ?? [],
      doctorAdvisedRestrictions: member.doctorAdvisedRestrictions ?? [],
      dislikes: member.dislikes ?? [],
      mealStrategyPreference: member.mealStrategyPreference ?? "common",
    }));
    const userId = customerUserIdFromIdentity(identityFor(customer));
    const repository = new CustomerProfileRepository();

    const customerRecord = await repository.upsertCustomer({
      userId,
      name: customer.name,
      email: customer.email || undefined,
      mobile: customer.mobile || undefined,
      preferredLanguage: customer.preferredLanguage,
      householdFoodPreference: customer.householdFoodPreference,
      cookingHabit: customer.cookingHabit,
    });
    const familyProfile = await repository.saveFamilyProfile({ userId, members });

    const response = NextResponse.json({
      saved: true,
      userId,
      customer: customerRecord,
      familyProfile,
      message: "Family profile saved. Continue to subscription.",
    });
    setCustomerSessionCookie(response, userId);
    return response;
  } catch (error) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;
    return NextResponse.json(
      {
        error: {
          code: "FAMILY_PROFILE_SAVE_FAILED",
          message: error instanceof Error ? error.message : "Unable to save family profile.",
        },
      },
      { status: 500 }
    );
  }
}
