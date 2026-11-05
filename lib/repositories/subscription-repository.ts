import { hasCurrentEntitlement, needsPaymentReconciliation } from "@/lib/services/paid-entitlement";
import { ConditionalCheckFailedException } from "@aws-sdk/client-dynamodb";
import { GetCommand, PutCommand, QueryCommand, TransactWriteCommand } from "@aws-sdk/lib-dynamodb";
import type { PaymentTransaction, SubscriptionRecord } from "@/lib/shared/contracts";
import { getMamaAiTableName, mamaAiDynamoDb } from "./dynamodb-client";

export interface WebhookIdempotencyResult {
  accepted: boolean;
  idempotencyKey: string;
}

function nowIso() {
  return new Date().toISOString();
}

function subscriptionKeys(record: SubscriptionRecord) {
  return {
    PK: `USER#${record.userId}`,
    SK: `SUBSCRIPTION#RAZORPAY#${record.razorpaySubscriptionId ?? record.subscriptionRecordId}`,
  };
}

function transactionKeys(transaction: PaymentTransaction) {
  return {
    PK: `USER#${transaction.userId}`,
    SK: transaction.providerPaymentId && transaction.paymentStatus === "paid" ? `PAYMENT#RAZORPAY#${transaction.providerPaymentId}` : `PAYMENT#${transaction.createdAt}#${transaction.transactionId}`,
  };
}

export class SubscriptionRepository {
  async grantBetaEntitlement(subscription: SubscriptionRecord): Promise<SubscriptionRecord> {
    if (subscription.source !== "beta_operator" || subscription.status !== "trialing" || subscription.paymentChannel !== "manual" || subscription.paymentStatus !== "not_required") {
      throw new Error("Invalid beta entitlement record.");
    }
    await mamaAiDynamoDb.send(new PutCommand({
      TableName: getMamaAiTableName(),
      Item: {
        PK: `USER#${subscription.userId}`,
        SK: "SUBSCRIPTION#BETA#CURRENT",
        GSI1PK: "ENTITLEMENT_STATUS#trialing",
        GSI1SK: subscription.updatedAt,
        entityType: "subscription",
        record: subscription,
        updatedAt: subscription.updatedAt,
        expiresAt: Math.floor(Date.parse(subscription.expiresAt ?? subscription.updatedAt) / 1000),
      },
    }));
    return subscription;
  }

  async revokeBetaEntitlement(userId: string, now = new Date().toISOString()): Promise<boolean> {
    const current = await mamaAiDynamoDb.send(new GetCommand({ TableName: getMamaAiTableName(), ConsistentRead: true, Key: { PK: `USER#${userId}`, SK: "SUBSCRIPTION#BETA#CURRENT" } }));
    const record = current.Item?.record as SubscriptionRecord | undefined;
    if (!record || record.userId !== userId || record.source !== "beta_operator") return false;
    const revoked: SubscriptionRecord = { ...record, status: "cancelled", cancelledAt: now, updatedAt: now };
    await mamaAiDynamoDb.send(new PutCommand({ TableName: getMamaAiTableName(), Item: { ...current.Item, record: revoked, updatedAt: now } }));
    return true;
  }

  async getLatestSubscriptionForUser(userId: string): Promise<SubscriptionRecord | undefined> {
    const records: SubscriptionRecord[] = [];
    let cursor: Record<string, unknown> | undefined;
    do {
      const response = await mamaAiDynamoDb.send(new QueryCommand({
        TableName: getMamaAiTableName(),
        KeyConditionExpression: "PK = :pk AND begins_with(SK, :prefix)",
        ExpressionAttributeValues: { ":pk": `USER#${userId}`, ":prefix": "SUBSCRIPTION#" },
        ConsistentRead: true,
        ExclusiveStartKey: cursor,
      }));
      for (const item of response.Items ?? []) {
        const record = item.record as SubscriptionRecord | undefined;
        if (record?.userId === userId) records.push(record);
      }
      cursor = response.LastEvaluatedKey;
    } while (cursor);
    records.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    return records.find(record => hasCurrentEntitlement(record)) ?? records.find(record => needsPaymentReconciliation(record)) ?? records[0];
  }

  async listPaymentHistoryForUser(userId: string, limit = 20): Promise<PaymentTransaction[]> {
    const response = await mamaAiDynamoDb.send(
      new QueryCommand({
        TableName: getMamaAiTableName(),
        KeyConditionExpression: "PK = :pk AND begins_with(SK, :prefix)",
        ExpressionAttributeValues: {
          ":pk": `USER#${userId}`,
          ":prefix": "PAYMENT#",
        },
        ScanIndexForward: false,
        Limit: Math.min(Math.max(limit, 1), 50),
      })
    );

    return (response.Items ?? [])
      .map((item) => item.record as PaymentTransaction | undefined)
      .filter((item): item is PaymentTransaction => Boolean(item));
  }

  async findSubscriptionByRazorpaySubscriptionId(razorpaySubscriptionId: string): Promise<SubscriptionRecord | undefined> {
    const response = await mamaAiDynamoDb.send(
      new QueryCommand({
        TableName: getMamaAiTableName(),
        IndexName: process.env.MAMA_AI_DYNAMODB_GSI1_NAME ?? "GSI1",
        KeyConditionExpression: "GSI1PK = :pk",
        ExpressionAttributeValues: {
          ":pk": `RAZORPAY_SUBSCRIPTION#${razorpaySubscriptionId}`,
          ":subscription": "subscription",
        },
        FilterExpression: "entityType = :subscription",
      })
    );

    return response.Items?.[0]?.record as SubscriptionRecord | undefined;
  }

