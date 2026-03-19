import { defineConfig, devices } from '@playwright/test';
import { defineBddConfig } from 'playwright-bdd';
import * as dotenv from 'dotenv';

// Load environment variables: .env.local → .env (first wins)
dotenv.config({ path: '.env.local' });
dotenv.config(); // fallback to .env

const testDir = defineBddConfig({
  features: 'src/features/**/*.feature',
  steps: [
    'src/tests/**/steps/*.steps.ts',
    'src/support/hooks.ts'
  ],
  outputDir: '.test-artifacts/.features-gen',
});

export default defineConfig({
  testDir,
  /* Maximum time one test can run for */
  timeout: 120_000,
  /* Run tests in files in parallel (disable on CI — shared demo site can't handle concurrency) */
  fullyParallel: !process.env.CI,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 1 : 0,
  /* OrangeHRM demo site can't handle many concurrent sessions */
  workers: 1,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    ['./src/support/console-reporter.ts'],
    ['html', { outputFolder: 'playwright-report' }],
    ['allure-playwright', { 
      resultsDir: 'allure/results',
      detail: true,
      suiteTitle: false,
      environmentInfo: {
        os_platform: process.platform,
        node_version: process.version
      }
    }]
  ],
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  expect: {
    /* OrangeHRM demo site is slow — 15s for assertions instead of default 5s */
    timeout: 15000,
  },
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: process.env.BASE_URL || 'https://opensource-demo.orangehrmlive.com',

    /* Timeouts for slow demo site */
    actionTimeout: 15000,
    navigationTimeout: 60000,

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'retain-on-failure',
    screenshot: 'on',
    video: 'off',
    headless: process.env.HEADLESS !== 'false',
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
