import { expect, test, type Page } from "@playwright/test";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";

const tableName = process.env.MAMA_AI_DYNAMODB_TABLE_NAME ?? "mamaai-local-qa-browser-20261102";
const db = DynamoDBDocumentClient.from(new DynamoDBClient({ endpoint: "http://127.0.0.1:8010", region: "ap-south-1", credentials: { accessKeyId: "LOCALTESTONLY", secretAccessKey: "LOCALTESTONLY" } }));
const password = "WeeklyMixedDietPassword!2026";
type BrowserRequest = { method?: string; headers?: Record<string, string>; body?: string };
async function call(page: Page, path: string, init?: BrowserRequest) {
  const origin = "http://127.0.0.1:3103";
  const response = await page.request.fetch(path, {
    method: init?.method ?? "GET",
    headers: { origin, ...init?.headers },
    data: init?.body,
  });
  return { status: response.status(), body: await response.json().catch(() => ({})) };
}
async function register(page: Page, email: string) { const result = await call(page, "/api/customer/auth/register", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ fullName: "Weekly QA Household", email, password, confirmPassword: password, staySignedIn: true }) }); expect(result.status).toBe(201); return result.body.userId as string; }
async function familyPlus(userId: string) { const now = new Date().toISOString(); await db.send(new PutCommand({ TableName: tableName, Item: { PK: `USER#${userId}`, SK: `SUBSCRIPTION#RAZORPAY#weekly-${userId}`, entityType: "subscription", updatedAt: now, record: { subscriptionRecordId: `weekly-${userId}`, userId, plan: "family_plus", status: "active", paymentChannel: "manual", paymentStatus: "paid", expiresAt: new Date(Date.now()+86400000).toISOString(), source: "local_qa_fixture", memberLimit: 10, startsAt: now, createdAt: now, updatedAt: now } } })); }

