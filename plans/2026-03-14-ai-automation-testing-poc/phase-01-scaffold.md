# Phase 01: Project Scaffold & Infrastructure

**Status**: `[ ]` pending
**Effort**: 3-4 days
**Dependencies**: None

## Overview

Thiết lập toàn bộ project structure, cài dependencies, cấu hình Cucumber + Playwright + TypeScript. Tạo boilerplate code (BasePage, World class, hooks) để AI chỉ cần fill business logic.

## Requirements

- Node.js >= 20.x installed
- npm initialized
- LLM API key available (Anthropic or Azure OpenAI)

## Implementation Steps

### 1.1 Initialize Node.js + TypeScript project
```bash
npm init -y
npm install -D typescript ts-node @types/node
npx tsc --init
```

### 1.2 Install Playwright + Cucumber
```bash
npm install -D @playwright/test @cucumber/cucumber
npm install -D cucumber-html-reporter
npx playwright install chromium
```

### 1.3 Install AI/MCP dependencies
```bash
npm install anthropic          # or openai for GPT-4o
npm install dotenv
```

### 1.4 Create project directory structure
```
mcp-automation-test/
├── requirements/              # Business requirements (input)
├── features/                  # Gherkin .feature files (output)
├── fixtures/                  # Test data JSON
│   ├── login/
│   ├── create-data/
│   └── common/
├── src/
│   ├── steps/                 # Cucumber step definitions
│   ├── pages/                 # Page Object Model classes
│   ├── support/               # World, hooks, config
│   └── utils/                 # Helpers
├── reports/                   # Test reports
├── ai-agent/                  # Orchestrator + prompts
│   ├── steps/
│   └── prompts/
└── mcp/                       # MCP configs
```

### 1.5 Create boilerplate files

**`src/support/world.ts`** — Cucumber World class:
```typescript
import { World, IWorldOptions, setWorldConstructor } from '@cucumber/cucumber';
import { Browser, Page, BrowserContext, chromium } from '@playwright/test';

export class CustomWorld extends World {
  browser!: Browser;
  context!: BrowserContext;
  page!: Page;
  
  constructor(options: IWorldOptions) {
    super(options);
  }
  
  async init() {
    this.browser = await chromium.launch({ headless: false });
    this.context = await this.browser.newContext();
    this.page = await this.context.newPage();
  }
  
  async cleanup() {
    await this.page?.close();
    await this.context?.close();
    await this.browser?.close();
  }
}

setWorldConstructor(CustomWorld);
```

**`src/support/hooks.ts`** — Before/After hooks:
```typescript
import { Before, After, BeforeAll, AfterAll } from '@cucumber/cucumber';
import { CustomWorld } from './world';

Before(async function (this: CustomWorld) {
  await this.init();
});

After(async function (this: CustomWorld) {
  // Screenshot on failure
  if (this.page) {
    await this.page.screenshot({ path: `reports/screenshot-${Date.now()}.png` });
  }
  await this.cleanup();
});
```

**`src/pages/base.page.ts`** — BasePage template:
```typescript
import { Page, Locator } from '@playwright/test';

export abstract class BasePage {
  constructor(protected page: Page) {}
  
  async navigate(path: string) {
    const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
    await this.page.goto(`${baseUrl}${path}`);
  }
  
  async waitForPageLoad() {
    await this.page.waitForLoadState('networkidle');
  }
  
  async screenshot(name: string) {
    await this.page.screenshot({ path: `reports/${name}.png` });
  }
}
```

### 1.6 Create Cucumber configuration

**`cucumber.js`**:
```javascript
module.exports = {
  default: {
    paths: ['features/**/*.feature'],
    require: ['src/steps/**/*.ts', 'src/support/**/*.ts'],
    requireModule: ['ts-node/register'],
    format: ['progress', 'html:reports/cucumber-report.html'],
    publishQuiet: true,
  },
};
```

### 1.7 Create environment config

**`.env.test`**:
```env
BASE_URL=https://staging.kit.com
AI_MODEL=claude-3.5-sonnet
ANTHROPIC_API_KEY=sk-xxx
PLAYWRIGHT_MCP_URL=http://localhost:3000
```

### 1.8 Create sample requirement file

**`requirements/login-flow.md`**:
```markdown
# Login Flow

## User Story
As a KIT user, I want to log in with my email and password
so that I can access the dashboard.

## Acceptance Criteria
1. User navigates to the login page
2. User enters valid email and password
3. User clicks the "Đăng nhập" button
4. System redirects to dashboard
5. Dashboard displays welcome message

## Error Cases
- Invalid email format → show validation error
- Wrong password → show "Sai mật khẩu" message
- Empty fields → show "Vui lòng nhập" message
```

## Todo List

- [ ] 1.1 Init Node.js + TypeScript
- [ ] 1.2 Install Playwright + Cucumber
- [ ] 1.3 Install AI/MCP deps
- [ ] 1.4 Create directory structure
- [ ] 1.5 Create boilerplate (World, hooks, BasePage)
- [ ] 1.6 Cucumber config
- [ ] 1.7 Environment config (.env.test)
- [ ] 1.8 Sample requirement file
- [ ] 1.9 Verify: `npx cucumber-js --dry-run` works without errors

## Success Criteria

- [ ] Project compiles (`npx tsc --noEmit` passes)
- [ ] Cucumber dry-run works
- [ ] Playwright can launch browser (`npx playwright test --version`)
- [ ] Directory structure matches spec
- [ ] All boilerplate files type-check

## Risk Assessment

| Risk | Impact | Mitigation |
|---|---|---|
| TypeScript + Cucumber compatibility | Medium | Use `ts-node/register` in cucumber config |
| Playwright browser install fails | Low | Use `--with-deps` flag |
