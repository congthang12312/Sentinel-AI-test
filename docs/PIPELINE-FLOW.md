# AI Pipeline — Cách Code Chạy Từ A → Z

Tài liệu này giải thích chi tiết cách toàn bộ hệ thống hoạt động, từ file requirement đầu vào cho đến kết quả test cuối cùng.

---

## 🗺️ Tổng Quan Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        USER chạy command                                │
│   npx ts-node ai-agent/cli.ts requirements/login-flow.md               │
└───────────────────────────────┬─────────────────────────────────────────┘
                                │
                                ▼
┌──────────────────── CLI (cli.ts) ────────────────────────────────────────┐
│  Parse args → detect mode (full pipeline / step / heal)                 │
│  → gọi runPipeline() trong orchestrator.ts                              │
└───────────────────────────────┬──────────────────────────────────────────┘
                                │
         ┌──────────────────────┼──────────────────────────┐
         ▼                      ▼                          ▼
   ┌─── STEP 1 ───┐     ┌─── STEP 2 ───┐          ┌─── STEP 3 ───┐
   │ Requirement   │     │ Gherkin       │          │ Cucumber +   │
   │ → Gherkin     │────▶│ → POM + Steps │─────────▶│ Playwright   │
   │               │     │               │          │ Execute      │
   └───────────────┘     └───────────────┘          └──────┬───────┘
                                                           │
                                                    PASS?  │  FAIL?
                                                     ✅    │   ❌
                                                           ▼
                                                  ┌─── STEP 4 ───┐
                                                  │ Self-Healing  │
                                                  │ AI diagnose   │
                                                  │ → fix → retry │
                                                  │ (max 3 lần)   │
                                                  └───────────────┘
```

---

## STEP 0: Entry Point — `ai-agent/cli.ts`

**File**: [cli.ts](file:///Users/macos/Documents/PET_PROJECT/mcp-automation-test/ai-agent/cli.ts)

```bash
# Full pipeline (Step 1 → 2 → 3 + self-heal)
npx ts-node ai-agent/cli.ts requirements/login-flow.md

# Chỉ chạy từng step riêng
npx ts-node ai-agent/cli.ts requirements/login-flow.md --step=1   # Chỉ gen Gherkin
npx ts-node ai-agent/cli.ts requirements/login-flow.md --step=2   # Chỉ gen POM + Steps
npx ts-node ai-agent/cli.ts requirements/login-flow.md --step=3   # Chỉ chạy test

# Self-healing mode
npx ts-node ai-agent/cli.ts features/login.feature --heal --tags=@login
```

**Code flow bên trong CLI:**

```
cli.ts
├── Parse args (--step=N, --heal, --tags=@x)
├── if --heal    → gọi healAndRetry() từ self-healing.ts
├── if --step=1  → gọi generateGherkin() từ orchestrator.ts
├── if --step=2  → gọi generateStepsAndPOM() từ orchestrator.ts
├── if --step=3  → gọi runTests() từ orchestrator.ts
└── else         → gọi runPipeline() (full pipeline) từ orchestrator.ts
```

---

## STEP 1: Requirement → Gherkin Feature

**Function**: [generateGherkin()](file:///Users/macos/Documents/PET_PROJECT/mcp-automation-test/ai-agent/orchestrator.ts#L14-L33)

### Input
**File requirement** (viết bằng ngôn ngữ tự nhiên):

```markdown
# Login Flow — OrangeHRM Demo
## URL: https://opensource-demo.orangehrmlive.com/web/index.php/auth/login
## Credentials: Admin / admin123
## Scenarios to test:
1. Valid login → redirect to Dashboard
2. Invalid password → error message "Invalid credentials"
3. Empty username → validation "Required"
4. Empty password → validation "Required"
```

### AI Processing

```
[requirements/login-flow.md]
         │
         ▼
[callLLM(systemPrompt, requirement)]
         │
         │  systemPrompt = ai-agent/prompts/generate-gherkin.md
         │  Nội dung: "You are an expert QA Engineer... Convert
         │  business requirements into Gherkin BDD scenarios..."
         │
         ▼
[Gemini 2.5 Flash API]  ← config.ts chứa API key + model config
         │
         ▼
[.feature file content]
```

### Output
**File Gherkin** (`features/login.feature`):

```gherkin
@login @smoke
Feature: OrangeHRM Login Functionality

  Scenario: Successful login with valid credentials
    Given User is on the OrangeHRM login page
    When User enters "Admin" into the "Username" field
    And User enters "admin123" into the "Password" field
    And User clicks the "Login" button
    Then User should be redirected to the "/dashboard" URL
    And The heading "Dashboard" should be displayed
```

---

## STEP 2: Gherkin → Page Object + Step Definitions

**Function**: [generateStepsAndPOM()](file:///Users/macos/Documents/PET_PROJECT/mcp-automation-test/ai-agent/orchestrator.ts#L35-L103)

### 2a. Generate Page Object Model (POM)

```
[features/login.feature]
         │
         ├── Read feature content
         ├── Check fixtures/ for test data
         │
         ▼
