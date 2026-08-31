import { DeleteCommand, GetCommand, PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { createId } from "./in-memory-store";
import { getMamaAiTableName, mamaAiDynamoDb } from "./dynamodb-client";
import type { Family, FamilyMealPlan, FamilyMember, WeeklyFamilyMealPlan } from "@/lib/shared/contracts";

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

function dedupeFamilyMembers(members: FamilyMember[]) {
  const seenMemberIds = new Set<string>();
  const seenProfiles = new Set<string>();
  return members.filter((member) => {
    const profileKey = [
      member.name?.trim().toLowerCase(),
      member.relationship?.trim().toLowerCase(),
      member.age,
      member.dietType,
    ].join("#");
    if (member.memberId && seenMemberIds.has(member.memberId)) return false;
    if (seenProfiles.has(profileKey)) return false;
    if (member.memberId) seenMemberIds.add(member.memberId);
    seenProfiles.add(profileKey);
    return true;
  });
}

export class FamilyMealRepository {
  async saveFamilyContext(input: FamilyContextRecord): Promise<FamilyContextRecord> {
    const tableName = getMamaAiTableName();
    const updatedAt = nowIso();
    const members = dedupeFamilyMembers(input.members);

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

    const existing = await mamaAiDynamoDb.send(
      new QueryCommand({
        TableName: tableName,
        KeyConditionExpression: "PK = :pk",
        ExpressionAttributeValues: {
          ":pk": familyPk(input.family.familyId),
        },
      })
    );

    await Promise.all(
      (existing.Items ?? [])
        .filter((item) => typeof item.SK === "string" && item.SK.startsWith("MEMBER#"))
        .map((item) =>
          mamaAiDynamoDb.send(
            new DeleteCommand({
              TableName: tableName,
              Key: {
                PK: familyPk(input.family.familyId),
                SK: item.SK,
              },
            })
          )
        )
    );

    for (const member of members) {
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

    return { ...input, members };
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

    const members = dedupeFamilyMembers((response.Items ?? [])
      .filter((item) => typeof item.SK === "string" && item.SK.startsWith("MEMBER#"))
      .map((item) => item.record as FamilyMember | undefined)
      .filter((member): member is FamilyMember => Boolean(member)));

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

  async saveWeeklyMealPlan(plan: WeeklyFamilyMealPlan): Promise<WeeklyFamilyMealPlan> {
    const updatedAt = nowIso();
    await mamaAiDynamoDb.send(
      new PutCommand({
        TableName: getMamaAiTableName(),
        Item: {
          PK: familyPk(plan.familyId),
          SK: `WEEKLY_PLAN#${plan.weekStartDate}`,
          GSI1PK: `FAMILY_WEEKLY_PLANS#${plan.familyId}`,
          GSI1SK: `${plan.weekStartDate}#${plan.planVersion}`,
          GSI2PK: `WEEKLY_PLAN_DATE#${plan.weekStartDate}`,
          GSI2SK: updatedAt,
          entityType: "weekly_meal_plan",
          record: plan,
          updatedAt,
        },
      })
    );
    return plan;
  }

  async getWeeklyMealPlan(familyId: string, weekStartDate: string): Promise<WeeklyFamilyMealPlan | undefined> {
    const response = await mamaAiDynamoDb.send(
      new GetCommand({
        TableName: getMamaAiTableName(),
        Key: {
          PK: familyPk(familyId),
          SK: `WEEKLY_PLAN#${weekStartDate}`,
        },
      })
    );
    return response.Item?.record as WeeklyFamilyMealPlan | undefined;
  }

  async tryBeginWeeklyMealPlanGeneration(familyId: string, weekStartDate: string): Promise<boolean> {
    try {
      await mamaAiDynamoDb.send(
        new PutCommand({
          TableName: getMamaAiTableName(),
          Item: {
            PK: familyPk(familyId),
            SK: `WEEKLY_PLAN_LOCK#${weekStartDate}`,
            entityType: "weekly_meal_plan_generation_lock",
            createdAt: nowIso(),
            expiresAt: Math.floor(Date.now() / 1000) + 15 * 60,
          },
          ConditionExpression: "attribute_not_exists(PK)",
        })
      );
      return true;
    } catch (error) {
      if ((error as { name?: string }).name === "ConditionalCheckFailedException") return false;
      throw error;
    }
  }

  async endWeeklyMealPlanGeneration(familyId: string, weekStartDate: string): Promise<void> {
    await mamaAiDynamoDb.send(
      new DeleteCommand({
        TableName: getMamaAiTableName(),
        Key: {
          PK: familyPk(familyId),
          SK: `WEEKLY_PLAN_LOCK#${weekStartDate}`,
        },
      })
    );
  }

  createFamilyId() {
    return createId("family");
  }

  createMemberId() {
    return createId("member");
  }
}
