import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  forbidOnly: false,
  retries: 0,
  reporter: 'list',
  timeout: 120000,
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    ignoreHTTPSErrors: true,
    launchOptions: {
      slowMo: 1500,
      headless: false,
      args: ["--window-size=1280,900"],
    },
  },
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } },
  ],
});
