// lib/repositories/dynamo.ts
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
    DynamoDBDocumentClient,
    GetCommand,
    PutCommand,
    UpdateCommand,
    DeleteCommand,
    QueryCommand
} from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({
    region: process.env.AWS_REGION || "ap-south-1",
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
    },
});

export const docClient = DynamoDBDocumentClient.from(client, {
    marshallOptions: { removeUndefinedValues: true },
});

export const TABLE_NAMES = {
    USERS: process.env.DYNAMODB_USERS_TABLE || "mamaai_users",
    FAMILIES: process.env.DYNAMODB_FAMILIES_TABLE || "mamaai_families",
    MEAL_PLANS: process.env.DYNAMODB_MEAL_PLANS_TABLE || "mamaai_meal_plans",
    PANTRY: process.env.DYNAMODB_PANTRY_TABLE || "mamaai_pantry",
    FEEDBACK: process.env.DYNAMODB_FEEDBACK_TABLE || "mamaai_feedback",
    ANALYTICS: process.env.DYNAMODB_ANALYTICS_TABLE || "mamaai_analytics",
};

// Family Repository Implementation
export const FamilyRepository = {
    async getByUserId(userId: string) {
        const res = await docClient.send(new QueryCommand({
            TableName: TABLE_NAMES.FAMILIES,
            IndexName: "UserIdIndex",
            KeyConditionExpression: "userId = :uid",
            ExpressionAttributeValues: { ":uid": userId },
        }));
        return res.Items?.[0] || null;
    },

    async save(familyData: Record<string, any>) {
        familyData.updatedAt = new Date().toISOString();
        await docClient.send(new PutCommand({
            TableName: TABLE_NAMES.FAMILIES,
            Item: familyData,
        }));
        return familyData;
    },
};