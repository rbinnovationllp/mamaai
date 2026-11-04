import { GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import { getMamaAiTableName, mamaAiDynamoDb } from "./dynamodb-client";

export type ShoppingListItem = { itemId: string; name: string; quantityToPurchase: string; purchased: boolean; note?: string; quantityNeedsConfirmation?: boolean };
export type WeeklyShoppingListRecord = { userId: string; familyId: string; weekStartDate: string; sourcePlanVersion: number; sourceFingerprint: string; stale: boolean; items: ShoppingListItem[]; createdAt: string; updatedAt: string };

const key = (userId: string, familyId: string, weekStartDate: string) => ({ PK: `USER#${userId}`, SK: `SHOPPING_LIST#${familyId}#${weekStartDate}` });

export class WeeklyShoppingListRepository {
  async get(userId: string, familyId: string, weekStartDate: string) {
    const result = await mamaAiDynamoDb.send(new GetCommand({ TableName: getMamaAiTableName(), Key: key(userId, familyId, weekStartDate) }));
    return result.Item?.record as WeeklyShoppingListRecord | undefined;
  }
  async save(record: WeeklyShoppingListRecord) {
    await mamaAiDynamoDb.send(new PutCommand({ TableName: getMamaAiTableName(), Item: { ...key(record.userId, record.familyId, record.weekStartDate), GSI1PK: `USER_SHOPPING_LISTS#${record.userId}`, GSI1SK: `${record.weekStartDate}#${record.updatedAt}`, entityType: "weekly_shopping_list", record, updatedAt: record.updatedAt } }));
    return record;
  }
}
