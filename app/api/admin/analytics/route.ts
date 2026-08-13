// app/api/admin/analytics/route.ts
import { NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand } from '@aws-sdk/lib-dynamodb';

const docClient = DynamoDBDocumentClient.from(new DynamoDBClient({ region: process.env.AWS_REGION || 'ap-south-1' }));

export async function GET() {
  const currentMonth = new Date().toISOString().slice(0, 7);
  const today = new Date().toISOString().split('T')[0];

  // Fetch telemetry events for current date
  const eventsRes = await docClient.send(new QueryCommand({
    TableName: process.env.MAMA_AI_ANALYTICS_TABLE || 'MAMA_AI_ANALYTICS_EVENTS',
    KeyConditionExpression: 'PK = :pk',
    ExpressionAttributeValues: { ':pk': `EVENT#${today}` }
  }));

  const items = eventsRes.Items || [];
  const activeUsers = new Set(items.map((i) => i.visitorId)).size;
  const askMamaUsages = items.filter((i) => i.eventType === 'ask_mama_used').length;
  const differentialSwaps = items.filter((i) => i.eventType === 'dish_swapped').length;

  // Estimated Monthly Unit Financials
  const estMonthlyTokensPerUser = (askMamaUsages * 400) + (differentialSwaps * 150) + 5000;
  const estAiCostPerUserINR = (estMonthlyTokensPerUser / 1000000) * 12.50 * 83.5; // Gemini Flash pricing in INR
  const totalTechCostINR = estAiCostPerUserINR + 7.20; // AI + AWS DynamoDB/S3 base
  const netRevenueINR = 331.38; // Net of GST & Razorpay fees
  const grossMarginPercent = ((netRevenueINR - totalTechCostINR) / netRevenueINR) * 100;

  return NextResponse.json({
    metrics: {
      activeUsersToday: activeUsers,
      askMamaQueriesToday: askMamaUsages,
      differentialSwapsToday: differentialSwaps,
      unitEconomics: {
        subscriptionPriceINR: 399.00,
        netRevenueINR: netRevenueINR,
        estTechCostPerUserINR: totalTechCostINR.toFixed(2),
        currentOperatingMarginPercent: grossMarginPercent.toFixed(1) + '%',
        marginStatus: grossMarginPercent >= 50.0 ? 'HEALTHY_MARGIN' : 'MARGIN_WARNING'
      }
    }
  });
}