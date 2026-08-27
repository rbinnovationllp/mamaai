import { GetCommand, PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { createId } from "./in-memory-store";
import { getMamaAiTableName, mamaAiDynamoDb } from "./dynamodb-client";
import type { Family, FamilyMealPlan, FamilyMember } from "@/lib/shared/contracts";

function nowIso() {
  return new Date().toISOString();
}

function familyPk(familyId: string) {
  return `FAMILY#${familyId}`;
}

export interface FamilyContextRecord {
  family: Family;
  members: FamilyMember[];
}

export class FamilyMealRepository {
  async saveFamilyContext(input: FamilyContextRecord): Promise<FamilyContextRecord> {
    const tableName = getMamaAiTableName();
    const updatedAt = nowIso();

    await mamaAiDynamoDb.send(
      new PutCommand({
        TableName: tableName,
        Item: {
          PK: familyPk(input.family.familyId),
          SK: "FAMILY#PROFILE",
          GSI1PK: `USER_FAMILIES#${input.family.userId}`,
          GSI1SK: updatedAt,
          entityType: "family",
          record: input.family,
          updatedAt,
        },
      })
    );

    for (const member of input.members) {
      await mamaAiDynamoDb.send(
        new PutCommand({
          TableName: tableName,
          Item: {
            PK: familyPk(input.family.familyId),
            SK: `MEMBER#${member.memberId}`,
            GSI1PK: `USER_FAMILY_MEMBERS#${input.family.userId}`,
            GSI1SK: `${input.family.familyId}#${member.memberId}`,
            entityType: "family_member",
            record: member,
            updatedAt,
          },
        })
      );
    }

    return input;
  }

  async getFamilyContext(familyId: string): Promise<FamilyContextRecord | null> {
    const response = await mamaAiDynamoDb.send(
      new QueryCommand({
        TableName: getMamaAiTableName(),
        KeyConditionExpression: "PK = :pk",
        ExpressionAttributeValues: {
          ":pk": familyPk(familyId),
        },
      })
    );

    const familyItem = response.Items?.find((item) => item.SK === "FAMILY#PROFILE")?.record as Family | undefined;
    if (!familyItem) return null;

    const members = (response.Items ?? [])
      .filter((item) => typeof item.SK === "string" && item.SK.startsWith("MEMBER#"))
      .map((item) => item.record as FamilyMember | undefined)
      .filter((member): member is FamilyMember => Boolean(member));

    return { family: familyItem, members };
  }

  async saveMealPlan(plan: FamilyMealPlan): Promise<FamilyMealPlan> {
    const updatedAt = nowIso();
    await mamaAiDynamoDb.send(
      new PutCommand({
        TableName: getMamaAiTableName(),
        Item: {
          PK: `MEAL_PLAN#${plan.mealPlanId}`,
          SK: "MEAL_PLAN#CURRENT",
          GSI1PK: `FAMILY_MEAL_PLANS#${plan.familyId}`,
          GSI1SK: `${plan.targetDate}#${plan.updatedAt}`,
          GSI2PK: `MEAL_PLAN_DATE#${plan.targetDate}`,
          GSI2SK: plan.updatedAt,
          entityType: "meal_plan",
          record: plan,
          expiresAt: Math.floor(new Date(plan.expiresAt).getTime() / 1000),
          updatedAt,
        },
      })
    );
    return plan;
  }

  async getMealPlan(mealPlanId: string): Promise<FamilyMealPlan | undefined> {
    const response = await mamaAiDynamoDb.send(
      new GetCommand({
        TableName: getMamaAiTableName(),
        Key: {
          PK: `MEAL_PLAN#${mealPlanId}`,
          SK: "MEAL_PLAN#CURRENT",
        },
      })
    );
    return response.Item?.record as FamilyMealPlan | undefined;
  }

  createFamilyId() {
    return createId("family");
  }

  createMemberId() {
    return createId("member");
  }
}
