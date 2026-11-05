import { expect, test, type Page } from "@playwright/test";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";

test.use({ screenshot: "off", trace: "off" });
const tableName = process.env.MAMA_AI_DYNAMODB_TABLE_NAME ?? "mamaai-local-qa-browser-20261102";
const localDb = DynamoDBDocumentClient.from(new DynamoDBClient({ endpoint: "http://127.0.0.1:8010", region: "ap-south-1", credentials: { accessKeyId: "LOCALTESTONLY", secretAccessKey: "LOCALTESTONLY" } }));
const password = "LocalJourneyPassword!2026";

type BrowserRequest = { method?: string; headers?: Record<string, string>; body?: string };
async function json(page: Page, path: string, init?: BrowserRequest) {
  return page.evaluate(async ({ path, init }) => { const response = await fetch(path, init); return { status: response.status, body: await response.json().catch(() => ({})) }; }, { path, init });
}

async function register(page: Page, email: string) {
  const result = await json(page, "/api/customer/auth/register", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ fullName: "Fictional QA Family", email, password, confirmPassword: password, staySignedIn: true }) });
  expect(result.status).toBe(201);
  return result.body.userId as string;
}

async function seedFamilyPlus(userId: string) {
  const now = new Date().toISOString();
  const record = { subscriptionRecordId: `local-e2e-${userId}`, userId, plan: "family_plus", status: "active", paymentChannel: "manual", paymentStatus: "paid", expiresAt: new Date(Date.now()+86400000).toISOString(), source: "local_qa_fixture", memberLimit: 10, startsAt: now, createdAt: now, updatedAt: now };
  await localDb.send(new PutCommand({ TableName: tableName, Item: { PK: `USER#${userId}`, SK: `SUBSCRIPTION#RAZORPAY#local-e2e-${userId}`, entityType: "subscription", record, updatedAt: now } }));
}

const family = [
  { id: "father", name: "Fictional Father", relation: "father", age: 66, activityLevel: "light", foodPreference: "vegetarian", allergies: [], doctorAdvisedRestrictions: ["Tuesday fasting"], dislikes: [], mealStrategyPreference: "common", scheduleRole: "other", attendanceDays: [], tiffinPreferences: [] },
  { id: "mother", name: "Fictional Mother", relation: "mother", age: 66, activityLevel: "light", foodPreference: "vegetarian", allergies: [], doctorAdvisedRestrictions: [], dislikes: [], mealStrategyPreference: "common", scheduleRole: "other", attendanceDays: [], tiffinPreferences: [] },
  { id: "son", name: "Fictional Son", relation: "son", age: 33, activityLevel: "moderate", foodPreference: "vegetarian", allergies: [], doctorAdvisedRestrictions: [], dislikes: [], mealStrategyPreference: "common", scheduleRole: "working", attendanceDays: ["monday", "tuesday", "wednesday", "thursday", "friday"], tiffinPreferences: ["office tiffin"] },
  { id: "daughter-in-law", name: "Fictional Daughter In Law", relation: "daughter-in-law", age: 30, activityLevel: "moderate", foodPreference: "vegetarian", allergies: [], doctorAdvisedRestrictions: [], dislikes: [], mealStrategyPreference: "common", scheduleRole: "working", attendanceDays: ["monday", "tuesday", "wednesday", "thursday", "friday"], tiffinPreferences: ["paneer", "office tiffin"] },
  { id: "granddaughter", name: "Fictional Granddaughter", relation: "granddaughter", age: 3.5, activityLevel: "light", foodPreference: "vegetarian", allergies: [], doctorAdvisedRestrictions: ["child-friendly meals"], dislikes: [], mealStrategyPreference: "common", scheduleRole: "other", attendanceDays: [], tiffinPreferences: [] },
];

