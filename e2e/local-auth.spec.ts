import { expect, test, type Page } from "@playwright/test";

test.use({ screenshot: "off", trace: "off" });
const password = "LocalQaPassword!2026";

async function expectRegistration(page: Page) {
  const responsePromise = page.waitForResponse((response) => response.url().includes("/api/customer/auth/register"), { timeout: 15_000 });
  await page.getByRole("button", { name: "Continue" }).click();
  return responsePromise;
}

test("fictional email account registration, session persistence, logout, login, and duplicate prevention", async ({ page }, testInfo) => {
  test.setTimeout(90_000);
  await page.context().setExtraHTTPHeaders({ "x-forwarded-for": testInfo.project.name === "desktop-chromium" ? "198.51.100.101" : "198.51.100.102" });
  const email = `qa-email-${testInfo.project.name.replace(/[^a-z]/g, "")}-${crypto.randomUUID()}@example.test`;
  await page.goto("/account/access");
  await page.getByRole("button", { name: "Create account" }).click();
  await page.getByLabel("Full name").fill("QA Email Family");
  await page.getByLabel("Email address (optional)").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByLabel("Confirm password").fill(password);
  const registerResponse = await expectRegistration(page);
  console.info(`LOCAL_QA_BROWSER_EMAIL_REGISTER status=${registerResponse.status()}`);
  expect(registerResponse.status()).toBe(201);
  await expect(page.getByRole("status")).toContainText("recovery codes");
  expect(await page.evaluate(() => fetch("/api/customer/session").then((response) => response.status))).toBe(200);
  await page.reload();
  expect(await page.evaluate(() => fetch("/api/customer/session").then((response) => response.status))).toBe(200);
  expect(await page.evaluate(() => fetch("/api/customer/logout", { method: "POST" }).then((response) => response.status))).toBe(200);
  expect(await page.evaluate(() => fetch("/api/customer/session").then((response) => response.status))).not.toBe(200);
  await page.goto("/account/access");
  await page.getByLabel("Email address or mobile number").fill(email);
  await page.getByLabel("Password", { exact: true }).fill("IncorrectLocalPassword!2026");
  const rejectedLogin = page.waitForResponse((response) => response.url().includes("/api/customer/auth/login"));
  await page.getByRole("button", { name: "Continue" }).click();
  expect((await rejectedLogin).status()).toBe(401);
  await page.getByLabel("Password", { exact: true }).fill(password);
  const acceptedLogin = page.waitForResponse((response) => response.url().includes("/api/customer/auth/login"));
  await page.getByRole("button", { name: "Continue" }).click();
  expect((await acceptedLogin).status()).toBe(200);
  expect(await page.evaluate(() => fetch("/api/customer/session").then((response) => response.status))).toBe(200);
  await page.waitForURL(url => url.pathname !== "/account/access");
  await page.request.post("/api/customer/logout");
  await page.goto("/account/access");
  await page.getByRole("button", { name: "Create account" }).click();
  await page.getByLabel("Full name").fill("QA Email Family");
  await page.getByLabel("Email address (optional)").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByLabel("Confirm password").fill(password);
  const duplicate = await expectRegistration(page);
  console.info(`LOCAL_QA_BROWSER_EMAIL_DUPLICATE status=${duplicate.status()}`);
  expect(duplicate.status()).toBe(409);
});

test("fictional mobile-only account registration completes", async ({ page }, testInfo) => {
  test.setTimeout(90_000);
  await page.context().setExtraHTTPHeaders({ "x-forwarded-for": testInfo.project.name === "desktop-chromium" ? "198.51.100.103" : "198.51.100.104" });
  const mobile = testInfo.project.name === "desktop-chromium" ? "+12025550151" : "+12025550152";
  await page.goto("/account/access");
  await page.getByRole("button", { name: "Create account" }).click();
  await page.getByLabel("Full name").fill("QA Mobile Family");
  await page.getByLabel("Mobile number (optional)").fill(mobile);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByLabel("Confirm password").fill(password);
  const response = await expectRegistration(page);
  console.info(`LOCAL_QA_BROWSER_MOBILE_REGISTER status=${response.status()}`);
  expect(response.status()).toBe(201);
  await expect(page.getByRole("status")).toContainText("recovery codes");
  expect(await page.evaluate(() => fetch("/api/customer/session").then((result) => result.status))).toBe(200);
});
