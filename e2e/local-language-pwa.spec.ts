import { expect, test, type BrowserContext } from "@playwright/test";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";

const origin = "http://127.0.0.1:3103";
const table = process.env.MAMA_AI_DYNAMODB_TABLE_NAME;
const db = DynamoDBDocumentClient.from(new DynamoDBClient({
  endpoint: "http://127.0.0.1:8010", region: "ap-south-1",
  credentials: { accessKeyId: "LOCALTESTONLY", secretAccessKey: "LOCALTESTONLY" },
}));
const password = "FictionalLanguageQA!2026";

async function call(context: BrowserContext, path: string, data?: object, method = data ? "POST" : "GET") {
  const response = await context.request.fetch(origin + path, { method, data, headers: { origin } });
  return { status: response.status(), body: await response.json() };
}

async function register(context: BrowserContext, email: string) {
  if (!table?.startsWith("mamaai-local-qa-")) throw new Error("Use a dedicated loopback QA table.");
  const result = await call(context, "/api/customer/auth/register", {
    fullName: "Fictional Language QA", email, password, confirmPassword: password, staySignedIn: true,
  });
  expect(result.status).toBe(201);
  const userId = result.body.userId;
  const now = new Date().toISOString();
  await db.send(new PutCommand({ TableName: table, Item: {
    PK: `USER#${userId}`, SK: `SUBSCRIPTION#RAZORPAY#qa-${userId}`, entityType: "subscription", updatedAt: now,
    record: { subscriptionRecordId: `qa-${userId}`, userId, plan: "family_plus", status: "active", paymentChannel: "manual", paymentStatus: "paid", memberLimit: 10, startsAt: now, createdAt: now, updatedAt: now, expiresAt: new Date(Date.now() + 86400000).toISOString(), source: "local_qa_fixture" },
  } }));
}

const questions = [
  "Create a meal plan for my family",
  "Suggest a meal for my three-year-old child",
  "Suggest a meal for my elderly father",
  "What vegetarian protein can we eat?",
  "Suggest a meal for my Tuesday fast",
  "What can I pack for my office tiffin?",
  "What can I cook with rice, lentils and spinach?",
];

