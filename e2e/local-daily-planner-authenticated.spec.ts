import { expect, test } from "@playwright/test";

test.use({ screenshot: "only-on-failure", trace: "retain-on-failure" });

test("fictional customer completes the mobile free daily-plan journey with Jain and separate-meal preferences", async ({ page }) => {
  test.setTimeout(120_000);
  const runId = crypto.randomUUID().slice(0, 8);
  const email = `daily-ui-${runId}@example.test`;
  const password = `Qa!${runId}x`;
  const requestSummaries: Array<Record<string, unknown>> = [];

  page.on("request", (request) => {
    if (!request.url().endsWith("/api/daily-meal-plan") || request.method() !== "POST") return;
    const body = request.postDataJSON() as Record<string, unknown>;
    const members = Array.isArray(body.members) ? body.members : [];
    requestSummaries.push({
      ingredientCount: Array.isArray(body.ingredients) ? body.ingredients.length : 0,
      householdDiet: body.householdDiet,
      meals: body.meals,
      memberCount: body.memberCount,
      members: members.map((member) => {
        const value = member as Record<string, unknown>;
        return { diet: value.diet, needsSeparateMeal: value.needsSeparateMeal, hasAge: typeof value.age === "number" };
      }),
      consent: body.aiProcessingConsent === true,
    });
  });

  await page.goto("/account/access?next=%2Ftoday");
  await page.getByRole("button", { name: "Create account" }).click();
  await page.getByLabel("Full name").fill("Fictional Daily Planner QA");
  await page.getByLabel("Email address (optional)").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByLabel("Confirm password").fill(password);
  await page.getByRole("button", { name: "Continue" }).press("Enter");
  await expect(page.getByRole("button", { name: "Plan today's meals FREE" })).toBeVisible();
  await page.getByRole("button", { name: "Plan today's meals FREE" }).click();

  await expect(page.getByRole("heading", { name: "What to Cook Today?" })).toBeVisible();
  await page.getByLabel("Number of people").fill("2");
  await page.getByRole("group", { name: "Family member 1" }).getByLabel("Name or label").fill("Fictional Jain Asha");
  await page.getByRole("group", { name: "Family member 1" }).getByLabel("Age (optional for free plan)").fill("35");
  await page.getByRole("group", { name: "Family member 1" }).getByRole("combobox", { name: "Diet", exact: true }).selectOption("jain");
  await page.getByRole("group", { name: "Family member 1" }).getByLabel("Allergies (comma separated)").fill("peanut");
  await page.getByRole("group", { name: "Family member 2" }).getByLabel("Name or label").fill("Fictional Separate Riya");
  await page.getByRole("group", { name: "Family member 2" }).getByLabel("Age (optional for free plan)").fill("33");
  await page.getByRole("group", { name: "Family member 2" }).getByLabel("Needs a separate meal or substitute").check();

  await page.getByText("Vegetables", { exact: true }).click();
  await page.getByText("Tomato / Tamatar", { exact: true }).click();
  await page.getByText("Dal, pulses and legumes", { exact: true }).click();
  await page.getByText("Moong Dal", { exact: true }).click();
  await page.getByText("Rice, flour and grains", { exact: true }).click();
  await page.getByText("Wheat flour / Atta", { exact: true }).click();
  await page.getByLabel("Other ingredients").fill("curd");
  await page.getByLabel(/I agree that MAMAAI may use these food/i).check();

  const responsePromise = page.waitForResponse((response) => response.url().endsWith("/api/daily-meal-plan") && response.request().method() === "POST");
  await page.getByRole("button", { name: "Generate Today’s FREE Meal Plan" }).click();
  const response = await responsePromise;
  expect(response.status()).toBe(201);
  expect(requestSummaries).toHaveLength(1);
  expect(requestSummaries[0]).toMatchObject({ householdDiet: "vegetarian", memberCount: 2, consent: true });
  expect(requestSummaries[0].members).toEqual(expect.arrayContaining([
    expect.objectContaining({ diet: "jain", needsSeparateMeal: false, hasAge: true }),
    expect.objectContaining({ needsSeparateMeal: true, hasAge: true }),
  ]));

  await expect(page.getByRole("heading", { name: "Family-member guidance" }).first()).toBeVisible();
  await expect(page.getByText("Fictional Separate Riya:", { exact: false }).first()).toBeVisible();
  await page.reload();
  await expect(page.getByText("Your saved free daily meal plan")).toBeVisible();
  await expect(page.getByText("Fictional Separate Riya:", { exact: false }).first()).toBeVisible();

  const profileRead = page.waitForResponse((response) => response.url().endsWith("/api/customer/family-profile") && response.request().method() === "GET");
  const dailyRead = page.waitForResponse((response) => response.url().endsWith("/api/daily-meal-plan") && response.request().method() === "GET");
  await page.getByRole("link", { name: "My Family" }).first().click();
  expect((await profileRead).status()).toBe(200);
  expect((await dailyRead).status()).toBe(200);
  await expect(page.getByText("Your free daily-plan details were added for review.")).toBeVisible({ timeout: 20_000 });
  await expect(page.getByText("Fictional Jain Asha")).toBeVisible();
  await expect(page.getByText("Fictional Separate Riya")).toBeVisible();

  const profileSave = page.waitForResponse((response) => response.url().endsWith("/api/customer/family-profile") && response.request().method() === "POST");
  await page.getByRole("button", { name: "Save Family & Continue" }).first().click();
  expect((await profileSave).status()).toBe(200);
  await page.waitForURL(/\/subscription$/);

  await page.goto("/account/security");
  await expect(page.getByRole("button", { name: "Log out" })).toBeVisible();
  const logout = page.waitForResponse((response) => response.url().endsWith("/api/customer/logout") && response.request().method() === "POST");
  await page.getByRole("button", { name: "Log out" }).click();
  expect((await logout).status()).toBe(200);
  await page.waitForURL(/\/$/);

  await page.goto("/account/access?next=%2Ftoday");
  await expect(page.getByLabel("Email address or mobile number")).toBeVisible();
  await page.getByLabel("Email address or mobile number").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Continue" }).press("Enter");
  await page.waitForURL(/\/today$/);
  await expect(page.getByText("Your saved free daily meal plan")).toBeVisible();
  await expect(page.getByText("Fictional Separate Riya:", { exact: false }).first()).toBeVisible();
});
