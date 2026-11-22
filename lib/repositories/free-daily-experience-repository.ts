import { DeleteCommand, GetCommand, PutCommand, TransactWriteCommand } from "@aws-sdk/lib-dynamodb";
import type { FamilyMealPlan } from "@/lib/shared/contracts";
import type { QuickDailyMealRequest } from "@/lib/shared/daily-meal-planner";
import { getMamaAiTableName, mamaAiDynamoDb } from "./dynamodb-client";

export type FreeDailyExperienceStatus = "generating" | "generated";

export interface FreeDailyExperienceRecord {
  experienceId: string;
  userId: string;
  deviceId: string;
  status: FreeDailyExperienceStatus;
  requestId: string;
  questionnaire?: Omit<QuickDailyMealRequest, "aiProcessingConsent">;
  mealPlans?: FamilyMealPlan[];
  createdAt: string;
  updatedAt: string;
  lockExpiresAtEpoch?: number;
}

export class FreeDailyExperienceError extends Error {
  constructor(public readonly code: "FREE_DAILY_ALREADY_USED" | "FREE_DAILY_IN_PROGRESS" | "FREE_DAILY_DEVICE_ALREADY_USED") {
    super(code);
  }
}

const userKey = (userId: string) => ({ PK: `USER#${userId}`, SK: "FREE_DAILY#CURRENT" });
const deviceKey = (deviceId: string) => ({ PK: `DEVICE#${deviceId}`, SK: "FREE_DAILY#CURRENT" });

function isActiveLock(record: FreeDailyExperienceRecord, now: number) {
  return record.status === "generating" && (record.lockExpiresAtEpoch ?? 0) > now;
}

export class FreeDailyExperienceRepository {
  private readonly tableName = getMamaAiTableName();

  async getForUser(userId: string): Promise<FreeDailyExperienceRecord | undefined> {
    const response = await mamaAiDynamoDb.send(new GetCommand({ TableName: this.tableName, Key: userKey(userId) }));
    return response.Item?.record as FreeDailyExperienceRecord | undefined;
  }

  async getSubscribedLatest(userId: string): Promise<FreeDailyExperienceRecord | undefined> {
    const response = await mamaAiDynamoDb.send(new GetCommand({ TableName: this.tableName, Key: { PK: `USER#${userId}`, SK: "DAILY_MEAL#LATEST" } }));
    return response.Item?.record as FreeDailyExperienceRecord | undefined;
  }

  async saveSubscribedLatest(input: { userId: string; deviceId: string; questionnaire: Omit<QuickDailyMealRequest, "aiProcessingConsent">; mealPlans: FamilyMealPlan[]; now?: Date }) {
    const now = (input.now ?? new Date()).toISOString();
    const record: FreeDailyExperienceRecord = { experienceId: `daily_${crypto.randomUUID()}`, userId: input.userId, deviceId: input.deviceId, status: "generated", requestId: "subscribed", questionnaire: input.questionnaire, mealPlans: input.mealPlans, createdAt: now, updatedAt: now };
    await mamaAiDynamoDb.send(new PutCommand({ TableName: this.tableName, Item: { PK: `USER#${input.userId}`, SK: "DAILY_MEAL#LATEST", entityType: "subscribed_daily_meal_plan", record, updatedAt: now } }));
    return record;
  }

  private async getForDevice(deviceId: string): Promise<FreeDailyExperienceRecord | undefined> {
    const response = await mamaAiDynamoDb.send(new GetCommand({ TableName: this.tableName, Key: deviceKey(deviceId) }));
    return response.Item?.record as FreeDailyExperienceRecord | undefined;
  }

