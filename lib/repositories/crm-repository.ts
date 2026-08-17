import { randomUUID } from "crypto";
import { PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { getMamaAiTableName, mamaAiDynamoDb } from "./dynamodb-client";

export type CustomerStatus = "active" | "trialing" | "past_due" | "cancelled" | "expired";

export interface CrmCustomerSummary {
  userId: string;
  plan?: string;
  memberLimit?: number;
  status?: string;
  paymentStatus?: string;
  paymentChannel?: string;
  razorpaySubscriptionId?: string;
  startsAt?: string;
  renewsAt?: string;
  cancelledAt?: string;
  checkedAt?: string;
}

export interface SupportNote {
  noteId: string;
  userId: string;
  note: string;
  authorId: string;
  createdAt: string;
}

function encodeCursor(key?: Record<string, unknown>) {
  return key ? Buffer.from(JSON.stringify(key)).toString("base64url") : undefined;
}

function decodeCursor(value?: string | null) {
  if (!value) return undefined;
  try {
    return JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as Record<string, unknown>;
  } catch {
    return undefined;
  }
}

function nowIso() {
  return new Date().toISOString();
}

export class CrmRepository {
  async listCustomers(input: {
    status: CustomerStatus;
    limit?: number;
    cursor?: string | null;
  }): Promise<{ customers: CrmCustomerSummary[]; nextCursor?: string }> {
    const response = await mamaAiDynamoDb.send(
      new QueryCommand({
        TableName: getMamaAiTableName(),
        IndexName: process.env.MAMA_AI_DYNAMODB_GSI1_NAME ?? "GSI1",
        KeyConditionExpression: "GSI1PK = :pk",
        ExpressionAttributeValues: {
          ":pk": `ENTITLEMENT_STATUS#${input.status}`,
        },
        ScanIndexForward: false,
        Limit: Math.min(Math.max(input.limit ?? 25, 1), 100),
        ExclusiveStartKey: decodeCursor(input.cursor),
      })
    );

    const customers = (response.Items ?? [])
      .map((item) => item.record as CrmCustomerSummary | undefined)
      .filter((item): item is CrmCustomerSummary => Boolean(item?.userId));

    return {
      customers,
      nextCursor: encodeCursor(response.LastEvaluatedKey),
    };
  }

  async addSupportNote(input: {
    userId: string;
    note: string;
    authorId: string;
  }): Promise<SupportNote> {
    const note: SupportNote = {
      noteId: randomUUID(),
      userId: input.userId,
      note: input.note.slice(0, 2000),
      authorId: input.authorId,
      createdAt: nowIso(),
    };

    await mamaAiDynamoDb.send(
      new PutCommand({
        TableName: getMamaAiTableName(),
        Item: {
          PK: `CUSTOMER#${input.userId}`,
          SK: `SUPPORT_NOTE#${note.createdAt}#${note.noteId}`,
          GSI1PK: `SUPPORT_NOTES#${input.userId}`,
          GSI1SK: note.createdAt,
          entityType: "support_note",
          record: note,
          createdAt: note.createdAt,
        },
        ConditionExpression: "attribute_not_exists(PK) AND attribute_not_exists(SK)",
      })
    );

    return note;
  }

  async listSupportNotes(userId: string, limit = 25): Promise<SupportNote[]> {
    const response = await mamaAiDynamoDb.send(
      new QueryCommand({
        TableName: getMamaAiTableName(),
        KeyConditionExpression: "PK = :pk AND begins_with(SK, :prefix)",
        ExpressionAttributeValues: {
          ":pk": `CUSTOMER#${userId}`,
          ":prefix": "SUPPORT_NOTE#",
        },
        ScanIndexForward: false,
        Limit: Math.min(Math.max(limit, 1), 50),
      })
    );

    return (response.Items ?? [])
      .map((item) => item.record as SupportNote | undefined)
      .filter((item): item is SupportNote => Boolean(item));
  }

  async writeAudit(input: {
    actorId: string;
    action: string;
    targetUserId?: string;
    metadata?: Record<string, unknown>;
  }) {
    const createdAt = nowIso();
    await mamaAiDynamoDb.send(
      new PutCommand({
        TableName: getMamaAiTableName(),
        Item: {
          PK: "ADMIN_AUDIT",
          SK: `AUDIT#${createdAt}#${randomUUID()}`,
          GSI1PK: `ADMIN_ACTOR#${input.actorId}`,
          GSI1SK: createdAt,
          entityType: "admin_audit",
          actorId: input.actorId,
          action: input.action,
          targetUserId: input.targetUserId,
          metadata: input.metadata,
          createdAt,
        },
        ConditionExpression: "attribute_not_exists(PK) AND attribute_not_exists(SK)",
      })
    );
  }
}

