import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';

const docClient = DynamoDBDocumentClient.from(new DynamoDBClient({ region: process.env.AWS_REGION || 'ap-south-1' }));

export async function consolidateMonthlyMemory(userId: string, yearMonth: string) {
  // 1. Query short-term meal records for the calendar month
  const logsRes = await docClient.send(new QueryCommand({
    TableName: process.env.MAMA_AI_TABLE_NAME || 'MAMA_AI_APP',
    KeyConditionExpression: 'PK = :pk AND begins_with(SK, :skPrefix)',
    ExpressionAttributeValues: {
      ':pk': `USER#${userId}`,
      ':skPrefix': `MEAL#${yearMonth}`
    }
  }));

  const items = logsRes.Items || [];
  const likedDishes: Record<string, number> = {};
  const rejectedDishes: Record<string, number> = {};

  items.forEach((item) => {
    if (item.feedback === 'loved') likedDishes[item.cookedDish] = (likedDishes[item.cookedDish] || 0) + 1;
    if (item.feedback === 'rejected') rejectedDishes[item.cookedDish] = (rejectedDishes[item.cookedDish] || 0) + 1;
  });

  const topFavorites = Object.keys(likedDishes).filter((k) => likedDishes[k] >= 2);
  const topDislikes = Object.keys(rejectedDishes).filter((k) => rejectedDishes[k] >= 2);

  // 2. Compress insights into long-term memory record (MAMA_AI_USERS)
  await docClient.send(new UpdateCommand({
    TableName: process.env.MAMA_AI_TABLE_NAME || 'MAMA_AI_APP',
    Key: { PK: `USER#${userId}`, SK: 'MEMORY' },
    UpdateExpression: 'ADD favoriteMeals :favs, dislikes :dislikes SET lastConsolidated = :now',
    ExpressionAttributeValues: {
      ':favs': new Set(topFavorites),
      ':dislikes': new Set(topDislikes),
      ':now': new Date().toISOString()
    }
  }));
}