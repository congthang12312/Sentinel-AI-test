# AI-Powered Automation Testing POC — Brainstorm Report

**Date**: 2026-03-14
**Status**: Final — Approach A Selected (Revised v2)
**Decision**: Full BDD Pipeline (Gherkin → Cucumber → POM → Playwright)
**Revision**: v2 — Added Orchestration Layer, DOM Strategy, Test Data Management

---

## Problem Statement

KIT cần POC chứng minh **toàn bộ flow** AI-Powered Automation Testing: AI tự động sinh Gherkin test cases + mã nguồn Playwright từ yêu cầu nghiệp vụ, sử dụng MCP để kết nối nguồn dữ liệu và CI/CD để thực thi tự động.

### Requirements
| Item | Detail |
|---|---|
| **SUT** | Web app KIT (hoặc demo app tương đương) |
| **Test type** | E2E UI Testing (Playwright) + TypeScript |
| **Scope** | 3-5 critical scenarios (login, CRUD, reports) |
| **LLM** | Claude 3.5 Sonnet / GPT-4o (Azure OpenAI) |
| **BDD** | Gherkin Given-When-Then + Cucumber + POM |
| **MCP** | Jira/Confluence (local files as fallback) + Playwright MCP |
| **CI/CD** | Azure DevOps pipeline + HTML reports |
| **Timeline** | 3 tuần |

---

## 🏆 Selected: Approach A — Full BDD Pipeline

> POC phải demo đầy đủ flow theo đúng kiến trúc đề xuất, không cắt giảm.

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    AI Agent (LLM + IDE)                      │
│          Claude 3.5 Sonnet / GPT-4o / Azure OpenAI          │
└──────┬──────────┬──────────────┬────────────────┬───────────┘
       │          │              │                │
   ┌───▼───┐  ┌──▼───┐  ┌──────▼──────┐  ┌──────▼──────┐
   │ Jira  │  │Confl.│  │ Playwright  │  │  File System │
   │  MCP  │  │ MCP  │  │    MCP      │  │    MCP       │
   └───┬───┘  └──┬───┘  └──────┬──────┘  └──────┬──────┘
       │         │              │                │
       ▼         ▼              ▼                ▼
  User Stories  Specs     Browser Actions    Local Reqs
       │         │              │                │
       └─────────┴──────┬──────┴────────────────┘
                        │
              ┌─────────▼─────────┐
              │   Step 1: Generate │
              │  .feature (Gherkin)│
              └─────────┬─────────┘
                        │
              ┌─────────▼─────────┐
              │   Step 2: Generate │
              │  Step Defs + POM   │
              │  (.ts files)       │
              └─────────┬─────────┘
                        │
              ┌─────────▼─────────┐
              │   Step 3: Run      │
              │  npx cucumber-js   │
              │  + Playwright      │
              │  (Local validate)  │
              └─────────┬─────────┘
                        │
              ┌─────────▼─────────┐
              │   Step 4: CI/CD    │
              │  Azure DevOps      │
              │  → HTML Report     │
              └───────────────────┘
```

### Full Tech Stack

```
Core:
  @cucumber/cucumber    — BDD runner (Gherkin parser)
  @playwright/test      — Browser automation engine
  typescript            — Type-safe test code
  ts-node               — Runtime TypeScript execution

Orchestration:
  Custom CLI (TypeScript) — Pipeline runner (Step 1→2→3→4)
  ai-agent/orchestrator.ts — Sequential step execution

BDD Layer:
  .feature files        — Gherkin scenarios (Given-When-Then)
  Step Definitions      — Cucumber step implementations
  World class           — Shared context (browser, page, POM instances)

Page Object Model:
  BasePage              — Common methods (navigate, waitFor, screenshot)
  LoginPage             — Login-specific selectors & actions
  DashboardPage         — Dashboard selectors & actions
  ...per page

MCP Servers:
  Playwright MCP        — Browser interaction + Accessibility Tree snapshots
  Local File MCP        — Read requirements from markdown/JSON
  (Jira MCP)            — Atlassian official (post-POC or if available)
  (Confluence MCP)      — Atlassian official (post-POC or if available)

