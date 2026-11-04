import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
  testDir: "./e2e",
  outputDir: "test-results-isolated",
  timeout: 120_000,
  reporter: [["list"]],
  use: { baseURL: "http://127.0.0.1:3103", screenshot: "only-on-failure", trace: "retain-on-failure", video: "off" },
  projects: [{ name: "desktop-chromium", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 1000 } } }],
});