[callLLM(pomPrompt, featureContent + fixtures)]
         │
         │  pomPrompt = ai-agent/prompts/generate-pom.md
         │  Nội dung: "Extend BasePage, use getByRole() preferred,
         │  define locators as getter properties..."
         │
         ▼
[Gemini 2.5 Flash API]
         │
         ▼
[src/pages/login.page.ts]   ← AI-generated POM
```

**Output POM** (ví dụ):
```typescript
export class LoginPage extends BasePage {
  get usernameInput(): Locator {
    return this.page.getByPlaceholder('Username');
  }
  get passwordInput(): Locator {
    return this.page.getByPlaceholder('Password');
  }
  get loginButton(): Locator {
    return this.page.getByRole('button', { name: 'Login' });
  }
  async login(username: string, password: string) {
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }
}
```

### 2b. Generate Step Definitions

```
[features/login.feature] + [login.page.ts đã gen ở 2a]
         │
         ▼
[callLLM(stepsPrompt, featureContent + pomContent + fixtures)]
         │
         │  stepsPrompt = ai-agent/prompts/generate-steps.md
         │  Nội dung: "Use Cucumber Expressions, import CustomWorld,
         │  load test data from fixtures, use Playwright locators..."
         │
         ▼
[Gemini 2.5 Flash API]
         │
         ▼
[src/steps/login.steps.ts]   ← AI-generated step definitions
```

**Output Steps** (ví dụ):
```typescript
Given('User is on the OrangeHRM login page', async function (this: CustomWorld) {
  const loginPage = new LoginPage(this.page);
  await loginPage.navigate('/web/index.php/auth/login');
});
When('User enters {string} into the {string} field', async function (this: CustomWorld, text, fieldName) {
  // ... uses LoginPage methods
});
```

---

## STEP 3: Chạy Tests — Cucumber + Playwright

**Function**: [runTests()](file:///Users/macos/Documents/PET_PROJECT/mcp-automation-test/ai-agent/orchestrator.ts#L105-L131)

### Test Execution Flow

```
npx cucumber-js features/login.feature
         │
         ├── 1. Cucumber đọc cucumber.js config
         │      → Load paths: tests/**/features/**/*.feature
         │      → Load require: tests/**/steps/**/*.ts  + tests/support/**/*.ts
         │
         ├── 2. hooks.ts: Before() hook
         │      → Launch Chromium browser (headless)
         │      → Create new page (Playwright)
         │      → Set viewport, timeout
         │
         ├── 3. Với MỖI Scenario:
         │      │
         │      ├── 3a. Match Gherkin step → Step Definition
         │      │    "User is on the OrangeHRM login page"
         │      │         → login.steps.ts: Given('User is on the OrangeHRM login page')
         │      │
         │      ├── 3b. Step Definition thực thi:
         │      │    loginPage.navigate() → Playwright mở browser → URL
         │      │    loginPage.login() → fill username → fill password → click Login
         │      │    expect(heading).toBeVisible() → kiểm tra heading Dashboard
         │      │
         │      └── 3c. hooks.ts: AfterStep()
         │           → Log "[✅/❌] step name (execution time)"
         │
         ├── 4. hooks.ts: After() hook
         │      → Capture screenshot (pass- or fail- prefix)
         │      → Save to reports/screenshots/
         │      → Close browser
         │
         └── 5. Output: cucumber-report.html + console progress
```

### Key Files Trong Execution

| File | Vai trò |
|------|---------|
| [world.ts](file:///Users/macos/Documents/PET_PROJECT/mcp-automation-test/tests/support/world.ts) | CustomWorld: tạo browser + page cho mỗi scenario |
| [hooks.ts](file:///Users/macos/Documents/PET_PROJECT/mcp-automation-test/tests/support/hooks.ts) | Before/After hooks: setup/teardown + screenshot + logging |
| [base.page.ts](file:///Users/macos/Documents/PET_PROJECT/mcp-automation-test/tests/support/base.page.ts) | Base class cho tất cả Page Objects (chứa `navigate()`) |

---

## STEP 4: Self-Healing — AI Tự Sửa Test Fail

**File**: [self-healing.ts](file:///Users/macos/Documents/PET_PROJECT/mcp-automation-test/ai-agent/self-healing.ts)

### Khi Test Fail, Self-Healing Engine làm gì?

```
Test FAIL
    │
    ▼
┌── parseTestError(output) ──────────────────────────────┐
│  Phân tích error output, extract:                      │
│  - scenario: "Successful login with valid credentials" │
│  - step: "User enters Admin into Username field"       │
│  - errorType: "locator_mismatch" / "timeout"           │
│  - errorMessage: "getByPlaceholder('UserName_BROKEN')" │
│  - locator: cụ thể locator nào fail                    │
└────────────────────────┬───────────────────────────────┘
                         │
                         ▼