Test Data:
  fixtures/             — Test data per scenario (JSON)
  .env                  — Environment-specific config (URLs, credentials)

Reports:
  cucumber-html-reporter — Cucumber HTML reports
  @playwright/test      — Trace viewer for debugging

CI/CD:
  Azure DevOps Pipeline — Auto-run on push
  (GitHub Actions)      — Fallback if Azure DevOps not ready
```

---

## Critical Component: Orchestration Layer

> ⚠️ "Ai/cái gì lấy .feature từ Step 1 đưa làm input cho Step 2?" — Đây là điểm mù quan trọng nhất cần giải quyết.

### Options Analysis

| Option | Pros | Cons | Verdict |
|---|---|---|---|
| **A: LangChain/LangGraph** | Industry standard, state management, tool binding | Overkill cho POC, Python-centric, heavy dependency | ❌ Quá phức tạp |
| **B: CrewAI** | Multi-agent, role-based, sequential process | Python only, learning curve, thêm 1 runtime | ❌ Không cần multi-agent cho POC |
| **C: Custom TypeScript CLI** ⭐ | Nhẹ, full control, cùng ngôn ngữ với Playwright, dễ debug | Tự maintain, không có sẵn features | ✅ **Chọn cho POC** |
| **D: IDE-based (Cursor/Claude)** | Không cần code orchestrator, manual trigger | Không tự động hóa được, không CI/CD | ❌ Chỉ demo, không production |

### Recommended: Custom TypeScript CLI Orchestrator

```typescript
// ai-agent/orchestrator.ts
import { generateGherkin } from './steps/step1-gherkin';
import { generateCode } from './steps/step2-codegen';
import { runTests } from './steps/step3-validate';
import { pushToCI } from './steps/step4-cicd';

async function runPipeline(requirementPath: string) {
  console.log('🚀 Step 1: Generating Gherkin from requirement...');
  const featureFile = await generateGherkin(requirementPath);
  // Input: requirements/login-flow.md
  // Output: features/login.feature
  
  console.log('🔧 Step 2: Generating Step Definitions + POM...');
  const { stepsFile, pomFile } = await generateCode(featureFile);
  // Input: features/login.feature + Playwright MCP accessibility snapshot
  // Output: src/steps/login.steps.ts + src/pages/login.page.ts
  
  console.log('▶️ Step 3: Running tests locally...');
  const result = await runTests();
  // Input: all generated files
  // Output: reports/cucumber-report.html
  
  if (!result.success) {
    console.log('🔄 Self-healing: Analyzing failures...');
    // Re-run Step 2 with error context (max 3 retries)
  }
  
  console.log('📦 Step 4: Pushing to CI/CD...');
  await pushToCI();
}
```

**Tại sao không dùng LangChain/CrewAI?**
- POC chỉ cần **sequential pipeline** đơn giản (Step 1→2→3→4)
- Không cần multi-agent collaboration phức tạp
- Cùng TypeScript ecosystem với Playwright — zero language switching
- Dễ debug, dễ demo, dễ giải thích cho stakeholder
- Sau POC có thể nâng cấp lên LangGraph nếu cần branching/looping phức tạp

---

## Critical Component: DOM Extraction Strategy

> ⚠️ "HTML của React/Angular rất phức tạp, dễ tràn context window" — Đúng 100%.

### Problem

Một trang React/Angular điển hình có thể có **10,000+ DOM nodes**. Raw HTML:
- Chứa `<div>` lồng nhau vô nghĩa
- CSS classes động (`class="btn_x8z9"`, `class="css-1a2b3c"`)
- Data attributes không liên quan
- Nhanh chóng tràn context window (~128K tokens)

### Solution: Accessibility Tree Snapshots

Playwright MCP mặc định trả về **Accessibility Tree** thay vì raw HTML:

```typescript
// Playwright MCP sử dụng accessibility API
const snapshot = await page.accessibility.snapshot({
  interestingOnly: true  // ← Chỉ trả về actionable elements
});
```

**Accessibility Tree output** (gọn ~95% so với raw HTML):
```
- heading "Dashboard" [level=1]
- navigation "Main Menu"
  - link "Home"
  - link "Reports"
  - link "Settings"
