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
      privacy: "No raw IP address is stored. Visitor/session ids are anonymous local browser ids for testing analytics."
    };
  }
}
