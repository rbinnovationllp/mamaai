import { DeleteCommand, GetCommand, PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { createId } from "./in-memory-store";
import { getMamaAiTableName, mamaAiDynamoDb } from "./dynamodb-client";
import type { PetScheduleInput, PetScheduleRecord } from "@/lib/pet-nutrition/pantry";
import type { PetSafetyOutcome } from "@/lib/pet-nutrition/safety-engine";

type SafetyMetadata = { safetyRuleVersion: string; petDependencyVersion: string; pantryDependencyVersion: string; reviewReason?: string };
const key = (userId: string, petId: string, scheduleId: string) => ({ PK: `USER#${userId}`, SK: `PET_SCHEDULE#${petId}#${scheduleId}` });
const now = () => new Date().toISOString();

export class PetScheduleRepository {
  async list(userId: string, petId: string): Promise<PetScheduleRecord[]> { const result = await mamaAiDynamoDb.send(new QueryCommand({ TableName: getMamaAiTableName(), KeyConditionExpression: "PK=:pk AND begins_with(SK,:prefix)", ExpressionAttributeValues: { ":pk": `USER#${userId}`, ":prefix": `PET_SCHEDULE#${petId}#` } })); return (result.Items ?? []).map((item) => item.record as PetScheduleRecord); }
  async get(userId: string, petId: string, scheduleId: string): Promise<PetScheduleRecord | undefined> { return (await mamaAiDynamoDb.send(new GetCommand({ TableName: getMamaAiTableName(), Key: key(userId, petId, scheduleId) }))).Item?.record as PetScheduleRecord | undefined; }
  async save(record: PetScheduleRecord): Promise<PetScheduleRecord> { await mamaAiDynamoDb.send(new PutCommand({ TableName: getMamaAiTableName(), Item: { ...key(record.userId, record.petId, record.scheduleId), entityType: "pet_schedule", record } })); return record; }
  async create(userId: string, input: PetScheduleInput, safety: PetSafetyOutcome, metadata: SafetyMetadata): Promise<PetScheduleRecord> { const timestamp = now(); return this.save({ ...input, scheduleId: createId("petschedule"), userId, safety, createdAt: timestamp, updatedAt: timestamp, ...metadata } as PetScheduleRecord); }
  async update(userId: string, petId: string, scheduleId: string, input: PetScheduleInput, safety: PetSafetyOutcome, metadata: SafetyMetadata): Promise<PetScheduleRecord | undefined> { const old = await this.get(userId, petId, scheduleId); if (!old) return undefined; return this.save({ ...input, scheduleId, userId, safety, createdAt: old.createdAt, updatedAt: now(), ...metadata } as PetScheduleRecord); }
  async delete(userId: string, petId: string, scheduleId: string): Promise<boolean> { if (!await this.get(userId, petId, scheduleId)) return false; await mamaAiDynamoDb.send(new DeleteCommand({ TableName: getMamaAiTableName(), Key: key(userId, petId, scheduleId), ConditionExpression: "attribute_exists(PK)" })); return true; }
  async requireReviewForItem(userId: string, petId: string, itemId: string, reason: string) { const schedules = await this.list(userId, petId); await Promise.all(schedules.filter((schedule) => schedule.pantryItemId === itemId).map((schedule) => this.save({ ...schedule, status: "requires_review", reviewReason: reason, pantryDependencyVersion: "deleted", updatedAt: now() } as PetScheduleRecord))); }
  async requireReviewForPet(userId: string, petId: string, reason: string) { const schedules = await this.list(userId, petId); await Promise.all(schedules.map((schedule) => this.save({ ...schedule, status: "requires_review", reviewReason: reason, petDependencyVersion: "deleted", updatedAt: now() } as PetScheduleRecord))); }
}
