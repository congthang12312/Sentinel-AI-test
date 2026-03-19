# Phase 03: First Scenario — Login Flow (E2E)

**Status**: `[ ]` pending
**Effort**: 2-3 days
**Dependencies**: Phase 02 completed

## Overview

Chạy pipeline end-to-end lần đầu tiên với 1 scenario: **Login Flow**. Đây là bài test quan trọng nhất — chứng minh toàn bộ flow hoạt động từ requirement → Gherkin → code → test pass.

## Requirements

- Phase 01 scaffold complete
- Phase 02 orchestrator functional
- SUT login page accessible
- Test credentials available in `fixtures/login/`

## Implementation Steps

### 3.1 Prepare Login Requirement

Ensure `requirements/login-flow.md` contains:
- User story with acceptance criteria
- Happy path + error cases
- Specific UI element names (Vietnamese)

### 3.2 Prepare Login Fixtures

**`fixtures/login/valid-credentials.json`**:
```json
{
  "email": "admin@kit.com",
  "password": "TestPass123!",
  "expectedDashboardUrl": "/dashboard",
  "expectedWelcomeText": "Chào mừng"
}
```

**`fixtures/login/invalid-credentials.json`**:
```json
{
  "email": "wrong@kit.com",
  "password": "wrongpass",
  "expectedErrorText": "Sai mật khẩu"
}
```

### 3.3 Run Pipeline Step 1: Generate Gherkin

```bash
npx ts-node ai-agent/cli.ts requirements/login-flow.md --step=1
```

**Expected output** — `features/login.feature`:
```gherkin
Feature: User Login
  As a KIT user
  I want to log in with my email and password
  So that I can access the dashboard

  Scenario: Successful login with valid credentials
    Given I am on the login page
    When I enter email "admin@kit.com" and password "TestPass123!"
    And I click the login button
    Then I should be redirected to the dashboard
    And I should see the welcome message

  Scenario: Failed login with wrong password
    Given I am on the login page
    When I enter email "wrong@kit.com" and password "wrongpass"
    And I click the login button
    Then I should see error message "Sai mật khẩu"
```

**Validation**: Review .feature file — Gherkin syntax correct?

### 3.4 Run Pipeline Step 2: Generate Steps + POM

```bash
npx ts-node ai-agent/cli.ts requirements/login-flow.md --step=2
```

AI sẽ:
1. Connect Playwright MCP → open SUT login page
2. Get Accessibility Tree snapshot
3. Generate `src/pages/login.page.ts` from snapshot
4. Generate `src/steps/login.steps.ts` from .feature

**Validation**: Review generated code:
- Locators sử dụng `getByRole()`/`getByLabel()` (không CSS)?
- Test data loaded từ fixtures (không hardcode)?
- Step definitions dùng Cucumber Expressions?

### 3.5 Run Pipeline Step 3: Execute Tests

```bash
npx ts-node ai-agent/cli.ts requirements/login-flow.md --step=3
# OR run directly:
npx cucumber-js --format html:reports/cucumber-report.html
```

### 3.6 Debug & Fix (Manual + AI)

If tests fail:
1. Review error output
2. Check Playwright trace viewer: `npx playwright show-report`
3. Fix locators if needed (AI can re-generate with error context)
4. Re-run until pass

### 3.7 Run Full Pipeline (All Steps)

```bash
npx ts-node ai-agent/cli.ts requirements/login-flow.md
# Runs Step 1 → 2 → 3 sequentially
```

## Todo List

- [ ] 3.1 Prepare login requirement file
- [ ] 3.2 Prepare login fixtures (valid + invalid)
- [ ] 3.3 Run Step 1 — validate Gherkin output
- [ ] 3.4 Run Step 2 — validate Steps + POM output
- [ ] 3.5 Run Step 3 — execute Cucumber tests
- [ ] 3.6 Debug until login test passes
- [ ] 3.7 Full pipeline runs end-to-end successfully

## Success Criteria

- [ ] Gherkin `.feature` file generated correctly from requirement
- [ ] Step definitions compile without TypeScript errors
- [ ] POM uses `getByRole()`/`getByLabel()` locators (not CSS classes)
- [ ] Test data loaded from `fixtures/` (not hardcoded)
- [ ] At least 1 scenario (happy path login) **PASSES** via Cucumber
- [ ] HTML report generated at `reports/cucumber-report.html`

## Risk Assessment

| Risk | Impact | Mitigation |
|---|---|---|
| SUT login page not accessible | Blocker | Use public demo app (e.g., SauceDemo) as fallback |
| AI generates wrong locators | High | Accessibility Tree + locator priority rules in prompt |
| Cucumber step matching fails | High | Use Cucumber Expressions, provide exact examples |
| Login flow requires 2FA/CAPTCHA | High | Use test account without 2FA, or skip captcha in test env |
