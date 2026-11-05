import { GetCommand, PutCommand, QueryCommand, TransactWriteCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { getMamaAiTableName, mamaAiDynamoDb } from "./dynamodb-client";

export type MobileVerificationStatus = "unverified" | "verified";
export type TransferStatus = "confirmed" | "confirmation_pending" | "payment_required" | "lost_device_recovery";

export interface PasswordAccountRecord {
  userId: string;
  /** Existing mobile-only records omit emailHash; retain them for migration. */
  emailHash?: string;
  /** Set only by an independently verified contact enrollment flow. */
  emailVerificationStatus?: MobileVerificationStatus;
  fullName?: string;
  mobileHash?: string;
  passwordHash: string;
  mobileVerificationStatus: MobileVerificationStatus;
  householdId?: string;
  activeDeviceId?: string;
  deviceActivationVersion: number;
  passwordVersion: number;
  recoveryCodeVersion?: number;
  householdReplacementAllowedAfter?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DeviceRecord {
  deviceId: string;
  label: string;
  activatedAt: string;
  confirmationDueAt?: string;
  confirmedAt?: string;
  revokedAt?: string;
  activationVersion: number;
}

export interface TransferRecord {
  transferId: string;
  fromDeviceId?: string;
  toDeviceId: string;
  reason: "discretionary" | "lost_device";
  status: TransferStatus;
  paymentRequired: boolean;
  paymentIntentId?: string;
  createdAt: string;
}

export interface TransferPolicyRecord {
  version: number;
  freeTransferTimestamps: string[];
  transfers: TransferRecord[];
  updatedAt: string;
}

export interface SimulatedTransferPayment {
  paymentIntentId: string;
  userId: string;
  transferId: string;
  amountPaise: number;
  currency: "INR";
  status: "pending" | "settled_simulated";
  createdAt: string;
  settledAt?: string;
}
export interface TransferAuthorizationRecord { authorizationHash: string; expiresAt: string; expiresAtEpoch: number; createdAt: string; reason: "discretionary" | "lost_device"; consumedAt?: string; }

export class AccountSecurityRepository {
  private readonly tableName = getMamaAiTableName();

  async getAccount(userId: string) {
    const result = await mamaAiDynamoDb.send(new GetCommand({ TableName: this.tableName, Key: { PK: `ACCOUNT#${userId}`, SK: "PROFILE" } }));
    return result.Item?.record as PasswordAccountRecord | undefined;
  }

  async getAccountByMobileHash(mobileHash: string) {
    const result = await mamaAiDynamoDb.send(new GetCommand({ TableName: this.tableName, Key: { PK: `MOBILE#${mobileHash}`, SK: "ACCOUNT" } }));
    const userId = result.Item?.userId as string | undefined;
    return userId ? this.getAccount(userId) : undefined;
  }

  async getAccountByEmailHash(emailHash: string) {
    const result = await mamaAiDynamoDb.send(new GetCommand({ TableName: this.tableName, Key: { PK: `EMAIL#${emailHash}`, SK: "ACCOUNT" } }));
    const userId = result.Item?.userId as string | undefined;
    return userId ? this.getAccount(userId) : undefined;
  }

  async createAccount(record: PasswordAccountRecord) {
    await mamaAiDynamoDb.send(new TransactWriteCommand({
      TransactItems: [
        { Put: { TableName: this.tableName, Item: { PK: `ACCOUNT#${record.userId}`, SK: "PROFILE", entityType: "password_account", record }, ConditionExpression: "attribute_not_exists(PK)" } },
        ...(record.emailHash ? [{ Put: { TableName: this.tableName, Item: { PK: `EMAIL#${record.emailHash}`, SK: "ACCOUNT", entityType: "email_account_lookup", userId: record.userId, createdAt: record.createdAt }, ConditionExpression: "attribute_not_exists(PK)" } }] : []),
        ...(record.mobileHash ? [{ Put: { TableName: this.tableName, Item: { PK: `MOBILE#${record.mobileHash}`, SK: "ACCOUNT", entityType: "mobile_account_lookup", userId: record.userId, createdAt: record.createdAt }, ConditionExpression: "attribute_not_exists(PK)" } }] : []),
        { Put: { TableName: this.tableName, Item: { PK: `ACCOUNT#${record.userId}`, SK: "TRANSFER_POLICY", entityType: "device_transfer_policy", record: { version: 1, freeTransferTimestamps: [], transfers: [], updatedAt: record.createdAt } satisfies TransferPolicyRecord }, ConditionExpression: "attribute_not_exists(PK)" } },
      ],
    }));
  }

  async getTransferPolicy(userId: string) {
    const result = await mamaAiDynamoDb.send(new GetCommand({ TableName: this.tableName, Key: { PK: `ACCOUNT#${userId}`, SK: "TRANSFER_POLICY" } }));
    return result.Item?.record as TransferPolicyRecord | undefined;
  }

  async getDevice(userId: string, deviceId: string) {
    const result = await mamaAiDynamoDb.send(new GetCommand({ TableName: this.tableName, Key: { PK: `ACCOUNT#${userId}`, SK: `DEVICE#${deviceId}` } }));
    return result.Item?.record as DeviceRecord | undefined;
  }

  async listDevices(userId: string) {
    const result = await mamaAiDynamoDb.send(new QueryCommand({ TableName: this.tableName, KeyConditionExpression: "PK = :pk AND begins_with(SK, :prefix)", ExpressionAttributeValues: { ":pk": `ACCOUNT#${userId}`, ":prefix": "DEVICE#" } }));
    return (result.Items ?? []).map((item) => item.record as DeviceRecord).filter(Boolean);
  }

  async getPayment(userId: string, paymentIntentId: string) {
    const result = await mamaAiDynamoDb.send(new GetCommand({ TableName: this.tableName, Key: { PK: `ACCOUNT#${userId}`, SK: `TRANSFER_PAYMENT#${paymentIntentId}` } }));
    return result.Item?.record as SimulatedTransferPayment | undefined;
  }

  async savePayment(payment: SimulatedTransferPayment) {
    await mamaAiDynamoDb.send(new PutCommand({ TableName: this.tableName, Item: { PK: `ACCOUNT#${payment.userId}`, SK: `TRANSFER_PAYMENT#${payment.paymentIntentId}`, entityType: "simulated_device_transfer_payment", record: payment }, ConditionExpression: "attribute_not_exists(PK)" }));
  }

  async createTransferAuthorization(userId: string, record: TransferAuthorizationRecord) {
    await mamaAiDynamoDb.send(new PutCommand({ TableName: this.tableName, Item: { PK: `ACCOUNT#${userId}`, SK: `TRANSFER_AUTH#${record.authorizationHash}`, entityType: "device_transfer_authorization", expiresAt: record.expiresAtEpoch, record }, ConditionExpression: "attribute_not_exists(PK)" }));
  }

  async consumeTransferAuthorization(userId: string, authorizationHash: string, now: string) {
    await mamaAiDynamoDb.send(new UpdateCommand({ TableName: this.tableName, Key: { PK: `ACCOUNT#${userId}`, SK: `TRANSFER_AUTH#${authorizationHash}` }, UpdateExpression: "SET #record.#consumedAt = :now", ConditionExpression: "attribute_exists(PK) AND attribute_not_exists(#record.#consumedAt) AND #record.#expiresAt > :now", ExpressionAttributeNames: { "#record": "record", "#consumedAt": "consumedAt", "#expiresAt": "expiresAt" }, ExpressionAttributeValues: { ":now": now } }));
  }

  async saveRecoveryCodeHashes(userId: string, hashes: string[]) {
    await mamaAiDynamoDb.send(new TransactWriteCommand({ TransactItems: hashes.map((hash) => ({ Put: { TableName: this.tableName, Item: { PK: `ACCOUNT#${userId}`, SK: `RECOVERY#${hash}`, entityType: "account_recovery_code", createdAt: new Date().toISOString() }, ConditionExpression: "attribute_not_exists(PK)" } })) }));
  }

  async regenerateRecoveryCodeHashes(userId: string, hashes: string[], expectedVersion: number) {
    const existing = await mamaAiDynamoDb.send(new QueryCommand({
      TableName: this.tableName,
      KeyConditionExpression: "PK = :pk AND begins_with(SK, :prefix)",
      ExpressionAttributeValues: { ":pk": `ACCOUNT#${userId}`, ":prefix": "RECOVERY#" },
    }));
    const now = new Date().toISOString();
    const unused = (existing.Items ?? []).filter((item) => !item.consumedAt && !item.invalidatedAt);
    await mamaAiDynamoDb.send(new TransactWriteCommand({
      TransactItems: [
        { Update: { TableName: this.tableName, Key: { PK: `ACCOUNT#${userId}`, SK: "PROFILE" }, UpdateExpression: "SET #record.#recoveryCodeVersion = :next, #record.#updatedAt = :now", ConditionExpression: "attribute_not_exists(#record.#recoveryCodeVersion) OR #record.#recoveryCodeVersion = :expected", ExpressionAttributeNames: { "#record": "record", "#recoveryCodeVersion": "recoveryCodeVersion", "#updatedAt": "updatedAt" }, ExpressionAttributeValues: { ":next": expectedVersion + 1, ":expected": expectedVersion, ":now": now } } },
        ...unused.map((item) => ({ Update: { TableName: this.tableName, Key: { PK: item.PK, SK: item.SK }, UpdateExpression: "SET invalidatedAt = :now", ConditionExpression: "attribute_not_exists(consumedAt) AND attribute_not_exists(invalidatedAt)", ExpressionAttributeValues: { ":now": now } } })),
        ...hashes.map((hash) => ({ Put: { TableName: this.tableName, Item: { PK: `ACCOUNT#${userId}`, SK: `RECOVERY#${hash}`, entityType: "account_recovery_code", createdAt: now, recoveryCodeVersion: expectedVersion + 1 }, ConditionExpression: "attribute_not_exists(PK)" } })),
      ],
    }));
  }

  async consumeRecoveryCode(userId: string, hash: string) {
    await mamaAiDynamoDb.send(new UpdateCommand({ TableName: this.tableName, Key: { PK: `ACCOUNT#${userId}`, SK: `RECOVERY#${hash}` }, UpdateExpression: "SET consumedAt = :now", ConditionExpression: "attribute_exists(PK) AND attribute_not_exists(consumedAt) AND attribute_not_exists(invalidatedAt)", ExpressionAttributeValues: { ":now": new Date().toISOString() } }));
  }

  async updatePasswordAtomically(userId: string, expectedVersion: number, passwordHash: string) {
    const now = new Date().toISOString();
    await mamaAiDynamoDb.send(new UpdateCommand({
      TableName: this.tableName,
      Key: { PK: `ACCOUNT#${userId}`, SK: "PROFILE" },
      UpdateExpression: "SET #record.#passwordHash = :passwordHash, #record.#passwordVersion = :nextVersion, #record.#updatedAt = :now",
      ConditionExpression: "attribute_not_exists(#record.#passwordVersion) OR #record.#passwordVersion = :expectedVersion",
      ExpressionAttributeNames: { "#record": "record", "#passwordHash": "passwordHash", "#passwordVersion": "passwordVersion", "#updatedAt": "updatedAt" },
      ExpressionAttributeValues: { ":passwordHash": passwordHash, ":expectedVersion": expectedVersion, ":nextVersion": expectedVersion + 1, ":now": now },
    }));
  }

  async settleSimulatedPayment(userId: string, paymentIntentId: string, settledAt: string) {
    await mamaAiDynamoDb.send(new UpdateCommand({
      TableName: this.tableName,
      Key: { PK: `ACCOUNT#${userId}`, SK: `TRANSFER_PAYMENT#${paymentIntentId}` },
      UpdateExpression: "SET #record.#status = :status, #record.#settledAt = :settledAt",
      ConditionExpression: "#record.#status = :pending",
      ExpressionAttributeNames: { "#record": "record", "#status": "status", "#settledAt": "settledAt" },
      ExpressionAttributeValues: { ":status": "settled_simulated", ":settledAt": settledAt, ":pending": "pending" },
    }));
  }

  async activateDevice(input: { account: PasswordAccountRecord; policy: TransferPolicyRecord; device: DeviceRecord; previousDevice?: DeviceRecord; transfer: TransferRecord; session: { rememberDevice?: boolean; tokenHash: string; createdAt: string; expiresAt: string; expiresAtEpoch: number; passwordVersion?: number; }; }) {
    const account = { ...input.account, activeDeviceId: input.device.deviceId, deviceActivationVersion: input.device.activationVersion, updatedAt: input.transfer.createdAt };
    const policy = { ...input.policy, version: input.policy.version + 1, transfers: [...input.policy.transfers, input.transfer], updatedAt: input.transfer.createdAt };
    await mamaAiDynamoDb.send(new TransactWriteCommand({
      TransactItems: [
        { Put: { TableName: this.tableName, Item: { PK: `ACCOUNT#${account.userId}`, SK: "PROFILE", entityType: "password_account", record: account }, ConditionExpression: "#record.#deviceActivationVersion = :version", ExpressionAttributeNames: { "#record": "record", "#deviceActivationVersion": "deviceActivationVersion" }, ExpressionAttributeValues: { ":version": input.account.deviceActivationVersion } } },
        { Put: { TableName: this.tableName, Item: { PK: `ACCOUNT#${account.userId}`, SK: "TRANSFER_POLICY", entityType: "device_transfer_policy", record: policy }, ConditionExpression: "#record.#version = :policyVersion", ExpressionAttributeNames: { "#record": "record", "#version": "version" }, ExpressionAttributeValues: { ":policyVersion": input.policy.version } } },
        { Put: { TableName: this.tableName, Item: { PK: `ACCOUNT#${account.userId}`, SK: `DEVICE#${input.device.deviceId}`, entityType: "trusted_device", record: input.device } } },
        ...(input.previousDevice && input.previousDevice.deviceId !== input.device.deviceId ? [{ Put: { TableName: this.tableName, Item: { PK: `ACCOUNT#${account.userId}`, SK: `DEVICE#${input.previousDevice.deviceId}`, entityType: "trusted_device", record: { ...input.previousDevice, revokedAt: input.transfer.createdAt } } } }] : []),
        { Put: { TableName: this.tableName, Item: { PK: `SESSION#${input.session.tokenHash}`, SK: "SESSION#CURRENT", entityType: "customer_session", expiresAt: input.session.expiresAtEpoch, record: { userId: account.userId, ...input.session, passwordVersion: account.passwordVersion ?? 0, deviceId: input.device.deviceId, deviceActivationVersion: input.device.activationVersion } } } },
      ],
    }));
    return account;
  }

  async bindHousehold(userId: string, householdId: string, expectedVersion: number) {
    await mamaAiDynamoDb.send(new UpdateCommand({
      TableName: this.tableName, Key: { PK: `ACCOUNT#${userId}`, SK: "PROFILE" },
      UpdateExpression: "SET #record.#householdId = :householdId, #record.#updatedAt = :updatedAt",
      ConditionExpression: "#record.#deviceActivationVersion = :version AND (attribute_not_exists(#record.#householdId) OR #record.#householdId = :householdId)",
      ExpressionAttributeNames: { "#record": "record", "#householdId": "householdId", "#updatedAt": "updatedAt", "#deviceActivationVersion": "deviceActivationVersion" },
      ExpressionAttributeValues: { ":householdId": householdId, ":updatedAt": new Date().toISOString(), ":version": expectedVersion },
    }));
  }

  async confirmActiveDevice(userId: string, deviceId: string, confirmedAt: string) {
    const device = await this.getDevice(userId, deviceId);
    if (!device || device.revokedAt) return false;
    if (device.confirmedAt) return true;
    try {
      await mamaAiDynamoDb.send(new UpdateCommand({ TableName: this.tableName, Key: { PK: `ACCOUNT#${userId}`, SK: `DEVICE#${deviceId}` }, UpdateExpression: "SET #record.#confirmedAt = :at REMOVE #record.#confirmationDueAt", ConditionExpression: "attribute_exists(PK) AND attribute_not_exists(#record.#revokedAt) AND attribute_not_exists(#record.#confirmedAt)", ExpressionAttributeNames: { "#record": "record", "#confirmedAt": "confirmedAt", "#confirmationDueAt": "confirmationDueAt", "#revokedAt": "revokedAt" }, ExpressionAttributeValues: { ":at": confirmedAt } })); return true;
    } catch (error) { if ((error as { name?: string }).name === "ConditionalCheckFailedException") return Boolean((await this.getDevice(userId, deviceId))?.confirmedAt); throw error; }
  }
}
