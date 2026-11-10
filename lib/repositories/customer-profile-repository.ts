import { GetCommand, PutCommand, QueryCommand, TransactWriteCommand } from "@aws-sdk/lib-dynamodb";
import { getMamaAiTableName, mamaAiDynamoDb } from "./dynamodb-client";
import { createId } from "./in-memory-store";
export class HouseholdReplacementError extends Error { constructor(public code:"HOUSEHOLD_REPLACEMENT_COOLDOWN_ACTIVE"|"HOUSEHOLD_REPLACEMENT_CONFLICT", public allowedAfter?:string){super(code);} }
import type {
  DayWiseFoodRoutinePreference,
  DayAttendancePlan,
  MealTimingPattern,
  MealTypePreferenceProfile,
  RecentMealHistoryDay,
  WeeklyFoodRoutineStatus,
} from "@/lib/shared/contracts";
import type { SnapMealEntry } from "@/lib/shared/snap-meal";

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
  favoriteFoodTags?: string[];
  recentMealHistory?: RecentMealHistoryDay[];
  regularAttendancePattern?: DayAttendancePlan;
  nonVegPreferredFoods?: string[];
  snapMealEntries?: SnapMealEntry[];
  createdAt: string;
  updatedAt: string;
}

export interface CustomerFamilyMemberProfile {
  id: string;
  name: string;
  relation: string;
  age?: number;
  activityLevel?: "sedentary" | "light" | "moderate" | "heavy" | "athlete";
  foodPreference?: "vegetarian" | "eggetarian" | "non_vegetarian" | "semi_vegetarian" | "vegan" | "pescatarian" | "jain" | "other";
  dietaryPermissions?: { eggs?: boolean; fish?: boolean; shellfish?: boolean; poultry?: boolean; redMeat?: boolean; otherMeat?: boolean; onion?: boolean; garlic?: boolean; rootVegetables?: boolean };
  weekdayDietRules?: Array<{ day?: string; fasting?: boolean; vegetarianOnly?: boolean; exclude?: string[] }>;
  festivalDietRules?: Array<{ name?: string; confirmedByCustomer?: true; from?: string; to?: string; exclude?: string[] }>;
  nonVegFrequency?: "occasionally" | "1_2_days_per_week" | "3_4_days_per_week" | "4_5_days_per_week" | "most_days" | "custom";
  nonVegAvoidDays?: string[];
  nonVegCustomRule?: string;
  allergies: string[];
  doctorAdvisedRestrictions: string[];
  dislikes: string[];
  mealStrategyPreference: "common" | "allow_separate";
  scheduleRole?: "school_going" | "working" | "other";
  attendanceDays?: string[];
  holidayOrLeaveDates?: string[];
  tiffinPreferences?: string[];
  packingStorageLimitations?: string[];
  preferredPreparationTime?: string;
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
  async getPendingHouseholdException(userId: string) { const result=await mamaAiDynamoDb.send(new QueryCommand({TableName:getMamaAiTableName(),KeyConditionExpression:"PK = :pk AND begins_with(SK, :prefix)",ExpressionAttributeValues:{":pk":`USER#${userId}`,":prefix":"HOUSEHOLD_EXCEPTION#"}})); return (result.Items??[]).map(item=>item.record).find((record:any)=>record?.status==="PENDING"); }
  async createHouseholdException(input:{userId:string;familyId:string;reason:string;requestId:string;createdAt:string}) { const record={requestId:input.requestId,userId:input.userId,familyId:input.familyId,reason:input.reason,status:"PENDING" as const,createdAt:input.createdAt}; await mamaAiDynamoDb.send(new TransactWriteCommand({TransactItems:[{Put:{TableName:getMamaAiTableName(),Item:{PK:`USER#${input.userId}`,SK:"HOUSEHOLD_EXCEPTION#PENDING",entityType:"household_exception_pending_lock",record},ConditionExpression:"attribute_not_exists(PK)"}},{Put:{TableName:getMamaAiTableName(),Item:{PK:`USER#${input.userId}`,SK:`HOUSEHOLD_EXCEPTION#${input.requestId}`,entityType:"household_exception",record},ConditionExpression:"attribute_not_exists(PK)"}},{Put:{TableName:getMamaAiTableName(),Item:{PK:`USER#${input.userId}`,SK:`HOUSEHOLD_EXCEPTION_AUDIT#${input.createdAt}#${input.requestId}`,entityType:"household_exception_audit",event:"submitted",createdAt:input.createdAt},ConditionExpression:"attribute_not_exists(PK)"}}]})); return record; }
  async replaceFamilyProfile(input: { userId: string; expectedVersion: number; previous: CustomerFamilyProfileRecord; members: CustomerFamilyMemberProfile[]; reason: string; replacementId: string; now: string; cooldownUntil: string; }) {
    const next: CustomerFamilyProfileRecord & { replacementVersion: number; replacedAt: string; replacementReason: string } = { ...input.previous, members: input.members, memberCount: input.members.length, suggestedPlan: input.members.length >= 7 ? "family_plus" : input.members.length >= 5 ? "premium" : "starter", updatedAt: input.now, replacementVersion: input.expectedVersion + 1, replacedAt: input.now, replacementReason: input.reason };
    try { await mamaAiDynamoDb.send(new TransactWriteCommand({ TransactItems: [
      { Put: { TableName: getMamaAiTableName(), Item: { PK: `USER#${input.userId}`, SK: "FAMILY_PROFILE#CURRENT", entityType: "customer_family_profile", record: next, updatedAt: input.now }, ConditionExpression: "attribute_not_exists(#record.#replacementVersion) OR #record.#replacementVersion = :version", ExpressionAttributeNames: { "#record": "record", "#replacementVersion": "replacementVersion" }, ExpressionAttributeValues: { ":version": input.expectedVersion } } },
      { Put: { TableName: getMamaAiTableName(), Item: { PK: `USER#${input.userId}`, SK: `FAMILY_PROFILE#HISTORY#${input.replacementId}`, entityType: "customer_family_profile_history", record: input.previous, replacedAt: input.now, replacementReason: input.reason }, ConditionExpression: "attribute_not_exists(PK)" } },
      { Put: { TableName: getMamaAiTableName(), Item: { PK: `USER#${input.userId}`, SK: `HOUSEHOLD_AUDIT#${input.now}#${input.replacementId}`, entityType: "household_replacement_audit", event: "household_replaced", reason: input.reason, createdAt: input.now }, ConditionExpression: "attribute_not_exists(PK)" } },
      { Put: { TableName: getMamaAiTableName(), Item: { PK: `ACCOUNT#${input.userId}`, SK: "HOUSEHOLD_REPLACEMENT", entityType: "household_replacement_cooldown", replacementId: input.replacementId, allowedAfter: input.cooldownUntil, createdAt: input.now }, ConditionExpression: "attribute_not_exists(PK) OR allowedAfter <= :now", ExpressionAttributeValues: { ":now": input.now } } },
    ] })); } catch(error) { const reasons=(error as {CancellationReasons?:Array<{Code?:string}>}).CancellationReasons; if((error as {name?:string}).name==="TransactionCanceledException"&&reasons){if(reasons[3]?.Code==="ConditionalCheckFailed") throw new HouseholdReplacementError("HOUSEHOLD_REPLACEMENT_COOLDOWN_ACTIVE");if(reasons[0]?.Code==="ConditionalCheckFailed") throw new HouseholdReplacementError("HOUSEHOLD_REPLACEMENT_CONFLICT");} throw error; }
    return next;
  }
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
    favoriteFoodTags?: CustomerAccountRecord["favoriteFoodTags"];
    recentMealHistory?: CustomerAccountRecord["recentMealHistory"];
    regularAttendancePattern?: CustomerAccountRecord["regularAttendancePattern"];
    nonVegPreferredFoods?: CustomerAccountRecord["nonVegPreferredFoods"];
    snapMealEntries?: CustomerAccountRecord["snapMealEntries"];
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
      favoriteFoodTags: input.favoriteFoodTags ?? existing?.favoriteFoodTags ?? [],
      recentMealHistory: input.recentMealHistory ?? existing?.recentMealHistory ?? [],
      regularAttendancePattern: input.regularAttendancePattern ?? existing?.regularAttendancePattern,
      nonVegPreferredFoods: input.nonVegPreferredFoods ?? existing?.nonVegPreferredFoods ?? [],
      snapMealEntries: input.snapMealEntries ?? existing?.snapMealEntries ?? [],
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
