import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

export function getMamaAiTableName() {
  const tableName = process.env.MAMA_AI_DYNAMODB_TABLE_NAME ?? process.env.MAMA_AI_TABLE_NAME;
  if (!tableName) {
    throw new Error("MAMAAI DynamoDB table is not configured.");
  }
  return tableName;
}

export const mamaAiDynamoDb = DynamoDBDocumentClient.from(
  new DynamoDBClient({ region: process.env.AWS_REGION ?? "ap-south-1" }),
  {
    marshallOptions: {
      removeUndefinedValues: true,
      convertClassInstanceToMap: true,
    },
  }
);

