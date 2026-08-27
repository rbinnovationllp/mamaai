import { DeleteCommand, PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { createId } from "./in-memory-store";
import { getMamaAiTableName, mamaAiDynamoDb } from "./dynamodb-client";

export interface PantryItemRecord {
  id: string;
  userId: string;
  ingredientName: string;
  normalizedIngredientKey: string;
  category: string;
  quantity: number;
  unit: string;
  minimumQuantity: number;
  purchaseDate?: string;
  expiryDate?: string;
  status: "AVAILABLE" | "RUNNING_LOW" | "USE_SOON" | "OUT_OF_STOCK";
  createdAt: string;
  updatedAt: string;
}

export interface PantryItemInput {
  id?: string;
  ingredientName: string;
  category?: string;
  quantity: number;
  unit: string;
  minimumQuantity?: number;
  purchaseDate?: string;
  expiryDate?: string;
}

function nowIso() {
  return new Date().toISOString();
}

export function normalizeIngredientKey(value: string) {
  const singularized = value
    .trim()
    .toLowerCase()
    .replace(/mung dal/g, "moong dal")
    .replace(/tomatoes/g, "tomato")
    .replace(/potatoes/g, "potato")
    .replace(/onions/g, "onion")
    .replace(/[^a-z0-9 ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return singularized || "ingredient";
}

function pantryStatus(input: { quantity: number; minimumQuantity: number; expiryDate?: string }): PantryItemRecord["status"] {
  if (input.quantity <= 0) return "OUT_OF_STOCK";
  if (input.quantity <= input.minimumQuantity) return "RUNNING_LOW";
  if (input.expiryDate) {
    const days = (new Date(input.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    if (days >= 0 && days <= 7) return "USE_SOON";
  }
  return "AVAILABLE";
}

function keys(userId: string, item: Pick<PantryItemRecord, "id" | "normalizedIngredientKey">) {
  return {
    PK: `USER#${userId}`,
    SK: `PANTRY#${item.normalizedIngredientKey}#${item.id}`,
  };
}

export class PantryRepository {
  async listForUser(userId: string): Promise<PantryItemRecord[]> {
    const response = await mamaAiDynamoDb.send(
      new QueryCommand({
        TableName: getMamaAiTableName(),
        KeyConditionExpression: "PK = :pk AND begins_with(SK, :prefix)",
        ExpressionAttributeValues: {
          ":pk": `USER#${userId}`,
          ":prefix": "PANTRY#",
        },
      })
    );

    return (response.Items ?? [])
      .map((item) => item.record as PantryItemRecord | undefined)
      .filter((item): item is PantryItemRecord => Boolean(item))
      .sort((a, b) => a.ingredientName.localeCompare(b.ingredientName));
  }

  async saveItem(userId: string, input: PantryItemInput): Promise<PantryItemRecord> {
    const timestamp = nowIso();
    const normalizedIngredientKey = normalizeIngredientKey(input.ingredientName);
    const record: PantryItemRecord = {
      id: input.id || createId("pantry"),
      userId,
      ingredientName: input.ingredientName.trim(),
      normalizedIngredientKey,
      category: input.category?.trim() || "Pantry",
      quantity: Number(input.quantity),
      unit: input.unit.trim(),
      minimumQuantity: Number(input.minimumQuantity ?? 0),
      purchaseDate: input.purchaseDate || undefined,
      expiryDate: input.expiryDate || undefined,
      status: pantryStatus({ quantity: Number(input.quantity), minimumQuantity: Number(input.minimumQuantity ?? 0), expiryDate: input.expiryDate }),
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    await mamaAiDynamoDb.send(
      new PutCommand({
        TableName: getMamaAiTableName(),
        Item: {
          ...keys(userId, record),
          GSI1PK: `PANTRY#${userId}`,
          GSI1SK: `${record.normalizedIngredientKey}#${record.updatedAt}`,
          entityType: "pantry_item",
          record,
          updatedAt: timestamp,
        },
      })
    );

    return record;
  }

  async saveMany(userId: string, inputs: PantryItemInput[]): Promise<PantryItemRecord[]> {
    const unique = new Map<string, PantryItemInput>();
    for (const item of inputs) {
      if (!item.ingredientName?.trim()) continue;
      unique.set(`${normalizeIngredientKey(item.ingredientName)}#${item.unit.trim().toLowerCase()}`, item);
    }
    const saved: PantryItemRecord[] = [];
    for (const item of unique.values()) {
      saved.push(await this.saveItem(userId, item));
    }
    return saved;
  }

  async deleteItem(userId: string, item: Pick<PantryItemRecord, "id" | "normalizedIngredientKey">) {
    await mamaAiDynamoDb.send(
      new DeleteCommand({
        TableName: getMamaAiTableName(),
        Key: keys(userId, item),
      })
    );
  }
}
