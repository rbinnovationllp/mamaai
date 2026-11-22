import { expect, test, type Page } from "@playwright/test";

test.use({ screenshot: "only-on-failure", trace: "retain-on-failure" });

const password = "Qa!202611";

type BrowserFetchInit = { method?: string; headers?: Record<string, string>; body?: string };

async function api(page: Page, path: string, init?: BrowserFetchInit) {
  return page.evaluate(async ({ path, init }) => {
    const response = await fetch(path, init);
    return { status: response.status, body: await response.json().catch(() => ({})) };
  }, { path, init });
}

test("typed family document is reviewed, applied, saved and reloaded through the mobile UI", async ({ page }) => {
  const id = crypto.randomUUID().slice(0, 8);
  await page.context().setExtraHTTPHeaders({ "x-forwarded-for": `198.51.100.${20 + Math.floor(Math.random() * 200)}` });
  await page.goto("/account/access");
  const registration = await api(page, "/api/customer/auth/register", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ fullName: "Fictional Document Tester", email: `document-${id}@example.test`, password, confirmPassword: password, staySignedIn: true }),
  });
  expect(registration.status).toBe(201);

  await page.goto("/profile/family");
  await page.getByLabel("Paste typed notes").fill([
    "Number of people: 1",
    "Household dietary practices: vegetarian",
    "Breakfast: poha",
    "Lunch: dal rice",
    "Snacks: roasted chana",
    "Dinner: roti bhindi",
    "Person 1: Fictional Asha",
    "Relation: self",
    "Age: 32",
    "Diet type: vegetarian",
    "Favourite foods: dosa, rajma",
    "Foods disliked or avoided: bitter gourd",
    "Allergies or intolerances: peanuts",
    "Doctor or dietitian advice: keep salt low",
    "Monday",
    "Breakfast: idli",
    "Lunch: sambar rice",
    "Dinner: roti dal",
  ].join("\n"));
  await page.getByRole("button", { name: "Read and prepare review" }).click();
  await expect(page.getByText("Review draft — nothing saved")).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Allergies", exact: true })).toHaveValue("peanuts");
  await page.getByRole("button", { name: "Apply reviewed draft to this form" }).click();
  await expect(page.getByRole("heading", { name: "Fictional Asha" })).toBeVisible();
  await page.getByRole("textbox", { name: /^Your name/ }).fill("Fictional Document Tester");

  const saved = page.waitForResponse((response) => response.url().includes("/api/customer/family-profile") && response.request().method() === "POST");
  await page.getByRole("button", { name: "Save Family & Continue" }).first().click();
  expect((await saved).status()).toBe(200);
  await expect(page).toHaveURL(/\/planner/, { timeout: 10_000 });
  await page.goto("/profile/family");
  await expect(page.getByRole("heading", { name: "Fictional Asha" })).toBeVisible();
  await expect(page.locator('input[value="poha"]')).toBeVisible();
  await expect(page.locator('input[value="dal rice"]')).toBeVisible();
  await expect(page.locator('input[value="roasted chana"]')).toBeVisible();
  await expect(page.locator('input[value="roti bhindi"]')).toBeVisible();

  const reread = await api(page, "/api/customer/family-profile");
  expect(reread.status).toBe(200);
  expect(reread.body.familyProfile.members).toHaveLength(1);
  expect(reread.body.familyProfile.members[0].allergies).toEqual(["peanuts"]);
  expect(reread.body.customer.recentMealHistory[0]).toMatchObject({ day: "monday", breakfast: "idli", lunch: "sambar rice", dinner: "roti dal" });

  const importer = page.locator("section").filter({ hasText: "Fill your family profile from a document" });
  await importer.getByLabel("Paste typed notes").fill("");
  await importer.locator('input[type="file"]').setInputFiles({ name: "unreadable.docx", mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", buffer: Buffer.from("not a Word archive") });
  await importer.getByRole("button", { name: "Read and prepare review" }).click();
  await expect(importer.getByText("The selected DOCX file is not a valid Word document.")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Fictional Asha" })).toBeVisible();
  const afterFailure = await api(page, "/api/customer/family-profile");
  expect(afterFailure.body.familyProfile.members).toHaveLength(1);
  expect(afterFailure.body.familyProfile.members[0].allergies).toEqual(["peanuts"]);
});
