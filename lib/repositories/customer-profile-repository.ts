import { GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import { getMamaAiTableName, mamaAiDynamoDb } from "./dynamodb-client";
import { createId } from "./in-memory-store";
import type {
  DayWiseFoodRoutinePreference,
  DayAttendancePlan,
  MealTimingPattern,
  MealTypePreferenceProfile,
  RecentMealHistoryDay,
  WeeklyFoodRoutineStatus,
} from "@/lib/shared/contracts";

export interface CustomerAccountRecord {
  userId: string;
  name: string;
  email?: string;
  mobile?: string;
  preferredLanguage?: string;
  householdFoodPreference?: "vegetarian" | "eggetarian" | "non_vegetarian" | "semi_vegetarian" | "vegan" | "mixed" | "other";
  cookingHabit?: "fresh_home_cooked" | "ready_frozen" | "fresh_ready_mix" | "takeaway_prepared" | "other";
  budgetPreference?: "economical" | "moderate" | "flexible" | "no_specific_limit" | "custom_monthly";
  customMonthlyFoodBudget?: number;
  weeklyFoodRoutineStatus?: WeeklyFoodRoutineStatus;
  weeklyFoodRoutine?: DayWiseFoodRoutinePreference[];
  mealTypePreferences?: MealTypePreferenceProfile;
  mealTimings?: MealTimingPattern;
  recentMealHistory?: RecentMealHistoryDay[];
  regularAttendancePattern?: DayAttendancePlan;
  nonVegPreferredFoods?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CustomerFamilyMemberProfile {
  id: string;
  name: string;
  relation: string;
  age?: number;
  activityLevel?: "sedentary" | "light" | "moderate" | "heavy" | "athlete";
  foodPreference?: "vegetarian" | "eggetarian" | "non_vegetarian" | "semi_vegetarian" | "vegan" | "other";
  nonVegFrequency?: "occasionally" | "1_2_days_per_week" | "3_4_days_per_week" | "4_5_days_per_week" | "most_days" | "custom";
  nonVegAvoidDays?: string[];
  nonVegCustomRule?: string;
  allergies: string[];
  doctorAdvisedRestrictions: string[];
  dislikes: string[];
  mealStrategyPreference: "common" | "allow_separate";
}

export interface CustomerFamilyProfileRecord {
  userId: string;
  familyId: string;
  members: CustomerFamilyMemberProfile[];
  memberCount: number;
  suggestedPlan: "starter" | "premium" | "family_plus";
  source: "customer_onboarding";
  createdAt: string;
  updatedAt: string;
}

function nowIso() {
  return new Date().toISOString();
}

export class CustomerProfileRepository {
  async upsertCustomer(input: {
    userId: string;
    name: string;
    email?: string;
    mobile?: string;
    preferredLanguage?: string;
    householdFoodPreference?: CustomerAccountRecord["householdFoodPreference"];
    cookingHabit?: CustomerAccountRecord["cookingHabit"];
    budgetPreference?: CustomerAccountRecord["budgetPreference"];
    customMonthlyFoodBudget?: CustomerAccountRecord["customMonthlyFoodBudget"];
    weeklyFoodRoutineStatus?: CustomerAccountRecord["weeklyFoodRoutineStatus"];
    weeklyFoodRoutine?: CustomerAccountRecord["weeklyFoodRoutine"];
    mealTypePreferences?: CustomerAccountRecord["mealTypePreferences"];
    mealTimings?: CustomerAccountRecord["mealTimings"];
    recentMealHistory?: CustomerAccountRecord["recentMealHistory"];
    regularAttendancePattern?: CustomerAccountRecord["regularAttendancePattern"];
    nonVegPreferredFoods?: CustomerAccountRecord["nonVegPreferredFoods"];
  }): Promise<CustomerAccountRecord> {
    const timestamp = nowIso();
    const existing = await this.getCustomer(input.userId);
    const record: CustomerAccountRecord = {
      userId: input.userId,
      name: input.name,
      email: input.email,
      mobile: input.mobile,
      preferredLanguage: input.preferredLanguage,
      householdFoodPreference: input.householdFoodPreference ?? existing?.householdFoodPreference,
      cookingHabit: input.cookingHabit ?? existing?.cookingHabit,
      budgetPreference: input.budgetPreference ?? existing?.budgetPreference ?? "moderate",
      customMonthlyFoodBudget: input.customMonthlyFoodBudget ?? existing?.customMonthlyFoodBudget,
      weeklyFoodRoutineStatus: input.weeklyFoodRoutineStatus ?? existing?.weeklyFoodRoutineStatus ?? "skip",
      weeklyFoodRoutine: input.weeklyFoodRoutine ?? existing?.weeklyFoodRoutine ?? [],
      mealTypePreferences: input.mealTypePreferences ?? existing?.mealTypePreferences ?? {},
      mealTimings: input.mealTimings ?? existing?.mealTimings ?? {},
      recentMealHistory: input.recentMealHistory ?? existing?.recentMealHistory ?? [],
      regularAttendancePattern: input.regularAttendancePattern ?? existing?.regularAttendancePattern,
      nonVegPreferredFoods: input.nonVegPreferredFoods ?? existing?.nonVegPreferredFoods ?? [],
      createdAt: existing?.createdAt ?? timestamp,
      updatedAt: timestamp,
    };

    await mamaAiDynamoDb.send(
      new PutCommand({
        TableName: getMamaAiTableName(),
        Item: {
          PK: `USER#${input.userId}`,
          SK: "CUSTOMER#PROFILE",
          GSI1PK: "CUSTOMER_ACCOUNTS",
          GSI1SK: timestamp,
          entityType: "customer_account",
          record,
          updatedAt: timestamp,
        },
      })
    );

    return record;
  }

  async getCustomer(userId: string): Promise<CustomerAccountRecord | undefined> {
    const response = await mamaAiDynamoDb.send(
      new GetCommand({
        TableName: getMamaAiTableName(),
        Key: {
          PK: `USER#${userId}`,
          SK: "CUSTOMER#PROFILE",
        },
      })
    );

    return response.Item?.record as CustomerAccountRecord | undefined;
  }

  async saveFamilyProfile(input: {
    userId: string;
    members: CustomerFamilyMemberProfile[];
  }): Promise<CustomerFamilyProfileRecord> {
    const timestamp = nowIso();
    const existing = await this.getFamilyProfile(input.userId);
    const memberCount = input.members.length;
    const suggestedPlan =
      memberCount >= 7 ? "family_plus" : memberCount >= 5 ? "premium" : "starter";

    const record: CustomerFamilyProfileRecord = {
      userId: input.userId,
      familyId: existing?.familyId ?? createId("family"),
      members: input.members,
      memberCount,
      suggestedPlan,
      source: "customer_onboarding",
      createdAt: existing?.createdAt ?? timestamp,
      updatedAt: timestamp,
    };

    await mamaAiDynamoDb.send(
      new PutCommand({
        TableName: getMamaAiTableName(),
        Item: {
          PK: `USER#${input.userId}`,
          SK: "FAMILY_PROFILE#CURRENT",
          GSI1PK: `FAMILY_PROFILE#${input.userId}`,
          GSI1SK: timestamp,
          entityType: "customer_family_profile",
          record,
          updatedAt: timestamp,
        },
      })
    );

    return record;
  }

  async getFamilyProfile(userId: string): Promise<CustomerFamilyProfileRecord | undefined> {
    const response = await mamaAiDynamoDb.send(
      new GetCommand({
        TableName: getMamaAiTableName(),
        Key: {
          PK: `USER#${userId}`,
          SK: "FAMILY_PROFILE#CURRENT",
        },
      })
    );

    return response.Item?.record as CustomerFamilyProfileRecord | undefined;
  }
}
