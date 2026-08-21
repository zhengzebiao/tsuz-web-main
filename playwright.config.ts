import { defineConfig, devices } from "@playwright/test";

const isIntegrationE2e = process.env.MFE_INTEGRATION_E2E === "true";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: "http://127.0.0.1:7200",
    trace: "on-first-retry"
  },
  webServer: isIntegrationE2e
    ? undefined
    : {
        command: "pnpm dev",
        url: "http://127.0.0.1:7200/login",
        reuseExistingServer: !process.env.CI,
        timeout: 60_000
      },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] }
    }
  ]
});
