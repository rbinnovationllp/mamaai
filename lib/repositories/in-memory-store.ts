import type { Family, FamilyMealPlan, FamilyMember, User } from "@/lib/shared/contracts";
import { demoFamily, demoMembers, demoUser } from "@/lib/shared/demo-data";

export type AnalyticsEventName =
  | "homepage_visit"
  | "try_demo_click"
  | "get_started_click"
  | "create_family_success"
  | "meal_plan_generated"
  | "meal_replaced"
  | "recipe_video_requested"
  | "registration_success"
  | "pwa_install_prompt"
  | "ask_mama_open"
  | "ask_mama_question"
  | "ask_mama_unresolved";

export interface AnalyticsEvent {
  eventId: string;
  eventName: AnalyticsEventName;
  visitorId: string;
  sessionId: string;
  pagePath: string;
  referrer?: string;
  source?: string;
  category?: string;
  label?: string;
  deviceCategory: "mobile" | "desktop" | "tablet" | "unknown";
  country?: string;
  region?: string;
  createdAt: string;
}

interface StoreState {
  users: User[];
  families: Family[];
  members: FamilyMember[];
  mealPlans: FamilyMealPlan[];
  analyticsEvents: AnalyticsEvent[];
}

const globalForStore = globalThis as typeof globalThis & { mamaAiStore?: StoreState };

export const store: StoreState = globalForStore.mamaAiStore ?? {
  users: [demoUser],
  families: [demoFamily],
  members: demoMembers,
  mealPlans: [],
  analyticsEvents: []
};

globalForStore.mamaAiStore = store;

export function createId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}-${Date.now().toString(36)}`;
}

export function nowIso() {
  return new Date().toISOString();
}