- main
  - textbox "Search..." [name="search"]
  - button "Tìm kiếm"
  - table "User List"
    - row: "admin@kit.com" | "Admin" | button "Edit" | button "Delete"
```

### AI Locator Generation Strategy

Từ Accessibility Tree, AI sinh locators theo thứ tự ưu tiên:

| Priority | Locator Type | Example | Stability |
|---|---|---|---|
| 1 | `getByRole()` | `page.getByRole('button', { name: 'Đăng nhập' })` | ⭐⭐⭐⭐⭐ |
| 2 | `getByLabel()` | `page.getByLabel('Email')` | ⭐⭐⭐⭐ |
| 3 | `getByPlaceholder()` | `page.getByPlaceholder('Nhập email...')` | ⭐⭐⭐⭐ |
| 4 | `getByText()` | `page.getByText('Chào mừng')` | ⭐⭐⭐ |
| 5 | `getByTestId()` | `page.getByTestId('submit-btn')` | ⭐⭐⭐⭐⭐ |
| ❌ | CSS selector | `page.locator('.btn_x8z9')` | ⭐ (avoid!) |

> **Key rule cho AI prompt**: "NEVER use CSS class selectors. ALWAYS prefer getByRole() or getByLabel(). Use getByTestId() only as fallback."

---

## Critical Component: Test Data Management

> ⚠️ "CRUD cần dữ liệu đầu vào — AI hay hardcode thẳng vào script" — Đúng.

### Solution: Fixtures Pattern

```
fixtures/
├── login/
│   ├── valid-credentials.json     # { "email": "admin@kit.com", "password": "..." }
│   └── invalid-credentials.json   # { "email": "wrong", "password": "wrong" }
├── create-data/
│   ├── new-user.json              # { "name": "Test User", "role": "Editor" }
│   └── new-report.json            # { "title": "Q1 Report", "type": "financial" }
└── common/
    └── environment.json           # { "baseUrl": "https://app.kit.com" }
```

### AI Prompt Integration

```markdown
# Prompt template addition:

When generating step definitions:
- NEVER hardcode test data in step files
- ALWAYS load data from fixtures/ directory
- Use this pattern:

```typescript
import validCreds from '../../fixtures/login/valid-credentials.json';

When('I enter valid credentials', async function (this: CustomWorld) {
  await this.loginPage.login(validCreds.email, validCreds.password);
});
```

### Environment Config (.env)
```env
# .env.test
BASE_URL=https://staging.kit.com
AI_MODEL=claude-3.5-sonnet
AI_API_KEY=sk-xxx
PLAYWRIGHT_MCP_URL=http://localhost:3000
```

### Project Structure (POC) — Updated v2