┌── generateFix(error, pomPath, stepsPath) ──────────────┐
│  Gửi cho Gemini:                                       │
│  - Error summary (structured)                          │
│  - Current POM code                                    │
│  - Current Steps code                                  │
│  - Instructions: "Fix the broken locator"              │
│                                                        │
│  Gemini trả về JSON:                                   │
│  {"pomFile": "...fixed code...", "stepsFile": null}     │
└────────────────────────┬───────────────────────────────┘
                         │
                         ▼
┌── applyFix(fix, pomPath, stepsPath) ──────────────────┐
│  - Backup file gốc (.bak)                             │
│  - Ghi code mới từ AI                                  │
│  - Log diff: "- L11: getByPlaceholder('BROKEN')"       │
│              "+ L11: getByPlaceholder('Username')"      │
└────────────────────────┬───────────────────────────────┘
                         │
                         ▼
               Re-run tests
               ├── PASS → ✅ Self-healed!
               └── FAIL → Loop lại (max 3 lần)
```

### Demo Self-Healing

```bash
npm run heal:demo
```

**Script** [test-self-healing.ts](file:///Users/macos/Documents/PET_PROJECT/mcp-automation-test/ai-agent/test-self-healing.ts) thực hiện:

```
1. Save original login.page.ts
2. Break locators:
   Username → UserName_BROKEN
   Password → Passwd_BROKEN
3. Run tests → ❌ FAIL (OK, expected)
4. Self-healing loop:
   AI diagnoses → generates fix JSON → applies fix
   - L11: getByPlaceholder('UserName_BROKEN')
   + L11: getByPlaceholder('Username')
5. Re-run tests → ✅ PASS
6. Restore original file
```

---

## 📁 Config Files — Kết Nối Mọi Thứ

### `ai-agent/config.ts` — Gemini API

```typescript
// Load API key from .env.local
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// callLLM gửi prompt → Gemini → nhận response
// Auto-retry 3 lần nếu bị rate limit (429)
callLLM(systemPrompt, userPrompt) → string
```

### `cucumber.js` — Cucumber Config

```javascript
{
  paths: ['tests/**/features/**/*.feature'],     // Tìm feature files
  require: ['tests/**/steps/**/*.ts',             // Tìm step definitions
             'tests/support/**/*.ts'],            // + hooks + world
  format: ['progress', 'html:reports/...html',    // Output format
            'rerun:reports/@rerun.txt'],           // Save failed tests
  timeout: 60000                                  // 60s per step
}
```

### `.env.local` — Environment

```env
BASE_URL=https://opensource-demo.orangehrmlive.com
GEMINI_API_KEY=your-key-here
GEMINI_MODEL=gemini-2.5-flash
HEADLESS=true
```

---

## 🔗 Dependency Flow — Ai Gọi Ai?

```
cli.ts ──────────────────────────────────────────────┐
  │                                                   │
  ├── orchestrator.ts                                 │
  │     ├── config.ts (callLLM → Gemini API)          │
  │     ├── prompts/generate-gherkin.md               │
  │     ├── prompts/generate-pom.md                   │
  │     ├── prompts/generate-steps.md                 │
  │     └── cucumber-js (execSync)                    │
  │           ├── cucumber.js (config)                │
  │           ├── tests/support/world.ts (browser)    │
  │           ├── tests/support/hooks.ts (lifecycle)  │
  │           ├── tests/**/features/*.feature         │
  │           ├── tests/**/steps/*.steps.ts            │
  │           └── tests/**/pages/*.page.ts             │
  │                 └── tests/support/base.page.ts     │
  │                                                   │
  └── self-healing.ts                                 │
        ├── config.ts (callLLM → Gemini API)          │
        └── cucumber-js (execSync, re-run)            │
```

---

## 📊 Files Summary

| Layer | File | Mục đích |
|-------|------|----------|
| **Entry** | `ai-agent/cli.ts` | CLI entry, parse args, route to correct function |
| **AI** | `ai-agent/config.ts` | Gemini API wrapper, retry logic |
| **AI** | `ai-agent/orchestrator.ts` | 3-step pipeline + self-heal loop |
| **AI** | `ai-agent/self-healing.ts` | Error parser, fix generator, diff logger |
| **AI** | `ai-agent/prompts/*.md` | System prompts for code generation |
| **Test** | `tests/support/world.ts` | Playwright browser lifecycle |
| **Test** | `tests/support/hooks.ts` | Before/After + screenshot + logging |
| **Test** | `tests/support/base.page.ts` | Base POM with `navigate()` |
| **Test** | `tests/auth/**` | Login module (feature + pages + steps + fixtures) |
| **Test** | `tests/pim/**` | Employee module (create + search) |
| **Config** | `cucumber.js` | Cucumber runner config |
| **Config** | `.env.local` | API keys, URLs |
| **Input** | `requirements/*.md` | Business requirements (tiếng Anh) |
| **Output** | `reports/` | HTML report + screenshots |