for (const language of ["en", "hi", "kn"] as const) {
  test(`fictional household and pet journey in ${language}`, async ({ page, context, browser }) => {
    test.setTimeout(150_000);
    const id = crypto.randomUUID();
    const subnet = 1 + parseInt(id.slice(0, 2), 16) % 250;
    await context.setExtraHTTPHeaders({ "x-forwarded-for": `192.0.2.${subnet}` });
    const email = `phase-${id}@example.test`;
    await register(context, email);
    const profile = await call(context, "/api/customer/family-profile", {
      customer: { name: "Fictional QA", preferredLanguage: language, householdFoodPreference: "vegetarian", cookingHabit: "fresh_home_cooked", budgetPreference: "moderate", weeklyFoodRoutineStatus: "skip", weeklyFoodRoutine: [], mealTypePreferences: { breakfast: [], lunch: [], snacks: [], dinner: [] }, mealTimings: {}, favoriteFoodTags: [], recentMealHistory: [], nonVegPreferredFoods: [] },
      members: [{ id: "adult", name: "Fictional Adult", relation: "father", age: 66, foodPreference: "vegetarian", allergies: ["peanut"], doctorAdvisedRestrictions: [], dislikes: [] }, { id: "child", name: "Fictional Child", relation: "child", age: 3.5, foodPreference: "vegetarian", allergies: [], doctorAdvisedRestrictions: [], dislikes: [] }],
    });
    expect(profile.status).toBe(200);
    const familyId = profile.body.familyProfile.familyId;
    const plan = await call(context, "/api/weekly-meal-plans", { familyId, planType: "weekly", targetDate: "2026-11-02", preferredLanguage: language });
    expect(plan.status).toBe(200);
    expect(plan.body.weeklyPlan.days).toHaveLength(7);
    const list = await call(context, "/api/weekly-shopping-list", { weekStartDate: "2026-11-02", action: "refresh" });
    expect(list.status).toBe(200);
    expect(list.body.list.items.length).toBeGreaterThan(0);
    const pet = { approximateAgeMonths: 24, weightKg: 8, activityLevel: "moderate", indoorOutdoor: "mixed", currentDiet: "commercial", allergies: [], healthConditions: [], feedingSchedule: [], ownerFeedingPreferences: [], foodPreferences: [], foodDislikes: [] };
    const dog = await call(context, "/api/family-plus/pets", { ...pet, name: "Fictional Dog", species: "dog", allergies: ["chicken"] });
    const cat = await call(context, "/api/family-plus/pets", { ...pet, name: "Fictional Cat", species: "cat", healthConditions: ["Veterinary review required"] });
    expect([dog.status, cat.status]).toEqual([201, 201]);
    const dogPath = `/api/family-plus/pets/${dog.body.pet.petId}`;
    expect((await call(context, dogPath, { ...pet, name: "Edited Fictional Dog", species: "dog", allergies: ["chicken"] }, "PUT")).status).toBe(200);
    const guidance = await call(context, `/api/family-plus/pet-meal-plan?language=${language}`);
    expect(guidance.status).toBe(200);
    expect(guidance.body.plans.find((entry: { species: string }) => entry.species === "cat").needsVeterinaryReview).toBe(true);
    const dogGuidance = guidance.body.plans.find((entry: { species: string }) => entry.species === "dog");
    expect(dogGuidance.petName).toBe("Edited Fictional Dog");
    expect(dogGuidance.safetyNotes.join(" ")).toContain("chicken");
    if (language !== "en") expect(dogGuidance.recommendation).toMatch(language === "hi" ? /[\u0900-\u097f]/ : /[\u0c80-\u0cff]/);
    const other = await browser.newContext({ extraHTTPHeaders: { "x-forwarded-for": `203.0.113.${subnet}` } });
    try {
      await register(other, `other-${id}@example.test`);
      expect((await call(other, dogPath)).status).toBe(404);
      expect((await call(other, dogPath, { ...pet, name: "Forbidden", species: "dog" }, "PUT")).status).toBe(404);
    } finally { await other.close(); }
    const productHelp = await call(context, "/api/ask-mama", { question: "How does MAMAAI work?", responseLanguage: language });
    expect(productHelp.status).toBe(200);
    expect(productHelp.body.responseLanguage).toBe(language);
    const statuses: number[] = [];
    for (const question of questions) {
      const answer = await call(context, "/api/ask-mama", { question, responseLanguage: language });
      statuses.push(answer.status);
      if (answer.status === 503) {
        expect(answer.body.error.code).toBe("ASK_MAMA_FOOD_ADVICE_UNAVAILABLE");
        if (language !== "en") expect(answer.body.error.message).toMatch(language === "hi" ? /[\u0900-\u097f]/ : /[\u0c80-\u0cff]/);
      }
      else {
        expect(answer.status).toBe(200);
        expect(answer.body.fallbackSource ?? answer.body.category).toMatch(/local|safety|clarification/);
      }
    }
    console.info("ASK_MAMA_LOCAL", language, statuses.join(","));
    expect((await call(context, "/api/customer/logout", {}, "POST")).status).toBe(200);
    expect((await call(context, "/api/customer/auth/login", { identifier: email, password, staySignedIn: true })).status).toBe(200);
    expect((await call(context, dogPath)).body.pet.name).toBe("Edited Fictional Dog");
    expect((await call(context, "/api/customer/family-profile")).body.familyProfile.members).toHaveLength(2);
    expect((await call(context, "/api/weekly-shopping-list?weekStartDate=2026-11-02")).body.list.items).toEqual(list.body.list.items);
    await page.goto(origin);
    await expect(async () => {
      await page.getByLabel("Select language").selectOption(language);
      await expect(page.locator("html")).toHaveAttribute("lang", language, { timeout: 1000 });
    }).toPass({ timeout: 30000 });
    await page.goto(origin + "/shopping-list");
    await expect(page.getByRole("heading", { name: { en: "Weekly shopping list", hi: "\u0938\u093e\u092a\u094d\u0924\u093e\u0939\u093f\u0915 \u0916\u0930\u0940\u0926\u093e\u0930\u0940 \u0938\u0942\u091a\u0940", kn: "\u0cb5\u0cbe\u0cb0\u0ca6 \u0c96\u0cb0\u0cc0\u0ca6\u0cbf \u0caa\u0c9f\u0ccd\u0c9f\u0cbf" }[language], exact: true })).toBeVisible({ timeout: 30000 });
    await expect(page.locator("html")).toHaveAttribute("lang", language);
    const reopened = await context.newPage();
    await page.close();
    await reopened.goto(origin + "/?source=pwa");
    expect((await call(context, "/api/customer/session")).body.authenticated).toBe(true);
    await expect(reopened.getByLabel("Select language")).toHaveValue(language);
    if (test.info().project.name === "mobile-chromium") {
      await expect(reopened.getByRole("navigation", { name: "Primary mobile navigation" })).toBeVisible();
      expect(await reopened.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
    }
  });
}

test("public PWA shell stays available offline without caching private routes", async ({ page, context }) => {
  await page.goto(origin + "/?source=pwa");
  const manifest = await context.request.get(origin + "/manifest.webmanifest");
  const metadata = await manifest.json();
  expect(metadata.display).toBe("standalone");
  expect(metadata.start_url).toBe("/?source=pwa");
  for (const icon of metadata.icons) expect((await context.request.get(origin + icon.src)).ok()).toBe(true);
  await expect.poll(() => page.evaluate(async () => Boolean(await navigator.serviceWorker.getRegistration())), { timeout: 20000 }).toBe(true);
  await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);
  await page.evaluate(async () => { await fetch("/api/customer/session"); });
  const privatePaths = await page.evaluate(async () => (await Promise.all((await caches.keys()).map(async key => (await (await caches.open(key)).keys()).map(r => new URL(r.url).pathname)))).flat().filter(path => path.startsWith("/api/") || path.startsWith("/profile/") || path === "/planner"));
  expect(privatePaths).toEqual([]);
  await context.setOffline(true);
  expect((await page.reload())?.ok()).toBe(true);
  expect(await page.evaluate(async () => fetch("/api/customer/session").then(() => false, () => true))).toBe(true);
  await context.setOffline(false);
  expect(await page.evaluate(async () => (await fetch("/api/customer/session")).status)).toBe(401);
});
