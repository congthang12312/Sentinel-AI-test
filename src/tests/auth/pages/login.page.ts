import { Page, Locator } from '@playwright/test';

export class LoginPage {
    constructor(public readonly page: Page) {}

    // Locators
    get usernameInput(): Locator {
        return this.page.getByPlaceholder('Username');
    }

    get passwordInput(): Locator {
        return this.page.getByPlaceholder('Password');
    }

    get loginButton(): Locator {
        return this.page.getByRole('button', { name: 'Login' });
    }

    // Actions
    async navigate(path: string) {
        const baseUrl = process.env.BASE_URL || 'https://opensource-demo.orangehrmlive.com';
        const finalUrl = path.startsWith('http') ? path : `${baseUrl}${path}`;
        await this.page.goto(finalUrl, { waitUntil: 'domcontentloaded', timeout: 120000 });
    }

    async login(username: string, password: string) {
        await this.usernameInput.fill(username);
        await this.passwordInput.fill(password);
        await this.loginButton.click();
    }
}
