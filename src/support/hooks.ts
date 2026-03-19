import { createBdd } from 'playwright-bdd';
const { After } = createBdd();
import { test } from '@playwright/test';
import { ContentType } from 'allure-js-commons';

After(async ({ page }) => {
    // We already capture screenshots via playwright.config.ts `screenshot: 'on'`.
    // However, to ensure Allure explicitly lists a "Result" screenshot at the very end of the steps:
    try {
        const screenshot = await page.screenshot({ fullPage: true });
        // Use Playwright testInfo attaching instead of direct Allure attach which is flaky
        await test.info().attach('Result', {
            body: screenshot,
            contentType: ContentType.PNG,
        });
    } catch (e) {
        console.error('Failed to capture final screenshot for Allure: ', e);
    }
});
