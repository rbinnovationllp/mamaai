import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const dbClient = DynamoDBDocumentClient.from(new DynamoDBClient({ region: process.env.AWS_REGION || 'ap-south-1' }));

export async function POST(req: Request) {
  try {
    const { userId, date, mealType, reason } = await req.json();

    // 1. Fetch compact memory profile (Deterministic Read)
    const memRes = await dbClient.send(new GetCommand({
      TableName: process.env.MAMA_AI_TABLE_NAME || 'MAMA_AI_APP',
      Key: { PK: `USER#${userId}`, SK: 'MEMORY' }
    }));
    const memory = memRes.Item?.longTermMemory || { favoriteMeals: [], dislikes: [], recentMeals: [] };

    // 2. Build Minimal Context Payload (< 120 Tokens)
    const compactPrompt = `
Generate ONLY ONE replacement dish for ${mealType}.
Family Favorites: ${memory.favoriteMeals.slice(0, 5).join(', ')}.
Dislikes: ${memory.dislikes.join(', ')}.
Avoid Recent Dishes: ${memory.recentMeals.slice(0, 5).join(', ')}.
Reason for swap: ${reason || 'Change preference'}.
Return strictly JSON: { "dishName": "", "prepTimeMinutes": 20, "keyIngredients": [] }
`;

    // 3. Call Low-Cost Model (Gemini 1.5 Flash)
    const model = genAI.getGenerativeModel({ model: process.env.AI_PRIMARY_MODEL || 'gemini-1.5-flash' });
    const aiRes = await model.generateContent(compactPrompt);
    const replacementDish = JSON.parse(aiRes.response.text());

    // 4. Update Meal Record Differential via DynamoDB Update
    await dbClient.send(new UpdateCommand({
      TableName: process.env.MAMA_AI_TABLE_NAME || 'MAMA_AI_APP',
      Key: { PK: `USER#${userId}`, SK: `MEAL#${date}` },
      UpdateExpression: 'SET meals.#m = :dish, modified = :t',
      ExpressionAttributeNames: { '#m': mealType },
      ExpressionAttributeValues: { ':dish': replacementDish, ':t': true }
    }));

    return NextResponse.json({ success: true, replacementDish });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to perform differential swap' }, { status: 500 });
  }
}