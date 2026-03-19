---
title: "AI-Powered Automation Testing POC"
description: "Full BDD Pipeline: AI generates Gherkin + Playwright code from requirements, runs locally"
status: pending
priority: P1
effort: 3w
branch: main
tags: [poc, ai, playwright, bdd, gherkin, cucumber, mcp]
created: 2026-03-14
---

# AI-Powered Automation Testing POC

## Overview

POC chứng minh toàn bộ flow AI-Powered Automation Testing:
1. AI đọc requirements (từ Jira/Confluence MCP hoặc local files) → sinh Gherkin `.feature` files
2. AI sinh Step Definitions + Page Object Model (POM) sử dụng Playwright MCP
3. Chạy Cucumber + Playwright test tại local, AI tự sửa lỗi (self-healing)

> **SUT**: [OrangeHRM Demo](https://opensource-demo.orangehrmlive.com) — `Admin` / `admin123`
> ⚠️ CI/CD pipeline tạm bỏ — focus chạy local trước.

## Phases

| Phase | Name | Effort | Status |
|---|---|---|---|
| 00 | [Jira/Confluence MCP & OrangeHRM Setup](./phase-00-mcp-setup.md) | 1-2 days | `[ ]` pending |
| 01 | [Project Scaffold & Infrastructure](./phase-01-scaffold.md) | 3-4 days | `[ ]` pending |
| 02 | [AI Orchestrator & MCP Integration](./phase-02-orchestrator.md) | 3-4 days | `[ ]` pending |
| 03 | [First Scenario: Login Flow (E2E)](./phase-03-first-scenario.md) | 2-3 days | `[ ]` pending |
| 04 | [Scale: 2-4 More Scenarios](./phase-04-more-scenarios.md) | 3-4 days | `[ ]` pending |
| 05 | [Self-Healing & Polish](./phase-05-self-healing.md) | 2-3 days | `[ ]` pending |

**Total estimated**: ~16-20 working days (3 weeks)

## Architecture

```
Jira/Confluence MCP  ──┐
Local files (.md)    ──┤→  AI Orchestrator  →  features/*.feature
                       │        ↓
                       │  Playwright MCP (Accessibility Tree)
                       │        ↓
                       └  src/steps/*.steps.ts + src/pages/*.page.ts
                                ↓
                          npx cucumber-js (local run on OrangeHRM)
                                ↓
                          reports/cucumber-report.html
                                ↓
                          [If FAIL] → Self-healing loop (max 3 retries)
```

- **SUT**: OrangeHRM Demo (`https://opensource-demo.orangehrmlive.com`)
- **Orchestrator**: Custom TypeScript CLI (not LangChain/CrewAI)
- **Context Sources**: Jira/Confluence MCP + local file fallback
- **DOM Strategy**: Accessibility Tree via Playwright MCP (not raw HTML)
- **Test Data**: `fixtures/` JSON files (not hardcoded)
- **LLM**: Claude 3.5 Sonnet or GPT-4o
- **Locators**: `getByRole()` > `getByLabel()` > `getByTestId()` (never CSS classes)

## Unresolved Questions
1. LLM API key: đã có sẵn Anthropic/Azure OpenAI key chưa?
2. Jira/Confluence: có access Atlassian Cloud tại KIT không? (nếu không → dùng local files)
