import { createBdd } from 'playwright-bdd';
const { Given, When, Then } = createBdd();
import { expect } from '@playwright/test';
import { LoginPage } from '../pages/login.page';

Given('the user is on the login page', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.navigate('/web/index.php/auth/login');
});

When('the user enters {string} into the {string} field', async ({ page }, value: string, field: string) => {
    const loginPage = new LoginPage(page);
    if (field === 'Username') {
        await loginPage.usernameInput.fill(value);
    } else if (field === 'Password') {
        await loginPage.passwordInput.fill(value);
    }
});

When('the user clicks the {string} button', async ({ page }, buttonName: string) => {
    const loginPage = new LoginPage(page);
    await loginPage.loginButton.click();
    // Wait for the page to respond (either redirect to dashboard or show error)
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 }).catch(() => {});
});

Then('the user should be redirected to the {string} page', async ({ page }, pageName: string) => {
    await page.waitForURL('**/dashboard/index', { timeout: 60000 });
});

Then('the system should display the {string} header', async ({ page }, headerText: string) => {
    await expect(page.getByRole('heading', { name: headerText })).toHaveText(headerText);
});

Then('the system should display the {string} error message', async ({ page }, errorMessage: string) => {
    const loginPage = new LoginPage(page);
    const errorLocator = page.getByText(errorMessage);
    await expect(errorLocator).toBeVisible({ timeout: 30000 });
});

Then(
    'the system should display {string} under the {string} field',
    async ({ page }, message: string, field: string) => {
        const loginPage = new LoginPage(page);
        const errorLocator = page.getByText(message);
        await expect(errorLocator).toBeVisible({ timeout: 30000 });
    },
);

When('the user enters a string of 256 characters into the {string} field', async ({ page }, field: string) => {
    const loginPage = new LoginPage(page);
    const longString = 'a'.repeat(256);
    if (field === 'Username') {
        await loginPage.usernameInput.fill(longString);
    } else if (field === 'Password') {
        await loginPage.passwordInput.fill(longString);
    }
});
