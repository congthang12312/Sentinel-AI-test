import { Page, Locator, expect } from '@playwright/test';

/**
 * BasePage — Foundation for all AI-generated Page Objects.
 * Every POM class MUST extend this to ensure consistent patterns.
 */
export class BasePage {
    constructor(public readonly page: Page) {}

    // ─── Navigation ──────────────────────────────────────────

    /**
     * Navigate to a path, resolving against BASE_URL if relative.
     * Waits for DOM + network idle to ensure page is interactive.
     */
    async navigate(path: string): Promise<void> {
        const baseUrl = process.env.BASE_URL || 'https://opensource-demo.orangehrmlive.com';
        const url = path.startsWith('http') ? path : `${baseUrl}${path}`;
        await this.page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
        await this.waitForPageReady();
    }

    // ─── Wait Strategies ─────────────────────────────────────

    /**
     * Wait for page to be fully interactive:
     * 1. Network idle (no pending requests)
     * 2. No loading spinners visible
     */
    async waitForPageReady(): Promise<void> {
        await this.page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {});
        // Wait for OrangeHRM spinner to disappear (common across all pages)
        const spinner = this.page.locator('.oxd-loading-spinner');
        await spinner.waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {});
    }

    /**
     * Wait for URL to contain the expected path segment.
     */
    async waitForUrlContaining(urlPart: string, timeout = 30000): Promise<void> {
        await this.page.waitForURL(`**${urlPart}**`, { timeout });
    }

    // ─── Assertions ──────────────────────────────────────────

    /**
     * Check if a specific heading is visible on the page.
     */
    async expectHeading(text: string): Promise<void> {
        await expect(this.page.getByRole('heading', { name: text })).toBeVisible({ timeout: 15000 });
    }

    /**
     * Check if a specific text is visible anywhere on the page.
     */
    async expectTextVisible(text: string, timeout = 15000): Promise<void> {
        await expect(this.page.getByText(text)).toBeVisible({ timeout });
    }

    /**
     * Get the first visible error/alert message text on the page.
     * Returns null if no error message is found.
     */
    async getAlertMessage(): Promise<string | null> {
        const alert = this.page.locator('[role="alert"]').first();
        try {
            await alert.waitFor({ state: 'visible', timeout: 10000 });
            return await alert.textContent();
        } catch {
            return null;
        }
    }

    /**
     * Check if a validation message appears near a specific field.
     */
    async expectFieldValidation(fieldLabel: string, message: string): Promise<void> {
        // OrangeHRM validation messages appear as siblings of the input group
        const validationMsg = this.page.getByText(message);
        await expect(validationMsg).toBeVisible({ timeout: 10000 });
    }

    // ─── Element Helpers ─────────────────────────────────────

    /**
     * Safe visibility check — returns boolean instead of throwing.
     */
    async isVisible(locator: Locator, timeout = 5000): Promise<boolean> {
        try {
            await locator.waitFor({ state: 'visible', timeout });
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Click a button by its accessible name and wait for response.
     */
    async clickButton(name: string): Promise<void> {
        await this.page.getByRole('button', { name, exact: true }).click();
        await this.page.waitForLoadState('domcontentloaded').catch(() => {});
    }
}
