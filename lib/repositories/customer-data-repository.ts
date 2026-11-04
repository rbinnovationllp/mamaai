import { QueryCommand } from "@aws-sdk/lib-dynamodb";
import { getMamaAiTableName, mamaAiDynamoDb } from "./dynamodb-client";
import { CustomerProfileRepository } from "./customer-profile-repository";
import { PantryRepository } from "./pantry-repository";
import { SubscriptionRepository } from "./subscription-repository";

export interface CustomerDataExport {
  generatedAt: string;
  userId: string;
  account?: unknown;
  familyProfile?: unknown;
  pantry: unknown[];
  subscriptions: unknown[];
  payments: unknown[];
  feedback: unknown[];
  mealPlans: unknown[];
  weeklyPlans: unknown[];
  petProfiles: unknown[];
  petPantry: unknown[];
  petSchedules: unknown[];
  exclusions: Array<{ data: string; reason: string }>;
}

async function query(prefix: string, userId: string) {
  const response = await mamaAiDynamoDb.send(new QueryCommand({
    TableName: getMamaAiTableName(),
    KeyConditionExpression: "PK = :pk AND begins_with(SK, :prefix)",
    ExpressionAttributeValues: { ":pk": `USER#${userId}`, ":prefix": prefix },
  }));
  return (response.Items ?? []).map((item) => item.record).filter(Boolean);
}

async function queryFamily(indexKey: string, familyId: string) {
  const response = await mamaAiDynamoDb.send(new QueryCommand({
    TableName: getMamaAiTableName(),
    IndexName: process.env.MAMA_AI_DYNAMODB_GSI1_NAME ?? "GSI1",
    KeyConditionExpression: "GSI1PK = :pk",
    ExpressionAttributeValues: { ":pk": `${indexKey}#${familyId}` },
  }));
  return (response.Items ?? []).map((item) => item.record).filter(Boolean);
}

export class CustomerDataRepository {
  async exportForVerifiedUser(userId: string): Promise<CustomerDataExport> {
    const profiles = new CustomerProfileRepository();
    const subscriptions = new SubscriptionRepository();
    const [account, familyProfile, pantry, subscriptionHistory, payments, feedback, petProfiles, petPantry, petSchedules] = await Promise.all([
      profiles.getCustomer(userId), profiles.getFamilyProfile(userId), new PantryRepository().listForUser(userId),
      query("SUBSCRIPTION#", userId), subscriptions.listPaymentHistoryForUser(userId, 50), query("LEARNING_EVENT#", userId),
      query("PET_PROFILE#", userId), query("PET_PANTRY#", userId), query("PET_SCHEDULE#", userId),
    ]);
    const familyId = familyProfile?.familyId;
    const [mealPlans, weeklyPlans] = familyId ? await Promise.all([
      queryFamily("FAMILY_MEAL_PLANS", familyId), queryFamily("FAMILY_WEEKLY_PLANS", familyId),
    ]) : [[], []];
    return {
      generatedAt: new Date().toISOString(), userId, account, familyProfile, pantry, subscriptions: subscriptionHistory,
      payments, feedback, mealPlans, weeklyPlans, petProfiles, petPantry, petSchedules,
      exclusions: [
        { data: "session tokens and token hashes", reason: "Security credentials are never exported." },
        { data: "provider-side payment records", reason: "Request these from the payment provider under its process." },
        { data: "anonymous analytics", reason: "Current analytics uses non-account visitor identifiers and is not joined to customer identity." },
      ],
    };
  }

  async deletionPreflightForVerifiedUser(userId: string) {
    const data = await this.exportForVerifiedUser(userId);
    return {
      requestedAt: new Date().toISOString(), userId,
      deletableRecordGroups: ["account", "family profile", "pantry", "feedback", "meal plans", "weekly plans"],
      retainedOrBlocked: [
        "subscription and payment records require approved financial/legal retention rules",
        "sessions cannot be revoked in bulk because the current session schema has no user lookup index",
        "safety reports require an approved retention and review-close policy",
      ],
      counts: { pantry: data.pantry.length, feedback: data.feedback.length, mealPlans: data.mealPlans.length, weeklyPlans: data.weeklyPlans.length },
      executable: false,
    };
  }
}
