import { GetCommand, PutCommand, UpdateCommand, TransactWriteCommand } from "@aws-sdk/lib-dynamodb";
import { getMamaAiTableName, mamaAiDynamoDb } from "./dynamodb-client";
import { AccountSecurityRepository, type PasswordAccountRecord } from "./account-security-repository";

export type RecoveryChannel = "mobile" | "email";
export type RecoveryChallenge = { challengeId: string; userId: string; channel: RecoveryChannel; contactHash: string; codeHash: string; passwordVersion: number; attempts: number; expiresAt: number; consumedAt?: string };
export interface RecoveryStore {
  find(channel: RecoveryChannel, hash: string): Promise<PasswordAccountRecord | undefined>;
  getAccount(userId: string): Promise<PasswordAccountRecord | undefined>;
  save(challenge: RecoveryChallenge): Promise<void>;
  get(challengeId: string): Promise<RecoveryChallenge | undefined>;
  failedAttempt(challengeId: string): Promise<void>;
  reset(account: PasswordAccountRecord, passwordHash: string, proof: { recoveryCodeHash: string } | { challenge: RecoveryChallenge; now: number }): Promise<void>;
}

export class PasswordRecoveryRepository implements RecoveryStore {
  private accounts = new AccountSecurityRepository();
  find(channel: RecoveryChannel, hash: string) { return channel === "mobile" ? this.accounts.getAccountByMobileHash(hash) : this.accounts.getAccountByEmailHash(hash); }
  getAccount(id: string) { return this.accounts.getAccount(id); }
  async save(challenge: RecoveryChallenge) { await mamaAiDynamoDb.send(new PutCommand({ TableName: getMamaAiTableName(), Item: { PK: `PASSWORD_RECOVERY#${challenge.challengeId}`, SK: "CHALLENGE", entityType: "password_recovery", expiresAt: challenge.expiresAt, record: challenge }, ConditionExpression: "attribute_not_exists(PK)" })); }
  async get(id: string) { return (await mamaAiDynamoDb.send(new GetCommand({ TableName: getMamaAiTableName(), Key: { PK: `PASSWORD_RECOVERY#${id}`, SK: "CHALLENGE" }, ConsistentRead: true }))).Item?.record as RecoveryChallenge | undefined; }
  async failedAttempt(id: string) { await mamaAiDynamoDb.send(new UpdateCommand({ TableName: getMamaAiTableName(), Key: { PK: `PASSWORD_RECOVERY#${id}`, SK: "CHALLENGE" }, UpdateExpression: "SET #r.#a = #r.#a + :one", ConditionExpression: "attribute_exists(PK) AND attribute_not_exists(#r.#used) AND #r.#a < :limit", ExpressionAttributeNames: { "#r": "record", "#a": "attempts", "#used": "consumedAt" }, ExpressionAttributeValues: { ":one": 1, ":limit": 5 } })); }
  async reset(account: PasswordAccountRecord, passwordHash: string, proof: { recoveryCodeHash: string } | { challenge: RecoveryChallenge; now: number }) {
    const TableName = getMamaAiTableName(), now = new Date().toISOString();
    const proofUpdate = "recoveryCodeHash" in proof
      ? { TableName, Key: { PK: `ACCOUNT#${account.userId}`, SK: `RECOVERY#${proof.recoveryCodeHash}` }, UpdateExpression: "SET consumedAt = :now", ConditionExpression: "attribute_exists(PK) AND attribute_not_exists(consumedAt) AND attribute_not_exists(invalidatedAt)", ExpressionAttributeValues: { ":now": now } }
      : { TableName, Key: { PK: `PASSWORD_RECOVERY#${proof.challenge.challengeId}`, SK: "CHALLENGE" }, UpdateExpression: "SET #r.#used = :used", ConditionExpression: "attribute_exists(PK) AND attribute_not_exists(#r.#used) AND #r.#expiry > :now AND #r.#attempts < :limit AND #r.#hash = :hash AND #r.#user = :user", ExpressionAttributeNames: { "#r": "record", "#used": "consumedAt", "#expiry": "expiresAt", "#attempts": "attempts", "#hash": "codeHash", "#user": "userId" }, ExpressionAttributeValues: { ":used": now, ":now": proof.now, ":limit": 5, ":hash": proof.challenge.codeHash, ":user": account.userId } };
    const contactNames = "challenge" in proof ? { "#contact": proof.challenge.channel === "mobile" ? "mobileHash" : "emailHash", "#verified": proof.challenge.channel === "mobile" ? "mobileVerificationStatus" : "emailVerificationStatus" } : {};
    const contactValues = "challenge" in proof ? { ":contact": proof.challenge.contactHash, ":verified": "verified" } : {};
    const contactCondition = "challenge" in proof ? " AND #r.#contact = :contact AND #r.#verified = :verified" : "";
    // Proof consumption and password/session revocation succeed or fail together.
    await mamaAiDynamoDb.send(new TransactWriteCommand({ TransactItems: [
      { Update: proofUpdate },
      { Update: { TableName, Key: { PK: `ACCOUNT#${account.userId}`, SK: "PROFILE" }, UpdateExpression: "SET #r.#hash = :hash, #r.#version = :next, #r.#deviceVersion = :deviceVersion, #r.#updated = :now REMOVE #r.#active", ConditionExpression: "attribute_exists(PK) AND (attribute_not_exists(#r.#version) OR #r.#version = :expected)" + contactCondition, ExpressionAttributeNames: { "#r": "record", "#hash": "passwordHash", "#version": "passwordVersion", "#deviceVersion": "deviceActivationVersion", "#updated": "updatedAt", "#active": "activeDeviceId", ...contactNames }, ExpressionAttributeValues: { ":hash": passwordHash, ":expected": account.passwordVersion ?? 0, ":next": (account.passwordVersion ?? 0) + 1, ":deviceVersion": (account.deviceActivationVersion ?? 0) + 1, ":now": now, ...contactValues } } },
    ] }));
  }
}