  async begin(input: { experienceId: string; userId: string; deviceId: string; requestId: string; questionnaire: Omit<QuickDailyMealRequest, "aiProcessingConsent">; now?: Date; }) {
    const now = input.now ?? new Date();
    const nowEpoch = Math.floor(now.getTime() / 1000);
    const userExisting = await this.getForUser(input.userId);
    if (userExisting?.status === "generated") return { state: "existing" as const, record: userExisting };
    if (userExisting && isActiveLock(userExisting, nowEpoch)) throw new FreeDailyExperienceError("FREE_DAILY_IN_PROGRESS");

    const deviceExisting = await this.getForDevice(input.deviceId);
    if (deviceExisting?.status === "generated" && deviceExisting.userId !== input.userId) {
      throw new FreeDailyExperienceError("FREE_DAILY_DEVICE_ALREADY_USED");
    }
    if (deviceExisting && isActiveLock(deviceExisting, nowEpoch)) throw new FreeDailyExperienceError("FREE_DAILY_IN_PROGRESS");

    // A timed-out generation never consumes the entitlement. Its expired lock
    // may be safely removed before a fresh atomic claim is made.
    if (userExisting?.status === "generating") {
      await Promise.allSettled([
        this.removeLock(input.userId, input.deviceId, userExisting.requestId),
        this.removeDeviceLock(input.deviceId, userExisting.requestId),
      ]);
    }
    if (deviceExisting?.status === "generating" && deviceExisting.requestId !== userExisting?.requestId) await this.removeDeviceLock(input.deviceId, deviceExisting.requestId);

    const record: FreeDailyExperienceRecord = {
      experienceId: input.experienceId,
      userId: input.userId,
      deviceId: input.deviceId,
      status: "generating",
      requestId: input.requestId,
      questionnaire: input.questionnaire,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      // Five minutes guards simultaneous clicks; it is not an entitlement TTL.
      lockExpiresAtEpoch: nowEpoch + 5 * 60,
    };
    try {
      await mamaAiDynamoDb.send(new TransactWriteCommand({
        TransactItems: [
          { Put: { TableName: this.tableName, Item: { ...userKey(input.userId), entityType: "free_daily_experience", record, updatedAt: record.updatedAt }, ConditionExpression: "attribute_not_exists(PK)" } },
          { Put: { TableName: this.tableName, Item: { ...deviceKey(input.deviceId), entityType: "free_daily_device_claim", record, updatedAt: record.updatedAt }, ConditionExpression: "attribute_not_exists(PK)" } },
        ],
      }));
    } catch (error) {
      const current = await this.getForUser(input.userId);
      if (current?.status === "generated") return { state: "existing" as const, record: current };
      const device = await this.getForDevice(input.deviceId);
      if (device?.status === "generated" && device.userId !== input.userId) throw new FreeDailyExperienceError("FREE_DAILY_DEVICE_ALREADY_USED");
      throw new FreeDailyExperienceError("FREE_DAILY_IN_PROGRESS");
    }
    return { state: "started" as const, record };
  }

  async finalize(input: { record: FreeDailyExperienceRecord; mealPlans: FamilyMealPlan[]; now?: Date; }) {
    const updatedAt = (input.now ?? new Date()).toISOString();
    const completed: FreeDailyExperienceRecord = { ...input.record, status: "generated", mealPlans: input.mealPlans, updatedAt, lockExpiresAtEpoch: undefined };
    await mamaAiDynamoDb.send(new TransactWriteCommand({
      TransactItems: [
        { Put: { TableName: this.tableName, Item: { ...userKey(input.record.userId), entityType: "free_daily_experience", record: completed, updatedAt }, ConditionExpression: "#record.#requestId = :requestId AND #record.#status = :generating", ExpressionAttributeNames: { "#record": "record", "#requestId": "requestId", "#status": "status" }, ExpressionAttributeValues: { ":requestId": input.record.requestId, ":generating": "generating" } } },
        { Put: { TableName: this.tableName, Item: { ...deviceKey(input.record.deviceId), entityType: "free_daily_device_claim", record: completed, updatedAt }, ConditionExpression: "#record.#requestId = :requestId AND #record.#status = :generating", ExpressionAttributeNames: { "#record": "record", "#requestId": "requestId", "#status": "status" }, ExpressionAttributeValues: { ":requestId": input.record.requestId, ":generating": "generating" } } },
      ],
    }));
    return completed;
  }

  async abandon(record: FreeDailyExperienceRecord) {
    await Promise.allSettled([
      this.removeLock(record.userId, record.deviceId, record.requestId),
      this.removeDeviceLock(record.deviceId, record.requestId),
    ]);
  }

  private async removeLock(userId: string, _deviceId: string, requestId: string) {
    await mamaAiDynamoDb.send(new DeleteCommand({ TableName: this.tableName, Key: userKey(userId), ConditionExpression: "#record.#requestId = :requestId", ExpressionAttributeNames: { "#record": "record", "#requestId": "requestId" }, ExpressionAttributeValues: { ":requestId": requestId } }));
  }

  private async removeDeviceLock(deviceId: string, requestId: string) {
    await mamaAiDynamoDb.send(new DeleteCommand({ TableName: this.tableName, Key: deviceKey(deviceId), ConditionExpression: "#record.#requestId = :requestId", ExpressionAttributeNames: { "#record": "record", "#requestId": "requestId" }, ExpressionAttributeValues: { ":requestId": requestId } }));
  }
}