  async getSubscriptionForUserByRazorpaySubscriptionId(
    userId: string,
    razorpaySubscriptionId: string
  ): Promise<SubscriptionRecord | undefined> {
    const response = await mamaAiDynamoDb.send(
      new GetCommand({
        ConsistentRead: true,
        TableName: getMamaAiTableName(),
        Key: {
          PK: `USER#${userId}`,
          SK: `SUBSCRIPTION#RAZORPAY#${razorpaySubscriptionId}`,
        },
      })
    );

    return response.Item?.record as SubscriptionRecord | undefined;
  }

  async saveSubscriptionAndPayment(input: {
    subscription: SubscriptionRecord;
    payment: PaymentTransaction;
    webhookKey?: string;
    expectedUpdatedAt?: string;
  }): Promise<SubscriptionRecord> {
    const tableName = getMamaAiTableName();
    const subscriptionKey = subscriptionKeys(input.subscription);
    const transactionKey = transactionKeys(input.payment);

    await mamaAiDynamoDb.send(
      new TransactWriteCommand({
        TransactItems: [
          ...(input.webhookKey ? [{ Put: {
            TableName: tableName,
            Item: { PK: "WEBHOOK#RAZORPAY", SK: `razorpay:atomic:${input.webhookKey}`, entityType: "webhook_idempotency", createdAt: nowIso() },
            ConditionExpression: "attribute_not_exists(PK)",
          } }] : []),
          {
            Put: {
              TableName: tableName,
              ConditionExpression: input.expectedUpdatedAt ? "#updated = :previous" : "attribute_not_exists(PK)",
              ...(input.expectedUpdatedAt ? { ExpressionAttributeNames: { "#updated": "updatedAt" }, ExpressionAttributeValues: { ":previous": input.expectedUpdatedAt } } : {}),
              Item: {
                ...subscriptionKey,
                GSI1PK: `RAZORPAY_SUBSCRIPTION#${input.subscription.razorpaySubscriptionId}`,
                GSI1SK: input.subscription.updatedAt,
                GSI2PK: `USER_SUBSCRIPTIONS#${input.subscription.userId}`,
                GSI2SK: input.subscription.updatedAt,
                entityType: "subscription",
                record: input.subscription,
                updatedAt: input.subscription.updatedAt,
              },
            },
          },
          {
            Put: {
              TableName: tableName,
              Item: {
                ...transactionKey,
                GSI1PK: input.payment.providerPaymentId ? `RAZORPAY_PAYMENT#${input.payment.providerPaymentId}` : undefined,
                GSI1SK: input.payment.createdAt,
                GSI2PK: `PAYMENTS#${input.payment.paymentStatus}`,
                GSI2SK: input.payment.createdAt,
                entityType: "payment_transaction",
                record: input.payment,
                createdAt: input.payment.createdAt,
              },
            },
          },
          {
            Put: {
              TableName: tableName,
              Item: {
                PK: `USER#${input.subscription.userId}`,
                SK: "ENTITLEMENT#CURRENT",
                GSI1PK: `ENTITLEMENT_STATUS#${input.subscription.status}`,
                GSI1SK: input.subscription.updatedAt,
                entityType: "current_entitlement",
                record: {
                  userId: input.subscription.userId,
                  plan: input.subscription.plan,
                  memberLimit: input.subscription.memberLimit,
                  source: input.subscription.source,
                  status: input.subscription.status,
                  paymentChannel: input.subscription.paymentChannel,
                  paymentStatus: input.subscription.paymentStatus,
                  isActive: hasCurrentEntitlement(input.subscription),
                  bypassPaymentForDemo: false,
                  razorpaySubscriptionId: input.subscription.razorpaySubscriptionId,
                  startsAt: input.subscription.startsAt,
                  renewsAt: input.subscription.renewsAt,
                  expiresAt: input.subscription.expiresAt,
                  cancelledAt: input.subscription.cancelledAt,
                  checkedAt: input.subscription.updatedAt,
                },
                updatedAt: input.subscription.updatedAt,
              },
            },
          },
        ],
      })
    );

    return input.subscription;
  }

  async acceptWebhookOnce(input: {
    provider: "razorpay";
    idempotencyKey: string;
    eventType: string;
    bodyHash: string;
  }): Promise<WebhookIdempotencyResult> {
    const idempotencyKey = `${input.provider}:${input.idempotencyKey}`;
    try {
      await mamaAiDynamoDb.send(
        new PutCommand({
          TableName: getMamaAiTableName(),
          Item: {
            PK: `WEBHOOK#${input.provider.toUpperCase()}`,
            SK: idempotencyKey,
            entityType: "webhook_idempotency",
            eventType: input.eventType,
            bodyHash: input.bodyHash,
            createdAt: nowIso(),
          },
          ConditionExpression: "attribute_not_exists(PK) AND attribute_not_exists(SK)",
        })
      );
      return { accepted: true, idempotencyKey };
    } catch (error) {
      if (error instanceof ConditionalCheckFailedException || (error as { name?: string }).name === "ConditionalCheckFailedException") {
        return { accepted: false, idempotencyKey };
      }
      throw error;
    }
  }

  async getWebhookRecord(provider: "razorpay", idempotencyKey: string) {
    const response = await mamaAiDynamoDb.send(
      new GetCommand({
        ConsistentRead: true,
        TableName: getMamaAiTableName(),
        Key: {
          PK: `WEBHOOK#${provider.toUpperCase()}`,
          SK: `${provider}:${idempotencyKey}`,
        },
      })
    );
    return response.Item;
  }
}
