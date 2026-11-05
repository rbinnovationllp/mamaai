import { GetCommand, PutCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { getMamaAiTableName, mamaAiDynamoDb } from "./dynamodb-client";

export interface DurableSessionRecord { userId: string; tokenHash: string; createdAt: string; expiresAt: string; expiresAtEpoch: number; revokedAt?: string; deviceId?: string; deviceActivationVersion?: number; passwordVersion?: number; rememberDevice?: boolean; metadata?: { deviceLabel?: string }; }
export interface SessionRepository { create(record: DurableSessionRecord): Promise<void>; get(tokenHash: string): Promise<DurableSessionRecord | undefined>; revoke(tokenHash: string, revokedAt: string): Promise<boolean>; }
export class DynamoDbSessionRepository implements SessionRepository {
  async create(record: DurableSessionRecord) { await mamaAiDynamoDb.send(new PutCommand({ TableName: getMamaAiTableName(), Item: { PK: `SESSION#${record.tokenHash}`, SK: "SESSION#CURRENT", entityType: "customer_session", record, expiresAt: record.expiresAtEpoch } })); }
  async get(tokenHash: string) { const result = await mamaAiDynamoDb.send(new GetCommand({ TableName: getMamaAiTableName(), Key: { PK: `SESSION#${tokenHash}`, SK: "SESSION#CURRENT" } })); return result.Item?.record as DurableSessionRecord | undefined; }
  async renew(tokenHash: string, previousExpiry: string, expiresAt: string, now: string) {
    await mamaAiDynamoDb.send(new UpdateCommand({ TableName: getMamaAiTableName(), Key: { PK: `SESSION#${tokenHash}`, SK: "SESSION#CURRENT" }, UpdateExpression: "SET #r.#expiry = :expiry, #r.#epoch = :epoch, expiresAt = :epoch", ConditionExpression: "attribute_exists(PK) AND attribute_not_exists(#r.#revoked) AND #r.#remember = :yes AND #r.#expiry = :previous AND #r.#expiry > :now", ExpressionAttributeNames: { "#r": "record", "#expiry": "expiresAt", "#epoch": "expiresAtEpoch", "#revoked": "revokedAt", "#remember": "rememberDevice" }, ExpressionAttributeValues: { ":expiry": expiresAt, ":epoch": Math.floor(new Date(expiresAt).getTime() / 1000), ":yes": true, ":previous": previousExpiry, ":now": now } }));
  }
  async revoke(tokenHash: string, revokedAt: string) { const result = await mamaAiDynamoDb.send(new UpdateCommand({ TableName: getMamaAiTableName(), Key: { PK: `SESSION#${tokenHash}`, SK: "SESSION#CURRENT" }, UpdateExpression: "SET #record.#revokedAt = :revokedAt", ConditionExpression: "attribute_exists(PK) AND attribute_not_exists(#record.#revokedAt)", ExpressionAttributeNames: { "#record": "record", "#revokedAt": "revokedAt" }, ExpressionAttributeValues: { ":revokedAt": revokedAt }, ReturnValues: "UPDATED_NEW" })); return Boolean(result.Attributes); }
}

