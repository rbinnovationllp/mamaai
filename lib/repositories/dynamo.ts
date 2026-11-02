import { GetCommand, PutCommand, UpdateCommand, DeleteCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { getLegacyDynamoTableName } from "@/lib/server/dynamodb-configuration";
import { mamaAiDynamoDb } from "./dynamodb-client";

export const docClient = mamaAiDynamoDb;

function legacyTable(variableName: string, productionFallback: string) {
  return () => getLegacyDynamoTableName(variableName, productionFallback);
}

export const TABLE_NAMES = Object.defineProperties({}, {
  USERS: { enumerable: true, get: legacyTable("DYNAMODB_USERS_TABLE", "mamaai_users") },
  FAMILIES: { enumerable: true, get: legacyTable("DYNAMODB_FAMILIES_TABLE", "mamaai_families") },
  MEAL_PLANS: { enumerable: true, get: legacyTable("DYNAMODB_MEAL_PLANS_TABLE", "mamaai_meal_plans") },
  PANTRY: { enumerable: true, get: legacyTable("DYNAMODB_PANTRY_TABLE", "mamaai_pantry") },
  FEEDBACK: { enumerable: true, get: legacyTable("DYNAMODB_FEEDBACK_TABLE", "mamaai_feedback") },
  ANALYTICS: { enumerable: true, get: legacyTable("DYNAMODB_ANALYTICS_TABLE", "mamaai_analytics") },
}) as Record<"USERS" | "FAMILIES" | "MEAL_PLANS" | "PANTRY" | "FEEDBACK" | "ANALYTICS", string>;

export const FamilyRepository = {
  async getByUserId(userId: string) {
    const res = await docClient.send(new QueryCommand({ TableName: TABLE_NAMES.FAMILIES, IndexName: "UserIdIndex", KeyConditionExpression: "userId = :uid", ExpressionAttributeValues: { ":uid": userId } }));
    return res.Items?.[0] || null;
  },
  async save(familyData: Record<string, unknown>) {
    const item = { ...familyData, updatedAt: new Date().toISOString() };
    await docClient.send(new PutCommand({ TableName: TABLE_NAMES.FAMILIES, Item: item }));
    return item;
  },
};

export { GetCommand, PutCommand, UpdateCommand, DeleteCommand, QueryCommand };