```
mcp-automation-test/
├── requirements/                 # Input: business requirements
│   ├── login-flow.md            # Requirement mô tả bằng ngôn ngữ tự nhiên
│   ├── create-data-flow.md
│   └── report-flow.md
├── features/                     # Step 1 output: Gherkin files
│   ├── login.feature
│   ├── create-data.feature
│   └── report.feature
├── fixtures/                     # 🆕 Test data (không hardcode!)
│   ├── login/
│   │   ├── valid-credentials.json
│   │   └── invalid-credentials.json
│   ├── create-data/
│   │   └── new-user.json
│   └── common/
│       └── environment.json
├── src/
│   ├── steps/                    # Step 2 output: Step definitions
│   │   ├── login.steps.ts
│   │   ├── create-data.steps.ts
│   │   └── report.steps.ts
│   ├── pages/                    # Step 2 output: Page Object Model
│   │   ├── base.page.ts
│   │   ├── login.page.ts
│   │   ├── dashboard.page.ts
│   │   └── report.page.ts
│   ├── support/                  # Cucumber support files
│   │   ├── world.ts             # Custom World (browser, page context)
│   │   ├── hooks.ts             # Before/After hooks (browser lifecycle)
│   │   └── config.ts            # Environment config
│   └── utils/                    # Shared utilities
│       └── helpers.ts
├── reports/                      # Step 3 output: Test results
│   └── cucumber-report.html
├── mcp/                          # MCP server configs
│   ├── playwright-mcp.config.ts
│   └── local-file-mcp.config.ts
├── ai-agent/                     # 🆕 AI Orchestration Layer
│   ├── orchestrator.ts          # Pipeline runner (Step 1→2→3→4)
│   ├── steps/                   # Pipeline step implementations
│   │   ├── step1-gherkin.ts     # Requirement → .feature
│   │   ├── step2-codegen.ts     # .feature → Steps + POM
│   │   ├── step3-validate.ts    # Run tests + self-healing
│   │   └── step4-cicd.ts        # Push + trigger pipeline
│   ├── prompts/                  # LLM prompt templates
│   │   ├── generate-gherkin.md
│   │   ├── generate-steps.md
│   │   └── generate-pom.md
│   └── config.ts                # LLM API + MCP configuration
├── cucumber.js                   # Cucumber configuration
├── tsconfig.json
├── package.json
├── .env.test                     # 🆕 Environment config
├── azure-pipelines.yml           # Step 4: CI/CD pipeline
└── README.md
```

---

## Risk Mitigations (cho Approach A)

Approach A phức tạp nhất, nhưng có thể mitigate bằng các chiến thuật sau:

| Risk | Mitigation |
|---|---|
| **AI sinh step definitions sai regex** | Dùng **Cucumber Expressions** (không dùng regex) — syntax đơn giản hơn cho AI. Cung cấp template/examples trong prompt |
| **4 layers quá phức tạp** | **Template-driven generation**: AI sinh code từ template cố định, chỉ thay đổi business logic. Giảm sáng tạo, tăng consistency |
| **AI hardcode test data** | **Fixtures pattern** — AI bắt buộc load data từ `fixtures/*.json`, không hardcode |
| **DOM quá lớn tràn context** | **Accessibility Tree only** — Playwright MCP trả về accessible elements, không raw HTML |
| **Không rõ ai orchestrate** | **Custom TypeScript CLI** — `orchestrator.ts` chạy tuần tự Step 1→2→3→4 |
| **Debugging khó** | Playwright **trace viewer** vẫn hoạt động. Thêm screenshot-on-failure trong Cucumber hooks |
| **Setup tốn thời gian** | **Chuẩn bị sẵn boilerplate**: scaffold project structure trước, AI chỉ cần fill logic |
| **Timeline risk (3 tuần)** | Tuần 1: scaffold + 1 scenario hoàn chỉnh. Tuần 2: 2-4 scenarios + CI/CD. Tuần 3: polish + demo. **Buffer**: giảm xuống 3 scenarios nếu cần |

### Prompt Engineering Strategy

Thay vì để AI tự do sinh code, cung cấp **strict templates**:

```markdown
# Prompt: Generate Step Definitions

Given this Gherkin feature file:
{feature_content}

And this Page Object template:
{pom_template}

Generate step definitions following EXACTLY this pattern:
- Use Cucumber Expressions (NOT regex)
- Import from '../pages/{page}.page'
- Use World class for shared context
- Each step must be async/await

Example output:
```typescript
import { Given, When, Then } from '@cucumber/cucumber';
import { CustomWorld } from '../support/world';

Given('I am on the login page', async function (this: CustomWorld) {
  await this.loginPage.navigate();
});
```

> Key insight: **Template-driven prompts** giảm AI error rate từ ~40% xuống ~10% cho structured code generation.

---

## AI Agent Workflow Detail (4 Steps)

### Step 1: Requirement → Gherkin
```
Input:  requirements/login-flow.md (hoặc Jira MCP)
LLM:    Parse requirement → Generate Gherkin
Output: features/login.feature

