import { createId, nowIso, store, type AnalyticsEvent, type AnalyticsEventName } from "@/lib/repositories/in-memory-store";

export interface TrackAnalyticsEventInput {
  eventName: AnalyticsEventName;
  visitorId: string;
  sessionId: string;
  pagePath: string;
  referrer?: string;
  source?: string;
  category?: string;
  label?: string;
  deviceCategory: AnalyticsEvent["deviceCategory"];
  country?: string;
  region?: string;
}

function dateKey(value: string) {
  return value.slice(0, 10);
}

function isWithinDays(value: string, days: number) {
  const createdAt = new Date(value).getTime();
  const start = Date.now() - days * 24 * 60 * 60 * 1000;
  return createdAt >= start;
}

function countUnique(events: AnalyticsEvent[], field: "visitorId" | "sessionId") {
  return new Set(events.map((event) => event[field])).size;
}

function groupCount(events: AnalyticsEvent[], pickKey: (event: AnalyticsEvent) => string) {
  return events.reduce<Record<string, number>>((acc, event) => {
    const key = pickKey(event) || "Unknown";
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});
}

function topEntries(record: Record<string, number>, limit = 8) {
  return Object.entries(record)
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, limit);
}

function rupees(value: number) {
  return Math.round(value * 100) / 100;
}

function unitEconomicsSnapshot(input: {
  activeAiUsers: number;
  mealPlans: number;
  replacements: number;
  askQuestions: number;
  recipeVideos: number;
}) {
  const activeFamilies = Math.max(1, input.activeAiUsers);
  const usageMultiplier = Math.max(
    1,
    (input.mealPlans * 1.2 + input.replacements * 0.7 + input.askQuestions * 0.35 + input.recipeVideos * 0.1) /
      activeFamilies
  );
  const estimatedAiCostPerFamily = rupees(Math.min(95, 9 + usageMultiplier * 3.5));
  const estimatedAwsCostPerFamily = rupees(10 + usageMultiplier * 1.6);
  const estimatedVercelAnalyticsCostPerFamily = rupees(8 + usageMultiplier * 0.9);
  const estimatedTotalBeforePayment = rupees(
    estimatedAiCostPerFamily + estimatedAwsCostPerFamily + estimatedVercelAnalyticsCostPerFamily
  );
  const plans = [
    { plan: "Family Starter", currentPriceInr: 399, suggestedAfterSept: 449 },
    { plan: "Family Premium", currentPriceInr: 599, suggestedAfterSept: 699 },
    { plan: "Family Plus", currentPriceInr: 999, suggestedAfterSept: 1199 },
  ].map((plan) => {
    const paymentFees = rupees(plan.currentPriceInr * 0.025);
    const totalCost = rupees(estimatedTotalBeforePayment + paymentFees);
    const marginPercent = rupees(((plan.currentPriceInr - totalCost) / plan.currentPriceInr) * 100);
    return {
      ...plan,
      estimatedAiCostPerFamily,
      estimatedAwsCostPerFamily,
      estimatedVercelAnalyticsCostPerFamily,
      estimatedPaymentFees: paymentFees,
      estimatedTotalTechAndPaymentCost: totalCost,
      estimatedMarginPercent: marginPercent,
      marginStatus: marginPercent >= 50 ? "PASS" : "WATCH",
    };
  });

  return {
    activeAiUsers: input.activeAiUsers,
    measuredEvents: {
      mealPlans: input.mealPlans,
      replacements: input.replacements,
      askQuestions: input.askQuestions,
      recipeVideos: input.recipeVideos,
    },
    assumptions:
      "Early-stage estimate from tracked app events. Replace with provider billing exports once Gemini, AWS, Vercel and Razorpay invoices accumulate.",
    currentPricesLockedUntil: "2026-09-15",
    promptCostControls:
      "Use compact family context, deterministic repetition/pantry/grocery/routine logic, cached recipe-video mappings, and regenerate only affected dishes.",
    plans,
    scenarios: [
      {
        scenario: "A - Current Price Sustainable",
        rule: "Keep prices if measured total recurring cost remains under 35% of Starter revenue and user satisfaction is strong.",
      },
      {
        scenario: "B - Minor Increase",
        rule: "After 15 September 2026, consider Starter 449, Premium 699, Plus 1199 if heavy Ask MAMA and meal generation push costs above the watch line.",
      },
      {
        scenario: "C - Higher Usage Case",
        rule: "If power users materially exceed fair use, keep base prices stable and add plan-level fair-use controls before a larger price revision.",
      },
    ],
  };
}

