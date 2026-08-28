// app/api/meal-plan/replace-slot/route.ts
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { docClient, TABLE_NAMES } from "@/lib/repositories/dynamo";
import { QueryCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { MealPlanningService } from "@/lib/services/meal-planning-service";

export async function POST(req: Request) {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { familyId, mealPlanId, rejectedDish, userPromptOverride, targetSlot = "dinner", language = "hi" } = await req.json();

    // 1. Fetch recent history from DynamoDB to ensure rotation
    const recentHistoryRes = await docClient.send(
        new QueryCommand({
            TableName: TABLE_NAMES.MEAL_PLANS,
            IndexName: "FamilyDateIndex",
            KeyConditionExpression: "familyId = :fid",
            ExpressionAttributeValues: { ":fid": familyId },
            Limit: 7,
        })
    );

    const pastDishes = (recentHistoryRes.Items || []).map((p: any) => p.commonMeal?.name).filter(Boolean);
    const excludeDishes = Array.from(new Set([rejectedDish, ...pastDishes]));

    // 2. Log rejection event for family learning
    await docClient.send(
        new UpdateCommand({
            TableName: TABLE_NAMES.FAMILIES,
            Key: { familyId },
            UpdateExpression: "SET durablePreferences.recentRejections = list_append(if_not_exists(durablePreferences.recentRejections, :empty), :dish)",
            ExpressionAttributeValues: {
                ":dish": [rejectedDish],
                ":empty": [],
            },
        })
    );

    // 3. Generate new replacement meal slot
    const planner = new MealPlanningService();
    const newMeal = await planner.generate({
        familyId,
        planType: "daily",
        mealSlot: targetSlot,
        excludeDishes,
        userPromptOverride,
        targetDate: new Date().toISOString().slice(0, 10),
    });

    return NextResponse.json({ success: true, mealPlan: newMeal.mealPlan });
}