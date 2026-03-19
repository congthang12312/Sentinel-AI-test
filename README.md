# AI-Powered Automation Testing Framework

> AI reads requirements → generates BDD Gherkin → generates Playwright code → executes tests → self-heals on failure.

## 🏗️ Architecture

```
                    ┌─── Step 0: Jira MCP ─── Fetch requirement from ticket
                    │
Requirements (.md) ─┼─── Step 1: Gemini API ─── Generate Gherkin (.feature)
                    │
                    ├─── Step 2: Gemini API + Playwright MCP ─── Generate Page Objects + Steps (.ts)
                    │
                    ├─── Step 3: Playwright Test ─── Execute tests
                    │
                    └─── Step 4: Self-Healing ─── AI auto-fixes broken locators (max 3 retries)
```

**Two independent pipelines:**
- **`make test`** — Run tests (pure Playwright, no AI, no API key needed)
- **`make ai-gen`** — AI generates test code from requirements (needs `GEMINI_API_KEY`)

---

## 📋 Prerequisites

### Option A: Run Locally

| Tool | Version | Install | Check |
|------|---------|---------|-------|
| Node.js | >= 20.x | [nodejs.org](https://nodejs.org/) or `brew install node` | `node -v` |
| npm | >= 10.x | _(included with Node.js)_ | `npm -v` |
| Make | any | _(pre-installed on macOS/Linux)_ | `make --version` |
| Docker | Latest | [docker.com](https://www.docker.com/) _(only for Allure report)_ | `docker --version` |

### Option B: Run with Docker Only

| Tool | Version | Install | Check |
|------|---------|---------|-------|
| Docker & Docker Compose | Latest | [docker.com](https://www.docker.com/) | `docker compose version` |

> **Tip:** Docker mode requires **no Node.js installation** — everything runs inside the container.

---

## 🚀 Getting Started

### Option A: Local Setup

```bash
# 1. Clone
git clone https://github.com/congthang12312/Sentinel-AI-test.git
cd Sentinel-AI-test

# 2. Install dependencies + Playwright browsers
make install            # or: npm install && npx playwright install chromium

# 3. Create environment file
cp .env.example .env.local
# Edit .env.local with your credentials (see Environment Variables below)

# 4. Run all tests
make test

# 5. View report
make report-docker
# → http://localhost:5050/allure-docker-service/projects/default/reports/latest/index.html
```

### Option B: Docker Setup (zero local dependencies)

```bash
# 1. Clone
git clone https://github.com/congthang12312/Sentinel-AI-test.git
cd Sentinel-AI-test

# 2. Create environment file
cp .env.example .env.local

# 3. Run all tests in Docker
make docker-test

# 4. View report
# → http://localhost:5050/allure-docker-service/projects/default/reports/latest/index.html
```

---

## ⚡ Useful Commands Cheatsheet

### 🧪 Run Tests (Local)

```bash
make test                        # Run ALL tests
make test mod=auth               # Run tests for a specific module
make test tag=@smoke             # Run tests matching a tag
make test mod=auth tag=@e2e      # Combine module + tag filter
make test-headed                 # Run with visible browser
make test-ui                     # Run in Playwright UI mode (interactive)
```

### 🐳 Run Tests (Docker)

```bash
make docker-test                 # Run ALL tests inside Docker container
make stop-report                 # Stop Allure server & remove containers
```

### 🧹 Docker Cleanup

```bash
docker compose down --remove-orphans          # Stop all services
docker compose down --rmi all --volumes       # Stop + remove images & volumes
docker system prune -f                        # Remove unused containers/images/networks
```

### 📊 Reports

```bash
make report                      # Open Playwright HTML report (local)
make report-docker               # Start Allure report server (Docker)
make stop-report                 # Stop all Docker services
```

### 🤖 AI Pipeline (requires `GEMINI_API_KEY` in `.env.local`)

```bash
make ai-gen req=login-flow.md mod=auth    # Generate test from requirement file
make ai-gen req=PIM-123 mod=pim           # Generate test from Jira ticket (via MCP)
make ai-heal req=login-flow.md            # AI self-healing for failing tests
```

### 🔧 Code Quality & Utilities

```bash
make install                     # Install npm deps + all Playwright browsers
make compile                     # TypeScript type-check (src only)
make compile-ai                  # TypeScript type-check (src + ai-agent)
make check                       # Auto-fix: Prettier + ESLint
make clean                       # Remove all reports and generated files
```

---

## 📁 Project Structure

```
mcp-automation-test/
├── src/                             # 🧪 Test Code (Playwright BDD)
│   ├── features/                    #   Gherkin feature files
│   │   └── auth/login.feature
│   ├── tests/                       #   Step definitions + Page Objects
│   │   └── auth/
│   │       ├── steps/login.steps.ts
│   │       └── pages/login.page.ts
│   ├── support/                     #   Framework infrastructure
│   │   ├── base.page.ts             #     Base page object
│   │   ├── hooks.ts                 #     After hook (screenshot → Allure)
│   │   └── console-reporter.ts      #     Custom terminal reporter
│   └── fixtures/                    #   Test data per environment
│       ├── index.ts
│       ├── dev/data.json
│       ├── staging/data.json
│       └── uat/data.json
│
├── ai-agent/                        # 🤖 AI Code Generator (dev-time only)
│   ├── cli.ts                       #   CLI entry point
│   ├── orchestrator.ts              #   3-step pipeline
│   ├── config.ts                    #   Gemini API config
│   ├── self-healing.ts              #   Auto-fix failing tests
│   ├── jira-mcp-client.ts           #   🔌 MCP: Jira ticket fetching
│   ├── mcp-servers/playwright/      #   🔌 MCP: Playwright browser for AI
│   └── prompts/                     #   LLM system prompts
│
├── requirements/                    # 📋 Business requirements (input for AI)
│   └── login-flow.md
│
├── playwright.config.ts             # Playwright + BDD + reporter config
├── Makefile                         # All commands
├── docker-compose.yml               # Allure server + Docker test runner
├── Dockerfile                       # Docker image for running tests
└── .env.example                     # Environment template (copy to .env.local)
```

### Adding a New Module

```
src/
├── features/<module>/<name>.feature     # Gherkin scenarios
└── tests/<module>/
    ├── steps/<name>.steps.ts            # Step definitions
    └── pages/<name>.page.ts             # Page Object Model
```

1. Create the folder structure under `src/tests/<module>/`
2. Add `.feature` file under `src/features/<module>/`
3. Pages extend `../common/base.page.ts`
4. Add test data in `src/fixtures/<env>/data.json`

---

## 🔧 Environment Variables

Create `.env.local` with the following:

```bash
cp .env.example .env.local
```

### Required (for running tests)

| Variable | Value | Description |
|----------|-------|-------------|
| `BASE_URL` | `https://opensource-demo.orangehrmlive.com` | Target application URL |
| `SUT_USERNAME` | `Admin` | Login username |
| `SUT_PASSWORD` | `admin123` | Login password |

> These are pre-filled with [OrangeHRM demo site](https://opensource-demo.orangehrmlive.com) credentials. No signup needed.

### Optional — AI Pipeline (`make ai-gen` / `make ai-heal`)

| Variable | Example | Description |
|----------|---------|-------------|
| `AI_PROVIDER` | `gemini` | AI provider (gemini / anthropic / openai) |
| `GEMINI_API_KEY` | `AIzaSy...` | Google Gemini API key |
| `GEMINI_MODEL` | `gemini-3.1-flash-lite-preview` | Model to use |

**How to get `GEMINI_API_KEY`:**
1. Go to [Google AI Studio](https://aistudio.google.com/apikey)
2. Sign in with your Google account
3. Click **"Create API Key"**
4. Copy the key → paste into `.env.local`

### Optional — Jira Integration (for generating tests from Jira tickets)

| Variable | Example | Description |
|----------|---------|-------------|
| `JIRA_URL` | `https://your-site.atlassian.net` | Jira instance URL |
| `JIRA_USERNAME` | `email@company.com` | Jira account email |
| `JIRA_API_TOKEN` | `ATATT3x...` | Jira API token |

**How to get `JIRA_API_TOKEN`:**
1. Go to [Atlassian API Tokens](https://id.atlassian.com/manage-profile/security/api-tokens)
2. Click **"Create API token"**
3. Give it a label (e.g. `sentinel-ai`)
4. Copy the token → paste into `.env.local`

> **Note:** Running tests (`make test`) does **NOT** require any API keys. Only the AI pipeline (`make ai-gen`, `make ai-heal`) needs `GEMINI_API_KEY`.

---

## 🏥 Self-Healing Flow

```
Test Fails → Parse Error → AI Diagnoses Root Cause
     ↑                            │
     │                    Generate Code Fix (POM / Steps)
     │                            │
     └──── Max 3 retries ─────── Re-run Tests
```

---

## 🛠️ Tech Stack

| Category | Technology |
|----------|-----------|
| **Runtime** | Node.js 20+ / TypeScript 5.9 |
| **Test Runner** | Playwright 1.58 |
| **BDD** | playwright-bdd (Gherkin → Playwright) |
| **AI** | Google Gemini (code generation + self-healing) |
| **MCP** | Jira MCP Server + Playwright MCP Server |
| **Reports** | Allure (Docker) + Playwright HTML |
| **Docker** | Docker Compose (Allure server + test runner) |
| **Lint** | ESLint + Prettier + Husky |

