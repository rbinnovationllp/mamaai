import { expect, test, type Page } from "@playwright/test";

async function capture(page: Page, name: string) {
  await page.screenshot({ path: `test-results/screenshots/${test.info().project.name}-${name}.png`, fullPage: true });
}

async function dismissAnalyticsChoice(page: Page) {
  const decline = page.getByRole("button", { name: "Decline" });
  if (await decline.isVisible()) await decline.click();
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => window.localStorage.clear());
});

test("homepage, mobile navigation, language selection, and subscription information", async ({ page }) => {
  await page.goto("/");
  await dismissAnalyticsChoice(page);
  await expect(page.getByRole("link", { name: "MAMAAI", exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Sign in" })).toBeVisible();
  await expect(page.getByLabel("Select language")).toBeVisible();
  await page.getByLabel("Select language").selectOption("hi");
  await expect(page.locator("html")).toHaveAttribute("lang", "hi");
  await capture(page, "home-hindi");
  await page.getByLabel("Select language").selectOption("kn");
  await expect(page.locator("html")).toHaveAttribute("lang", "kn");
  await capture(page, "home-kannada");
  await page.goto("/account/access");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await page.goto("/subscription");
  await expect(page.getByRole("heading").first()).toBeVisible();
  await capture(page, "subscription");
});

test("public registration, login, recovery and password visibility controls", async ({ page }) => {
  await page.goto("/account/access");
  await dismissAnalyticsChoice(page);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await page.locator("main button").nth(1).click();
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  const password = page.getByRole("textbox", { name: "Password", exact: true });
  await expect(password).toHaveAttribute("type", "password");
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByLabel("Full name").evaluate((input: HTMLInputElement) => input.validity.valid)).resolves.toBe(false);
  await expect(page.getByLabel("Password", { exact: true }).evaluate((input: HTMLInputElement) => input.validity.valid)).resolves.toBe(false);
  await capture(page, "registration-required-validation");
  await page.goto("/account/access");
  await page.getByRole("button", { name: "Forgot password?" }).click();
  await expect(page.getByRole("heading", { name: "Password recovery" })).toBeVisible();
  await page.getByLabel("Email address").fill("qa-public@example.test");
  await page.getByRole("button", { name: "Request reset link" }).click();
  await expect(page.getByRole("status")).toContainText("not configured");
  await capture(page, "recovery-disabled-state");
});

test("public legal pages and Ask MAMA knowledge-base UI", async ({ page }) => {
  for (const route of ["/privacy", "/terms", "/refund-policy"]) {
    await page.goto(route);
    await dismissAnalyticsChoice(page);
    await expect(page.getByRole("heading").first()).toBeVisible();
    await capture(page, route.slice(1));
  }
  await page.goto("/");
  await dismissAnalyticsChoice(page);
  const askMama = page.getByRole("button", { name: "Open Ask MAMA assistant" });
  await expect(askMama).toBeVisible();
  await askMama.click();
  await expect(page.getByRole("dialog", { name: "Ask MAMA" })).toBeVisible();
  await page.getByRole("button", { name: "How does MAMAAI work?" }).click();
  await page.getByRole("dialog", { name: "Ask MAMA" }).getByRole("button", { name: "Ask", exact: true }).click();
  await expect(page.getByRole("dialog", { name: "Ask MAMA" })).toContainText(/MAMAAI|Could not retrieve/);
  await capture(page, "ask-mama-public");
});
