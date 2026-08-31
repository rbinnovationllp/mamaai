import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { docClient, TABLE_NAMES } from '@/lib/repositories/dynamo';
import { GetCommand } from '@aws-sdk/lib-dynamodb';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getSession();
    if (!session || !session.userId) {
      return NextResponse.json({ authenticated: false, nextRoute: '/profile/family' });
    }

    const userId = session.userId;

    // 1. Fetch User Record
    const userRes = await docClient.send(
      new GetCommand({
        TableName: TABLE_NAMES.USERS,
        Key: { userId },
      })
    );
    const user = userRes.Item;

    // Check Subscription / Trial Entitlement
    const isPaid = user?.subscriptionStatus === 'active';
    const isTrialActive = user?.trialEndsAt && new Date(user?.trialEndsAt) > new Date();
    const isJudge =
      session.role === 'admin' ||
      (session as any)?.role === 'judge' ||
      (session as any)?.entitlement === 'judge' ||
      (session as any)?.entitlement === 'active' ||
      user?.isJudgeDemo === true ||
      user?.role === 'judge';
    const isEntitled = isPaid || isTrialActive || isJudge;

    // 2. Fetch Family Profile Record
    const familyId = user?.familyId || `fam_${userId}`;
    const familyRes = await docClient.send(
      new GetCommand({
        TableName: TABLE_NAMES.FAMILIES,
        Key: { familyId },
      })
    );
    const family = familyRes.Item;

    // Determine Profile Completeness
    const hasMembers = Array.isArray(family?.members) && family.members.length > 0;
    const allMembersHaveAge = hasMembers && family.members.every((m: any) => typeof m.age === 'number' && m.age > 0);
    const isProfileComplete = hasMembers && allMembersHaveAge;

    if (!isProfileComplete) {
      return NextResponse.json({
        authenticated: true,
        isProfileComplete: false,
        nextRoute: '/profile/family',
      });
    }

    if (!isEntitled) {
      return NextResponse.json({
        authenticated: true,
        isProfileComplete: true,
        isEntitled: false,
        nextRoute: '/subscription',
      });
    }

    // 3. Check for Existing Active Weekly Plan
    const currentWeekStart = '2026-08-31'; // Monday of the active cycle
    const planId = `${familyId}_${currentWeekStart}`;

    const planRes = await docClient.send(
      new GetCommand({
        TableName: TABLE_NAMES.MEAL_PLANS,
        Key: { planId },
      })
    );
    const hasActiveWeeklyPlan = Boolean(planRes.Item && planRes.Item.days?.length === 7);

    return NextResponse.json({
      authenticated: true,
      userId,
      familyId,
      isProfileComplete: true,
      isEntitled: true,
      hasActiveWeeklyPlan,
      nextRoute: hasActiveWeeklyPlan ? '/planner?view=week' : '/planner?autoGenerate=true',
      familyProfile: family,
    });
  } catch (error: any) {
    console.error('[Session Check Error]:', error);
    return NextResponse.json({ authenticated: false, nextRoute: '/profile/family' });
  }
}