AI Prompt Strategy:
- Cung cấp Gherkin syntax guide trong system prompt
- Giới hạn: max 5 scenarios per feature
- Enforce: Feature/Scenario/Given/When/Then structure
```

### Step 2: Gherkin → Step Definitions + POM
```
Input:  features/login.feature + POM template + fixtures/*.json
LLM:    Generate step defs + page objects
Output: src/steps/login.steps.ts + src/pages/login.page.ts

AI Prompt Strategy:
- Cung cấp BasePage class template
- Playwright MCP → Accessibility Tree snapshot (interestingOnly: true)
  → AI nhận actionable elements, KHÔNG raw HTML
  → Sinh locators: getByRole() > getByLabel() > getByTestId()
  → TUYỆT ĐỐI KHÔNG dùng CSS class selectors
- Load test data từ fixtures/ — KHÔNG hardcode
- Enforce: Cucumber Expressions (not regex)
```

### Step 3: Validate & Run Local
```
Command: npx cucumber-js --format html:reports/cucumber-report.html
If FAIL:
  - AI đọc error message
  - Playwright MCP → re-inspect page
  - AI sinh code sửa lỗi (self-healing loop, max 3 retries)
If PASS:
  - Generate report, ready for CI/CD
```

### Step 4: CI/CD (Azure DevOps)
```yaml
# azure-pipelines.yml
trigger:
  branches:
    include: [main, feature/*]

pool:
  vmImage: 'ubuntu-latest'

steps:
  - task: NodeTool@0
    inputs:
      versionSpec: '20.x'
  - script: npm ci
  - script: npx playwright install --with-deps
  - script: npx cucumber-js --format html:reports/cucumber-report.html
  - task: PublishTestResults@2
  - task: PublishPipelineArtifact@1
    inputs:
      targetPath: 'reports/'
      artifact: 'test-reports'
```

---

## LLM Configuration

| Phase | LLM | Why |
|---|---|---|
| **POC** | Claude 3.5 Sonnet (Anthropic API) | Best code gen accuracy, Gherkin understanding |
| **POC alt** | GPT-4o (Azure OpenAI) | If KIT has Azure subscription |
| **Production** | LiteLLM proxy → Azure OpenAI / Self-hosted | Security, cost control |

```
LiteLLM Proxy (Production):
  pip install 'litellm[proxy]'
  litellm --config litellm-config.yaml
  
  # Exposes OpenAI-compatible API at http://localhost:4000
  # Routes to: Azure OpenAI / Ollama / vLLM
```

---

## Success Metrics

| Metric | Target |
|---|---|
| Full flow demo (4 steps) | ✅ Requirement → Gherkin → Code → CI/CD |
| AI-generated test pass rate | > 80% first-run |
| Time per test scenario | < 5 min (vs 30-60 min manual) |
| Scenarios completed | 3-5 critical flows |
| Self-healing demo | ≥ 1 locator change auto-fixed |
| CI/CD pipeline | Auto-run + HTML report published |
| BDD readability | BA/QA can read .feature files |

---

## 3-Week Timeline

| Week | Focus | Deliverables |
|---|---|---|
| **Week 1** | Scaffold + Infrastructure | Project structure, MCP servers connected, LLM configured, 1 complete scenario (login) through full flow |
| **Week 2** | Scale + CI/CD | 2-4 more scenarios, Azure DevOps pipeline, HTML reports, self-healing demo |
| **Week 3** | Polish + Demo | Bug fixes, documentation, demo presentation, handoff package |

---

## Revision Log

| Version | Date | Changes |
|---|---|---|
| v1 | 2026-03-14 | Initial brainstorm with 3 approaches |
| v2 | 2026-03-14 | Added Orchestration Layer, DOM Strategy, Test Data Management per user feedback |

---

## Next Steps

1. ✅ Approach A confirmed (Full BDD Pipeline)
2. ✅ v2 — 3 blind spots addressed (Orchestration, DOM, Test Data)
3. → Chạy `/plan` để tạo implementation plan chi tiết cho 3 tuần
4. Setup project scaffold + dependencies
