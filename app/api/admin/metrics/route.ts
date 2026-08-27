import { NextResponse } from "next/server";
import { ScanCommand } from "@aws-sdk/lib-dynamodb";
import { getMamaAiTableName, mamaAiDynamoDb } from "@/lib/repositories/dynamodb-client";
import { adminErrorResponse, requireAdmin } from "@/lib/server/admin";
import type { SubscriptionEntitlement } from "@/lib/shared/contracts";

async function countByEntityType(entityType: string) {
    const response = await mamaAiDynamoDb.send(
        new ScanCommand({
            TableName: getMamaAiTableName(),
            Select: "COUNT",
            FilterExpression: "entityType = :entityType",
            ExpressionAttributeValues: {
                ":entityType": entityType,
            },
        })
    );

    return response.Count ?? 0;
}

async function listCurrentEntitlements() {
    const response = await mamaAiDynamoDb.send(
        new ScanCommand({
            TableName: getMamaAiTableName(),
            FilterExpression: "entityType = :entityType",
            ExpressionAttributeValues: {
                ":entityType": "current_entitlement",
            },
        })
    );

    return (response.Items ?? [])
        .map((item) => item.record as SubscriptionEntitlement | undefined)
        .filter((item): item is SubscriptionEntitlement => Boolean(item));
}

export async function GET(request: Request) {
    try {
        requireAdmin(request);

        const [usersCount, plansCount, feedbackCount, entitlements] = await Promise.all([
            countByEntityType("customer_account"),
            countByEntityType("meal_plan"),
            countByEntityType("family_learning_event"),
            listCurrentEntitlements(),
        ]);
        const now = Date.now();
        const isTrialing = (entitlement: SubscriptionEntitlement) =>
            entitlement.status === "trialing" &&
            (!entitlement.expiresAt || new Date(entitlement.expiresAt).getTime() > now);
        const isExpiredTrial = (entitlement: SubscriptionEntitlement) =>
            entitlement.status === "trialing" &&
            Boolean(entitlement.expiresAt) &&
            new Date(entitlement.expiresAt as string).getTime() <= now;
        const isActivePlan = (entitlement: SubscriptionEntitlement, plan: string) =>
            entitlement.isActive &&
            entitlement.status === "active" &&
            (entitlement.plan === plan || entitlement.plan === `family_${plan}`);

        return NextResponse.json({
            totalUsers: usersCount,
            activeTrials: entitlements.filter(isTrialing).length,
            expiredTrials: entitlements.filter(isExpiredTrial).length,
            subscribers: {
                starter: entitlements.filter((item) => isActivePlan(item, "starter")).length,
                premium: entitlements.filter((item) => isActivePlan(item, "premium")).length,
                plus: entitlements.filter((item) => isActivePlan(item, "plus") || item.plan === "family_plus").length,
                cancelled: entitlements.filter((item) => item.status === "cancelled").length,
            },
            mealPlansGenerated: plansCount,
            feedbackActionsLogged: feedbackCount,
            storage: {
                primaryDatabase: "DynamoDB single-table",
                tableName: getMamaAiTableName(),
                s3Active: false,
                s3Note: "S3 environment references are reserved for future exports/media storage; core customer runtime uses DynamoDB.",
            },
        });
    } catch (error) {
        return adminErrorResponse(error);
    }
}
