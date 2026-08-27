import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { docClient, TABLE_NAMES } from "@/lib/repositories/dynamo";
import { PutCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { feedbackRequestSchema } from "@/lib/shared/schemas";

export async function POST(request: Request) {
  try {
    const session = await getSession();
    const body = await request.json();
    const parsed = feedbackRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "Feedback request is invalid.", details: parsed.error.issues } },
        { status: 400 }
      );
    }

    const feedbackId = `fb_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const createdAt = new Date().toISOString();
    const userId = session?.userId || parsed.data.userId || "anonymous";

    // 1. Persist feedback event to DynamoDB
    await docClient.send(
      new PutCommand({
        TableName: TABLE_NAMES.FEEDBACK,
        Item: {
          feedbackId,
          userId,
          mealPlanId: parsed.data.mealPlanId,
          memberId: parsed.data.memberId,
          mealName: parsed.data.mealName,
          mealTime: parsed.data.mealTime,
          outcome: parsed.data.outcome,
          rating: parsed.data.rating,
          notes: parsed.data.notes,
          createdAt,
        },
      })
    );

    // 2. Conditionally update family memory if rejected or liked with explicit confirmation
    if (parsed.data.memberId && parsed.data.mealName && parsed.data.outcome === "rejected") {
      try {
        await docClient.send(
          new UpdateCommand({
            TableName: TABLE_NAMES.FAMILIES,
            Key: { familyId: parsed.data.memberId },
            UpdateExpression: "SET durablePreferences.rejectedDishes = list_append(if_not_exists(durablePreferences.rejectedDishes, :empty_list), :dish)",
            ExpressionAttributeValues: {
              ":dish": [parsed.data.mealName],
              ":empty_list": [],
            },
          })
        );
      } catch {
        // Continue cleanly if durable preferences block is not initialized
      }
    }

    return NextResponse.json({
      feedbackId,
      saved: true,
      durable: Boolean(session?.userId),
    });
  } catch (error) {
    console.error("Feedback Save Error:", error);
    return NextResponse.json(
      { error: { code: "FEEDBACK_SAVE_FAILED", message: "Could not persist feedback." } },
      { status: 500 }
    );
  }
}