test("fictional Family Plus household, pets, export, and cross-account isolation persist locally", async ({ page, browser }) => {
  test.setTimeout(60_000);
  const runId = crypto.randomUUID();
  // The durable limiter is intentionally per client IP. Use distinct RFC 5737
  // documentation addresses for the two isolated-browser households so a
  // persisted local QA window from the other fixture cannot block Family B.
  await page.context().setExtraHTTPHeaders({ "x-forwarded-for": "198.51.100.201" });
  await page.goto("/account/access");
  const userA = await register(page, `journey-a-${runId}@example.test`);
  await seedFamilyPlus(userA);
  const saved = await json(page, "/api/customer/family-profile", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ customer: { name: "Fictional Father", preferredLanguage: "en", householdFoodPreference: "vegetarian", cookingHabit: "fresh_home_cooked", budgetPreference: "moderate", weeklyFoodRoutineStatus: "add", weeklyFoodRoutine: [{ day: "tuesday", preference: "fasting_vrat", note: "Father fasts", meals: { breakfast: "fasting_vrat", lunch: "fasting_vrat" } }], mealTypePreferences: { breakfast: [], lunch: ["paneer"], snacks: [], dinner: [] }, mealTimings: {}, favoriteFoodTags: ["paneer", "vegetarian"], recentMealHistory: [], nonVegPreferredFoods: [] }, members: family }) });
  expect(saved.status).toBe(200);
  expect(saved.body.familyProfile.members).toHaveLength(5);
  expect(saved.body.familyProfile.members.find((member: { id: string }) => member.id === "granddaughter").age).toBe(3.5);
  expect(saved.body.familyProfile.members.find((member: { id: string }) => member.id === "father").doctorAdvisedRestrictions).toContain("Tuesday fasting");
  expect(saved.body.familyProfile.members.find((member: { id: string }) => member.id === "daughter-in-law").tiffinPreferences).toContain("paneer");
  const reread = await json(page, "/api/customer/family-profile");
  expect(reread.status).toBe(200);
  expect(reread.body.familyProfile.members).toHaveLength(5);

  const dog = await json(page, "/api/family-plus/pets", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ name: "Fictional Dog", species: "dog", approximateAgeMonths: 24, weightKg: 14, activityLevel: "moderate", indoorOutdoor: "mixed", currentDiet: "commercial", allergies: ["chicken"], healthConditions: [], feedingSchedule: [{ label: "morning", time: "08:00" }], ownerFeedingPreferences: [], foodPreferences: [], foodDislikes: [] }) });
  expect(dog.status).toBe(201);
  const cat = await json(page, "/api/family-plus/pets", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ name: "Fictional Cat", species: "cat", approximateAgeMonths: 36, weightKg: 4, activityLevel: "low", indoorOutdoor: "indoor", currentDiet: "commercial", allergies: [], healthConditions: [], feedingSchedule: [{ label: "evening", time: "18:00" }], ownerFeedingPreferences: [], foodPreferences: [], foodDislikes: [] }) });
  expect(cat.status).toBe(201);
  expect((await json(page, "/api/family-plus/pets")).body.pets).toHaveLength(2);
  const exported = await json(page, "/api/customer/data-export");
  expect(exported.status).toBe(200);
  expect(exported.body.familyProfile.members).toHaveLength(5);
  expect(exported.body.petProfiles).toHaveLength(2);
  const deletion = await json(page, "/api/customer/account-deletion", { method: "POST" });
  expect(deletion.status).toBe(409);
  expect(deletion.body.deletion.executable).toBe(false);

  const contextB = await browser.newContext({ baseURL: "http://127.0.0.1:3103" });
  await contextB.setExtraHTTPHeaders({ "x-forwarded-for": "198.51.100.202" });
  const pageB = await contextB.newPage();
  await pageB.goto("/account/access");
  const userB = await register(pageB, `journey-b-${runId}@example.test`);
  await seedFamilyPlus(userB);
  expect((await json(pageB, "/api/customer/family-profile")).body.familyProfile).toBeFalsy();
  expect((await json(pageB, "/api/family-plus/pets")).body.pets).toHaveLength(0);
  const exportB = await json(pageB, "/api/customer/data-export");
  expect(exportB.body.petProfiles).toHaveLength(0);
  await contextB.close();
});