export class AnalyticsService {
  track(input: TrackAnalyticsEventInput) {
    const isDuplicateVisit = store.analyticsEvents.some(
      (event) =>
        event.eventName === "homepage_visit" &&
        event.sessionId === input.sessionId &&
        event.pagePath === input.pagePath
    );

    if (input.eventName === "homepage_visit" && isDuplicateVisit) {
      return { saved: false, reason: "Session page visit already counted." };
    }

    store.analyticsEvents.push({
      eventId: createId("analytics"),
      createdAt: nowIso(),
      ...input
    });

    return { saved: true };
  }

  summary() {
    const events = store.analyticsEvents;
    const pageViews = events.filter((event) => event.eventName === "homepage_visit");
    const today = new Date().toISOString().slice(0, 10);
    const todayPageViews = pageViews.filter((event) => dateKey(event.createdAt) === today);
    const last7PageViews = pageViews.filter((event) => isWithinDays(event.createdAt, 7));
    const last30PageViews = pageViews.filter((event) => isWithinDays(event.createdAt, 30));
    const eventCounts = groupCount(events, (event) => event.eventName);
    const askMamaQuestionEvents = events.filter((event) => event.eventName === "ask_mama_question");
    const aiUsageEvents = events.filter((event) =>
      ["meal_plan_generated", "meal_replaced", "recipe_video_requested", "ask_mama_question"].includes(event.eventName)
    );
    const activeAiUsers = countUnique(aiUsageEvents, "visitorId");

    const dailyVisitorTrend = topEntries(groupCount(pageViews, (event) => dateKey(event.createdAt)), 30).sort((a, b) =>
      a.label.localeCompare(b.label)
    );

    return {
      generatedAt: nowIso(),
      cards: {
        todaysVisitors: countUnique(todayPageViews, "visitorId"),
        last7Days: countUnique(last7PageViews, "visitorId"),
        last30Days: countUnique(last30PageViews, "visitorId"),
        totalVisits: countUnique(pageViews, "sessionId")
      },
      definitions: {
        pageViews: "A page view is a recorded page visit event.",
        visits: "A visit is an anonymous browser session, counted once per page per session.",
        uniqueVisitors: "A unique visitor is an anonymous locally generated visitor id. It is an estimate, not a person-level identity."
      },
      eventCounts: {
        homepageVisits: eventCounts.homepage_visit ?? 0,
        tryDemoClicks: eventCounts.try_demo_click ?? 0,
        getStartedClicks: eventCounts.get_started_click ?? 0,
        registrations: eventCounts.registration_success ?? eventCounts.create_family_success ?? 0,
        mealPlansGenerated: eventCounts.meal_plan_generated ?? 0,
        mealReplacements: eventCounts.meal_replaced ?? 0,
        recipeVideoRequests: eventCounts.recipe_video_requested ?? 0,
        pwaInstallPrompts: eventCounts.pwa_install_prompt ?? 0,
        askMamaConversations: eventCounts.ask_mama_open ?? 0,
        askMamaQuestions: eventCounts.ask_mama_question ?? 0,
        askMamaUnresolved: eventCounts.ask_mama_unresolved ?? 0
      },
      charts: {
        dailyVisitorTrend,
        mostVisitedPages: topEntries(groupCount(pageViews, (event) => event.pagePath)),
        trafficSources: topEntries(groupCount(pageViews, (event) => event.source ?? "Direct")),
        deviceBreakdown: topEntries(groupCount(pageViews, (event) => event.deviceCategory)),
        conversionFunnel: [
          { label: "Visitors", value: countUnique(pageViews, "visitorId") },
          { label: "Try Demo", value: eventCounts.try_demo_click ?? 0 },
          { label: "Registration/Create Family", value: eventCounts.create_family_success ?? 0 },
          { label: "Meal Plans", value: eventCounts.meal_plan_generated ?? 0 }
        ],
        askMamaCategories: topEntries(groupCount(askMamaQuestionEvents, (event) => event.category ?? "Unknown"))
      },
      aiUsage: {
        totalTrackedAiApiEvents: aiUsageEvents.length,
        byPlanOrCategory: topEntries(groupCount(aiUsageEvents, (event) => event.category ?? "Unknown")),
        expensiveOperationMix: topEntries(groupCount(aiUsageEvents, (event) => event.eventName)),
        fairUseNote:
          "Use this testing-stage view to compare real usage against plan limits before enforcing production throttles."
      },
      costMonitoring: unitEconomicsSnapshot({
        activeAiUsers,
        mealPlans: eventCounts.meal_plan_generated ?? 0,
        replacements: eventCounts.meal_replaced ?? 0,
        askQuestions: eventCounts.ask_mama_question ?? 0,
        recipeVideos: eventCounts.recipe_video_requested ?? 0,
      }),
      privacy: "No raw IP address is stored. Visitor/session ids are anonymous local browser ids for testing analytics."
    };
  }
}
