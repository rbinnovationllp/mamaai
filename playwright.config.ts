import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  outputDir: "test-results",
  fullyParallel: false,
  retries: 0,
  timeout: 90_000,
  reporter: [["list"], ["html", { outputFolder: "playwright-report", open: "never" }]],
  use: {
    baseURL: "http://127.0.0.1:3101",
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
    video: "off",
  },
  projects: [
    { name: "desktop-chromium", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 1000 } } },
    { name: "mobile-chromium", use: { ...devices["Pixel 5"], viewport: { width: 390, height: 844 } } },
  ],
  webServer: {
    command: "npm run dev -- --hostname 127.0.0.1 --port 3101",
    url: "http://127.0.0.1:3101",
    env: { NODE_ENV: "development", NEXT_PUBLIC_APP_URL: "http://127.0.0.1:3101", MAMA_AI_DYNAMODB_LOCAL: "true", MAMA_AI_LOCAL_QA: "true", MAMA_AI_DYNAMODB_LOCAL_ENDPOINT: "http://127.0.0.1:8010", MAMA_AI_ALLOWED_ORIGINS: "http://127.0.0.1:3101", AWS_REGION: "ap-south-1", AWS_ACCESS_KEY_ID: "LOCAL_TEST_ONLY", AWS_SECRET_ACCESS_KEY: "LOCAL_TEST_ONLY", MAMA_AI_DYNAMODB_TABLE_NAME: "mamaai-local-qa-acceptance-20261102", MAMA_AI_ANALYTICS_TABLE_NAME: "mamaai-local-qa-acceptance-20261102", MAMA_AI_DYNAMODB_GSI1_NAME: "GSI1", AUTH_SECRET: "local-qa-only-not-a-production-secret" },
    // Local authenticated QA starts the fail-closed server explicitly so its
    // DynamoDB endpoint can be checked before any browser request.
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