test("weekly mixed-diet plan is persisted, owner-scoped, version-safe, and refreshes groceries", async ({ page, browser }) => {
  test.setTimeout(180_000);
  const runId = crypto.randomUUID();
  await page.context().setExtraHTTPHeaders({ "x-forwarded-for": `198.51.100.${parseInt(runId.slice(0, 2), 16) % 250 + 1}` });
  await page.goto("/disclaimer");
  const userId = await register(page, `weekly-mixed-${runId}@example.test`);
  await familyPlus(userId);
  const members = [
    { id: "father", name: "Father", relation: "father", age: 66, foodPreference: "vegetarian", dietaryPermissions: { eggs: false, fish: false, poultry: false }, weekdayDietRules: [{ day: "tuesday", fasting: true, exclude: ["grains"] }], allergies: [], doctorAdvisedRestrictions: [], dislikes: [], mealStrategyPreference: "common" },
    { id: "mother", name: "Mother", relation: "mother", age: 66, foodPreference: "jain", dietaryPermissions: { onion: false, garlic: false, rootVegetables: false }, weekdayDietRules: [], festivalDietRules: [{ name: "QA festival", confirmedByCustomer: true, from: "2026-11-02", to: "2026-11-08", exclude: ["onion", "garlic"] }], allergies: [], doctorAdvisedRestrictions: [], dislikes: [], mealStrategyPreference: "allow_separate" },
    { id: "son", name: "Son", relation: "son", age: 33, foodPreference: "non_vegetarian", nonVegAvoidDays: ["tuesday", "thursday"], dietaryPermissions: { fish: true, poultry: true }, weekdayDietRules: [], allergies: [], doctorAdvisedRestrictions: [], dislikes: [], mealStrategyPreference: "allow_separate" },
    { id: "daughter", name: "Daughter", relation: "daughter-in-law", age: 30, foodPreference: "eggetarian", dietaryPermissions: { eggs: true, poultry: false, fish: false }, weekdayDietRules: [], allergies: [], doctorAdvisedRestrictions: [], dislikes: [], mealStrategyPreference: "allow_separate", tiffinPreferences: ["paneer"] },
    { id: "child", name: "Child", relation: "child", age: 3, foodPreference: "vegetarian", dietaryPermissions: { eggs: false, fish: false, poultry: false }, weekdayDietRules: [], allergies: [], doctorAdvisedRestrictions: [], dislikes: [], mealStrategyPreference: "common" },
  ];
  const profile = await call(page, "/api/customer/family-profile", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ customer: { name: "Father", preferredLanguage: "en", householdFoodPreference: "mixed", cookingHabit: "fresh_home_cooked", budgetPreference: "moderate", weeklyFoodRoutineStatus: "skip", weeklyFoodRoutine: [], mealTypePreferences: { breakfast: [], lunch: ["paneer"], snacks: [], dinner: [] }, mealTimings: {}, favoriteFoodTags: ["paneer"], recentMealHistory: [], nonVegPreferredFoods: ["fish", "chicken"] }, members }) });
  expect(profile.status).toBe(200); const familyId = profile.body.familyProfile.familyId as string;
  const request = { familyId, planType: "weekly", targetDate: "2026-11-02", preferredLanguage: "en", customMealTimings: { breakfast: "08:00", lunch: "13:00", snacks: "17:00", dinner: "20:00" }, mealSchedule: { reminderLeadTimeMinutes: 45, weekday: {}, useSeparateWeekendSchedule: false } };
  const created = await call(page, "/api/weekly-meal-plans", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(request) });
  expect(created.status, JSON.stringify(created.body.error)).toBe(200);
  expect(created.status).toBe(200); expect(created.body.weeklyPlan.weekPlanId).toBeTruthy(); expect(created.body.weeklyPlan.days).toHaveLength(7);
  const loaded = await call(page, `/api/weekly-meal-plans?familyId=${encodeURIComponent(familyId)}&targetDate=2026-11-02`);
  expect(loaded.status).toBe(200); expect(loaded.body.weeklyPlan.weekPlanId).toBe(created.body.weeklyPlan.weekPlanId);
  const days = loaded.body.weeklyPlan.days as Array<{ meals: Array<{ selectedOption: { commonMeal: { components?: Array<{ memberIds: string[] }> } } }> }>;
  for (const slot of days.flatMap((day) => day.meals)) for (const component of slot.selectedOption.commonMeal.components ?? []) expect(component.memberIds.length).toBeGreaterThan(0);
  const refreshedList = await call(page, "/api/weekly-shopping-list", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ weekStartDate: loaded.body.weeklyPlan.weekStartDate, action: "refresh" }) });
  expect(refreshedList.status).toBe(200);
  expect(refreshedList.body.list.items.length).toBeGreaterThan(0);
  const groceryBefore = refreshedList.body.list.items.map((item: { name: string; quantityToPurchase: string }) => `${item.name}|${item.quantityToPurchase}`).sort();
  const readList = await call(page, `/api/weekly-shopping-list?weekStartDate=${encodeURIComponent(loaded.body.weeklyPlan.weekStartDate)}`);
  expect(readList.status).toBe(200);
  expect(readList.body.list.items).toEqual(refreshedList.body.list.items);
  const target = loaded.body.weeklyPlan.days[0].meals[0];
  const marked = readList.body.list.items.slice(0, 8);
  for (const item of marked) expect((await call(page, "/api/weekly-shopping-list", {method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({weekStartDate:loaded.body.weeklyPlan.weekStartDate,action:"update_item",itemId:item.itemId,purchased:true})})).status).toBe(200);
  const invalid = await call(page, "/api/weekly-meal-plans", {method:"PATCH",headers:{"content-type":"application/json"},body:JSON.stringify({familyId,weekStartDate:loaded.body.weeklyPlan.weekStartDate,slotId:"missing",selectedMealPlan:target.selectedOption,expectedPlanVersion:loaded.body.weeklyPlan.planVersion})});
  expect(invalid.status).toBe(400);
  expect((await call(page,`/api/weekly-meal-plans?familyId=${familyId}&targetDate=2026-11-02`)).body.weeklyPlan).toEqual(loaded.body.weeklyPlan);
  const replacement = await call(page, "/api/meal-plan", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ familyId, planType: "weekly", mealTime: target.mealTime, targetDate: target.date, preferredLanguage: "en", excludeDishes: [target.selectedMealName] }) });
  expect(replacement.status, JSON.stringify(replacement.body.error)).toBe(200);
  expect(replacement.body.mealPlan.commonMeal.name).not.toBe(target.selectedMealName);
  const patchBody = { familyId, weekStartDate: loaded.body.weeklyPlan.weekStartDate, slotId: target.slotId, selectedMealPlan: replacement.body.mealPlan, reason: "ate_recently", expectedPlanVersion: loaded.body.weeklyPlan.planVersion };
  const [firstPatch, secondPatch] = await Promise.all([call(page, "/api/weekly-meal-plans", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(patchBody) }), call(page, "/api/weekly-meal-plans", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(patchBody) })]);
  const patched = firstPatch.status === 200 ? firstPatch : secondPatch;
  const stale = firstPatch.status === 409 ? firstPatch : secondPatch;
  expect([firstPatch.status, secondPatch.status].sort()).toEqual([200, 409]);
  expect(stale.body.error.code).toBe("STALE_PLAN");
  expect(patched.body.weeklyPlan.planVersion).toBe(loaded.body.weeklyPlan.planVersion + 1);
  const otherSlots = (plan: typeof loaded.body.weeklyPlan) => plan.days.flatMap((day: any) => day.meals).filter((slot: any) => slot.slotId !== target.slotId);
  expect(otherSlots(patched.body.weeklyPlan)).toEqual(otherSlots(loaded.body.weeklyPlan));
  const replacedSlot = patched.body.weeklyPlan.days[0].meals[0];
  expect(replacedSlot.date).toBe(target.date);
  expect(replacedSlot.mealTime).toBe(target.mealTime);
  expect(replacedSlot.selectedMealName).toBe(replacement.body.mealPlan.commonMeal.name);
  const reread = await call(page, `/api/weekly-meal-plans?familyId=${encodeURIComponent(familyId)}&targetDate=2026-11-02`);
  expect(reread.status).toBe(200);
  expect(reread.body.weeklyPlan.planVersion).toBe(patched.body.weeklyPlan.planVersion);
  const refreshedAfterPatch = await call(page, "/api/weekly-shopping-list", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ weekStartDate: reread.body.weeklyPlan.weekStartDate, action: "refresh" }) });
  expect(refreshedAfterPatch.status).toBe(200);
  const groceryAfter = refreshedAfterPatch.body.list.items.map((item: { name: string; quantityToPurchase: string }) => `${item.name}|${item.quantityToPurchase}`).sort();
  expect(groceryAfter).not.toEqual(groceryBefore);
  expect(new Set(groceryAfter).size).toBe(groceryAfter.length);
  const retained = refreshedAfterPatch.body.list.items.filter((item: any) => marked.some((prior: any) => prior.itemId === item.itemId));
  expect(retained.length).toBeGreaterThan(0);
  expect(retained.every((item: any) => item.purchased)).toBe(true);
  expect((await call(page, "/api/customer/logout", {method:"POST"})).status).toBe(200);
  expect((await call(page, "/api/customer/auth/login", {method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({identifier:`weekly-mixed-${runId}@example.test`,password})})).status).toBe(200);
  expect((await call(page, `/api/weekly-meal-plans?familyId=${familyId}&targetDate=2026-11-02`)).body.weeklyPlan).toEqual(reread.body.weeklyPlan);
  expect((await call(page, `/api/weekly-shopping-list?weekStartDate=${encodeURIComponent(reread.body.weeklyPlan.weekStartDate)}`)).body.list.items).toEqual(refreshedAfterPatch.body.list.items);

  await page.clock.setFixedTime(new Date("2026-11-04T12:00:00"));
  await page.goto("/planner");
  await page.getByRole("button", { name: "This Week", exact: true }).click({ timeout: 30_000 });
  const day = page.locator("details").filter({ has: page.locator("summary").filter({ hasText: target.date }) });
  await day.locator("summary").click();
  const savedDish = replacement.body.mealPlan.commonMeal.name as string;
  const breakfast = day.getByRole("button", { name: /^Breakfast /i });
  await expect(breakfast.getByText(savedDish, { exact: true })).toBeVisible();
  await breakfast.click();
  await expect(page.getByRole("heading", { name: savedDish, exact: true })).toBeVisible();
  await page.goto("/shopping-list");
  await expect(page.getByRole("heading", { name: "Weekly shopping list" })).toBeVisible();
  const checked = retained[0];
  await expect(page.getByRole("checkbox", { name: `${checked.name} — ${checked.quantityToPurchase}`, exact: true })).toBeChecked();

  const contextB = await browser.newContext({ baseURL: "http://127.0.0.1:3103", extraHTTPHeaders: { "x-forwarded-for": `203.0.113.${parseInt(runId.slice(0, 2), 16) % 250 + 1}` } });
  const pageB = await contextB.newPage();
  await pageB.goto("/disclaimer");
  const userB = await register(pageB, `weekly-private-${runId}@example.test`);
  await familyPlus(userB);
  expect((await call(pageB, `/api/weekly-meal-plans?familyId=${encodeURIComponent(familyId)}&targetDate=2026-11-02`)).status).toBe(403);
  expect((await call(pageB, `/api/weekly-shopping-list?weekStartDate=${encodeURIComponent(reread.body.weeklyPlan.weekStartDate)}`)).status).toBe(404);
  const deniedGenerate = await call(pageB, "/api/weekly-meal-plans", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(request) });
  expect(deniedGenerate.status).toBe(403);
  const deniedPatch = await call(pageB, "/api/weekly-meal-plans", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...patchBody, expectedPlanVersion: reread.body.weeklyPlan.planVersion }) });
  expect(deniedPatch.status).toBe(403);
  expect((await call(page, `/api/weekly-meal-plans?familyId=${encodeURIComponent(familyId)}&targetDate=2026-11-02`)).body.weeklyPlan.planVersion).toBe(reread.body.weeklyPlan.planVersion);
  await contextB.close();
});
