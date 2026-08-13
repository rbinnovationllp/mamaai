import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, UpdateCommand } from '@aws-sdk/lib-dynamodb';

const docClient = DynamoDBDocumentClient.from(new DynamoDBClient({ region: process.env.AWS_REGION || 'ap-south-1' }));

export const PLAN_LIMITS = {
  starter: { planGenerationsMonth: 35, dishSwapsDay: 5, askMamaQueriesDay: 10 },
  premium: { planGenerationsMonth: 70, dishSwapsDay: 15, askMamaQueriesDay: 30 },
  family_plus: { planGenerationsMonth: 150, dishSwapsDay: 50, askMamaQueriesDay: 100 }
};

export async function checkAndIncrementUsage(
  userId: string,
  planTier: 'starter' | 'premium' | 'family_plus',
  actionType: 'planGen' | 'dishSwap' | 'askMama'
): Promise<{ allowed: boolean; remaining: number }> {
  const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
  const limits = PLAN_LIMITS[planTier] || PLAN_LIMITS.starter;

  const fieldMap = {
    planGen: 'planGenerationsMonth',
    dishSwap: 'dishSwapsDay',
    askMama: 'askMamaQueriesDay'
  };
  const attrName = fieldMap[actionType];
  const maxLimit = limits[attrName as keyof typeof limits];

  try {
    const res = await docClient.send(new UpdateCommand({
      TableName: process.env.MAMA_AI_TABLE_NAME || 'MAMA_AI_APP',
      Key: { PK: `USER#${userId}`, SK: `USAGE#${currentMonth}` },
      UpdateExpression: 'ADD #attr :val',
      ExpressionAttributeNames: { '#attr': attrName },
      ExpressionAttributeValues: { ':val': 1 },
      ReturnValues: 'UPDATED_NEW'
    }));

    const currentUsage = res.Attributes?.[attrName] || 1;
    if (currentUsage > maxLimit) {
      return { allowed: false, remaining: 0 };
    }
    return { allowed: true, remaining: maxLimit - currentUsage };
  } catch (err) {
    return { allowed: true, remaining: 1 }; // Soft fail open to prevent blocking legitimate traffic
  }
}