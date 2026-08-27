// app/api/admin/metrics/route.ts
import { NextResponse } from "next/server";
import { docClient, TABLE_NAMES } from "@/lib/repositories/dynamo";
import { ScanCommand } from "@aws-sdk/lib-dynamodb";

export async function GET() {
    const [usersRes, plansRes, feedbackRes] = await Promise.all([
        docClient.send(new ScanCommand({ TableName: TABLE_NAMES.USERS })),
        docClient.send(new ScanCommand({ TableName: TABLE_NAMES.MEAL_PLANS, ProjectionExpression: "planId, createdAt" })),
        docClient.send(new ScanCommand({ TableName: TABLE_NAMES.FEEDBACK, ProjectionExpression: "feedbackId, action" })),
    ]);

    const users = usersRes.Items || [];
    const now = new Date();

    const metrics = {
        totalUsers: users.length,
        activeTrials: users.filter(u => u.trialEndsAt && new Date(u.trialEndsAt) > now && u.subscriptionStatus !== "active").length,
        expiredTrials: users.filter(u => u.trialEndsAt && new Date(u.trialEndsAt) <= now && u.subscriptionStatus !== "active").length,
        subscribers: {
            starter: users.filter(u => u.subscriptionStatus === "active" && u.subscriptionPlan === "starter").length,
            premium: users.filter(u => u.subscriptionStatus === "active" && u.subscriptionPlan === "premium").length,
            plus: users.filter(u => u.subscriptionStatus === "active" && u.subscriptionPlan === "plus").length,
            cancelled: users.filter(u => u.subscriptionStatus === "cancelled").length,
        },
        mealPlansGenerated: plansRes.Count || 0,
        feedbackActionsLogged: feedbackRes.Count || 0,
    };

    return NextResponse.json(metrics);
}