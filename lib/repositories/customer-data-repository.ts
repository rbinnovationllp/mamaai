import { BatchWriteCommand, DeleteCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { AccountSecurityRepository } from "./account-security-repository";
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

async function queryItems(pk: string) {
  const response = await mamaAiDynamoDb.send(new QueryCommand({
    TableName: getMamaAiTableName(), KeyConditionExpression: "PK = :pk", ExpressionAttributeValues: { ":pk": pk },
  }));
  return response.Items ?? [];
}

async function deleteKeys(keys: Array<{ PK: string; SK: string }>) {
  for (let index = 0; index < keys.length; index += 25) {
    let pending: Array<{ DeleteRequest: { Key: Record<string, unknown> } }> = keys.slice(index, index + 25).map((Key) => ({ DeleteRequest: { Key } }));
    for (let attempt = 0; pending.length && attempt < 3; attempt += 1) {
      const result = await mamaAiDynamoDb.send(new BatchWriteCommand({ RequestItems: { [getMamaAiTableName()]: pending } }));
      pending = (result.UnprocessedItems?.[getMamaAiTableName()] ?? []).map((request) => {
        if (!request.DeleteRequest?.Key) throw new Error("ACCOUNT_DELETION_RETRY_REQUIRED");
        return { DeleteRequest: { Key: request.DeleteRequest.Key } };
      });
    }
    if (pending.length) throw new Error("ACCOUNT_DELETION_RETRY_REQUIRED");
  }
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

async function queryFamilyItems(indexKey: string, familyId: string) {
  const response = await mamaAiDynamoDb.send(new QueryCommand({
    TableName: getMamaAiTableName(),
    IndexName: process.env.MAMA_AI_DYNAMODB_GSI1_NAME ?? "GSI1",
    KeyConditionExpression: "GSI1PK = :pk",
    ExpressionAttributeValues: { ":pk": `${indexKey}#${familyId}` },
  }));
  return response.Items ?? [];
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

  /**
   * Deletes application-held customer data. It deliberately leaves payment
   * ledger records and external-provider records untouched: their retention
   * policy requires a legal/finance decision outside an app request.
   * The operation is idempotent until its final credential removal, so a
   * transient failure can be retried by the still-authenticated account.
   */
  async deleteApplicationDataForVerifiedUser(userId: string, currentSessionTokenHash?: string) {
    const profiles = new CustomerProfileRepository();
    const security = new AccountSecurityRepository();
    const [account, family] = await Promise.all([security.getAccount(userId), profiles.getFamilyProfile(userId)]);
    const [userItems, accountItems] = await Promise.all([queryItems(`USER#${userId}`), queryItems(`ACCOUNT#${userId}`)]);
    const financial = userItems.filter((item) => /^(SUBSCRIPTION|PAYMENT)#/.test(String(item.SK)));
    const deletableUser = userItems.filter((item) => !/^(SUBSCRIPTION|PAYMENT)#/.test(String(item.SK)));
    const derived = family ? await Promise.all([
      queryFamilyItems("FAMILY_MEAL_PLANS", family.familyId), queryFamilyItems("FAMILY_WEEKLY_PLANS", family.familyId),
    ]) : [[], []];
    await deleteKeys([...deletableUser, ...accountItems, ...derived[0], ...derived[1]].map((item) => ({ PK: String(item.PK), SK: String(item.SK) })));
    if (account?.emailHash) await mamaAiDynamoDb.send(new DeleteCommand({ TableName: getMamaAiTableName(), Key: { PK: `EMAIL#${account.emailHash}`, SK: "ACCOUNT" } }));
    if (account?.mobileHash) await mamaAiDynamoDb.send(new DeleteCommand({ TableName: getMamaAiTableName(), Key: { PK: `MOBILE#${account.mobileHash}`, SK: "ACCOUNT" } }));
    if (currentSessionTokenHash) await mamaAiDynamoDb.send(new DeleteCommand({ TableName: getMamaAiTableName(), Key: { PK: `SESSION#${currentSessionTokenHash}`, SK: "SESSION#CURRENT" } }));
    return {
      completedAt: new Date().toISOString(),
      deletedApplicationRecords: deletableUser.length + accountItems.length + derived[0].length + derived[1].length,
      retainedForReview: {
        paymentAndSubscriptionLedgerRecords: financial.length,
        otherSessionTokenHashes: "All existing sessions are invalidated because the account/device record is removed. Token-hash rows without a user lookup expire by their configured TTL.",
        providerHeldCopies: "Original uploads are not stored by MAMAAI; Gemini/provider retention must be verified in the provider account.",
        backups: "Backup retention and deletion timing require the owner-approved backup policy.",
      },
    };
  }
}
