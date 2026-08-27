// app/api/admin/analytics/route.ts
import { NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand } from '@aws-sdk/lib-dynamodb';

const docClient = DynamoDBDocumentClient.from(new DynamoDBClient({ region: process.env.AWS_REGION || 'ap-south-1' }));

function eventName(item: Record<string, unknown>) {
  return String(item.eventName ?? item.eventType ?? '');
}

function round(value: number) {
  return Math.round(value * 100) / 100;
}

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
  const askMamaUsages = items.filter((i) => ['ask_mama_used', 'ask_mama_question'].includes(eventName(i))).length;
  const mealPlans = items.filter((i) => eventName(i) === 'meal_plan_generated').length;
  const differentialSwaps = items.filter((i) => ['dish_swapped', 'meal_replaced'].includes(eventName(i))).length;
  const recipeVideoRequests = items.filter((i) => eventName(i) === 'recipe_video_requested').length;

  // Estimated Monthly Unit Financials
  const activeUserDivisor = Math.max(1, activeUsers);
  const usageMultiplier = Math.max(
    1,
    (mealPlans * 1.2 + differentialSwaps * 0.7 + askMamaUsages * 0.35 + recipeVideoRequests * 0.1) /
      activeUserDivisor
  );
  const estAiCostPerUserINR = round(Math.min(95, 9 + usageMultiplier * 3.5));
  const estAwsCostPerUserINR = round(10 + usageMultiplier * 1.6);
  const estPlatformCostPerUserINR = round(8 + usageMultiplier * 0.9);
  const estTechCostBeforePaymentINR = round(estAiCostPerUserINR + estAwsCostPerUserINR + estPlatformCostPerUserINR);
  const planEconomics = [
    { plan: 'Family Starter', currentPriceINR: 399, suggestedAfterSeptINR: 449 },
    { plan: 'Family Premium', currentPriceINR: 599, suggestedAfterSeptINR: 699 },
    { plan: 'Family Plus', currentPriceINR: 999, suggestedAfterSeptINR: 1199 },
  ].map((plan) => {
    const estimatedPaymentCostINR = round(plan.currentPriceINR * 0.025);
    const estimatedTotalCostINR = round(estTechCostBeforePaymentINR + estimatedPaymentCostINR);
    const estimatedMarginPercent = round(((plan.currentPriceINR - estimatedTotalCostINR) / plan.currentPriceINR) * 100);
    return {
      ...plan,
      estimatedAiCostINR: estAiCostPerUserINR,
      estimatedAwsCostINR: estAwsCostPerUserINR,
      estimatedPlatformCostINR: estPlatformCostPerUserINR,
      estimatedPaymentCostINR,
      estimatedTotalCostINR,
      estimatedMarginPercent,
      marginStatus: estimatedMarginPercent >= 50 ? 'HEALTHY_MARGIN' : 'MARGIN_WARNING',
    };
  });

  return NextResponse.json({
    metrics: {
      currentMonth,
      activeUsersToday: activeUsers,
      askMamaQueriesToday: askMamaUsages,
      mealPlansToday: mealPlans,
      differentialSwapsToday: differentialSwaps,
      recipeVideoRequestsToday: recipeVideoRequests,
      unitEconomics: {
        currentPricesLockedUntil: '2026-09-15',
        marginTargetPercent: 50,
        assumptions:
          'Early estimate from AI-generation events, not meal views. A heavy family may open 4 meals/day, but same-day cache should keep this closer to 30 main planning sessions/month unless replacements are requested. Keep pricing unchanged before 15 September 2026; use fair-use controls, compact prompts and cached plans if usage rises.',
        planEconomics,
      }
    }
  });
}
