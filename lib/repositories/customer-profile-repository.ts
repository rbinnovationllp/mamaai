import { GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import { getMamaAiTableName, mamaAiDynamoDb } from "./dynamodb-client";

export interface CustomerAccountRecord {
  userId: string;
  name: string;
  email?: string;
  mobile?: string;
  preferredLanguage?: string;
  householdFoodPreference?: "vegetarian" | "eggetarian" | "non_vegetarian" | "semi_vegetarian" | "vegan" | "mixed" | "other";
  cookingHabit?: "fresh_home_cooked" | "ready_frozen" | "fresh_ready_mix" | "takeaway_prepared" | "other";
  createdAt: string;
  updatedAt: string;
}

export interface CustomerFamilyMemberProfile {
  id: string;
  name: string;
  relation: string;
  foodPreference?: "vegetarian" | "eggetarian" | "non_vegetarian" | "semi_vegetarian" | "vegan" | "other";
  allergies: string[];
  doctorAdvisedRestrictions: string[];
  dislikes: string[];
  mealStrategyPreference: "common" | "allow_separate";
}

export interface CustomerFamilyProfileRecord {
  userId: string;
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
