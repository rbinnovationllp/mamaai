import { PutCommand } from "@aws-sdk/lib-dynamodb";
import { getMamaAiTableName, mamaAiDynamoDb } from "./dynamodb-client";

export type FamilyLearningOutcome = "cooked" | "liked" | "rejected";

export interface FamilyLearningEventInput {
  feedbackId: string;
  userId: string;
  mealPlanId: string;
  memberId?: string;
  mealName?: string;
  mealTime?: string;
  rating: "loved" | "good" | "average" | "dont_suggest_again";
  outcome?: FamilyLearningOutcome;
  notes?: string;
  createdAt: string;
}

export class FamilyLearningRepository {
  async saveFeedbackEvent(input: FamilyLearningEventInput) {
    await mamaAiDynamoDb.send(
      new PutCommand({
        TableName: getMamaAiTableName(),
        Item: {
          PK: `USER#${input.userId}`,
          SK: `LEARNING_EVENT#${input.createdAt}#${input.feedbackId}`,
          GSI1PK: `FAMILY_LEARNING#${input.userId}`,
          GSI1SK: input.createdAt,
          entityType: "family_learning_event",
          record: input,
          updatedAt: input.createdAt,
        },
      })
    );
  }
}
