import type { Family, FamilyMealPlan, FamilyMember, User } from "@/lib/shared/contracts";
import { demoFamily, demoMembers, demoUser } from "@/lib/shared/demo-data";

interface StoreState {
  users: User[];
  families: Family[];
  members: FamilyMember[];
  mealPlans: FamilyMealPlan[];
}

const globalForStore = globalThis as typeof globalThis & { mamaAiStore?: StoreState };

export const store: StoreState = globalForStore.mamaAiStore ?? {
  users: [demoUser],
  families: [demoFamily],
  members: demoMembers,
  mealPlans: []
};

globalForStore.mamaAiStore = store;

export function createId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}-${Date.now().toString(36)}`;
}

export function nowIso() {
  return new Date().toISOString();
}
