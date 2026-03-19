# Phase 02: AI Orchestrator & MCP Integration

**Status**: `[ ]` pending
**Effort**: 3-4 days
**Dependencies**: Phase 01 completed

## Overview

Xây dựng AI Orchestrator (TypeScript CLI) và tích hợp Playwright MCP server. Đây là "bộ não" của hệ thống — kết nối LLM với MCP để thực hiện pipeline 3 bước.

## Implementation Steps

### 2.1 Setup Playwright MCP Server

```bash
# Install Playwright MCP server
npm install -D @playwright/mcp
```

Cấu hình MCP server:
```typescript
// mcp/playwright-mcp.config.ts
export const playwrightMcpConfig = {
  // Playwright MCP trả về Accessibility Tree (không raw HTML)
  snapshotMode: 'accessibility',  // KEY SETTING
  interestingOnly: true,          // Chỉ actionable elements
  viewport: { width: 1280, height: 720 },
  headless: false,                // Visible browser cho demo
};
```

### 2.2 Create LLM Client wrapper

**`ai-agent/config.ts`**:
```typescript
import Anthropic from 'anthropic';

export function createLLMClient() {
  const model = process.env.AI_MODEL || 'claude-3-5-sonnet-20241022';
  const client = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });
  return { client, model };
}

export async function callLLM(systemPrompt: string, userPrompt: string): Promise<string> {
  const { client, model } = createLLMClient();
  const response = await client.messages.create({
    model,
    max_tokens: 4096,
    system: systemPrompt,
    messages: [{ role: 'user', content: userPrompt }],
  });
  return response.content[0].type === 'text' ? response.content[0].text : '';
}
```

### 2.3 Create Prompt Templates

**`ai-agent/prompts/generate-gherkin.md`**:
```markdown
You are an expert QA Engineer. Convert the following business requirement into Gherkin BDD scenarios.

## Rules:
- Use Feature, Scenario, Given, When, Then, And
- Max 5 scenarios per feature
- Include both happy path and error cases
- Use Vietnamese for user-facing text in examples
- Be specific about UI elements

## Requirement:
{requirement_content}

## Output:
Return ONLY the .feature file content, no markdown code fence.
```

**`ai-agent/prompts/generate-steps.md`**:
```markdown
You are an expert Playwright + Cucumber automation engineer.
Generate step definitions for the following Gherkin feature.

## Rules:
- Use Cucumber Expressions (NOT regex)
- Import from '../pages/{page}.page'
- Use CustomWorld (this: CustomWorld) for shared context
- Load test data from '../../fixtures/' — NEVER hardcode
- Each step must be async/await
- Use Playwright locators: getByRole() > getByLabel() > getByTestId()
- NEVER use CSS class selectors

## Gherkin Feature:
{feature_content}

## Available Page Structure (Accessibility Tree):
{accessibility_tree}

## Available Fixtures:
{fixtures_list}

## Output:
Return ONLY TypeScript code, no markdown code fence.
```

**`ai-agent/prompts/generate-pom.md`**:
```markdown
You are an expert Playwright Page Object Model engineer.

Generate a Page Object class for the following page based on its Accessibility Tree.

## Rules:
- Extend BasePage from '../pages/base.page'
- Use Playwright locators: getByRole() > getByLabel() > getByTestId()
- NEVER use CSS class selectors (.btn_xxx, .css-xxx)
- Include only actionable elements from the Accessibility Tree
- Group related locators with comments
- Add action methods (login(), fillForm(), submitData())

## Page Accessibility Tree:
{accessibility_tree}

## Page URL:
{page_url}

## Output:
Return ONLY TypeScript code, no markdown code fence.
```

### 2.4 Create Orchestrator Pipeline

**`ai-agent/orchestrator.ts`**:
```typescript
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { callLLM } from './config';
import { getAccessibilitySnapshot } from './mcp-client';

interface PipelineResult {
  featureFile: string;
  stepsFile: string;
  pomFile: string;
  testResult: { success: boolean; output: string };
}

export async function runPipeline(requirementPath: string): Promise<PipelineResult> {
  // Step 1: Requirement → Gherkin
  console.log('🚀 Step 1: Generating Gherkin...');
  const requirement = readFileSync(requirementPath, 'utf-8');
  const gherkinPrompt = readFileSync('ai-agent/prompts/generate-gherkin.md', 'utf-8');
  const featureContent = await callLLM(
    gherkinPrompt.replace('{requirement_content}', requirement)
  );
  const featurePath = `features/${getFeatureName(requirementPath)}.feature`;
  writeFileSync(featurePath, featureContent);

  // Step 2: Gherkin → Steps + POM (using Playwright MCP)
  console.log('🔧 Step 2: Generating Steps + POM...');
  const accessibilityTree = await getAccessibilitySnapshot(targetUrl);
  // ... generate steps and POM using LLM with accessibility context

  // Step 3: Run tests
  console.log('▶️ Step 3: Running tests...');
  const testResult = await runCucumberTests();
  
  // Self-healing loop
  if (!testResult.success) {
    for (let retry = 0; retry < 3; retry++) {
      console.log(`🔄 Self-healing attempt ${retry + 1}/3...`);
      // Re-generate with error context
      // Re-run tests
    }
  }

  return { featureFile, stepsFile, pomFile, testResult };
}
```

### 2.5 Create MCP Client

**`ai-agent/mcp-client.ts`**:
```typescript
// Interface to Playwright MCP for accessibility snapshots
export async function getAccessibilitySnapshot(url: string): Promise<string> {
  // Connect to Playwright MCP server
  // Navigate to URL
  // Get accessibility tree (interestingOnly: true)
  // Return formatted tree string for LLM consumption
}
```

### 2.6 Create CLI entry point

**`ai-agent/cli.ts`**:
```typescript
import { runPipeline } from './orchestrator';

const requirementPath = process.argv[2];
if (!requirementPath) {
  console.error('Usage: npx ts-node ai-agent/cli.ts <requirement-file>');
  process.exit(1);
}

runPipeline(requirementPath)
  .then(result => {
    console.log('✅ Pipeline complete!');
    console.log(`Feature: ${result.featureFile}`);
    console.log(`Steps: ${result.stepsFile}`);
    console.log(`POM: ${result.pomFile}`);
    console.log(`Tests: ${result.testResult.success ? 'PASSED ✅' : 'FAILED ❌'}`);
  })
  .catch(err => {
    console.error('❌ Pipeline failed:', err);
    process.exit(1);
  });
```

## Todo List

- [ ] 2.1 Setup Playwright MCP server
- [ ] 2.2 Create LLM client wrapper
- [ ] 2.3 Create prompt templates (gherkin, steps, pom)
- [ ] 2.4 Create orchestrator pipeline
- [ ] 2.5 Create MCP client for accessibility snapshots
- [ ] 2.6 Create CLI entry point
- [ ] 2.7 Test: `npx ts-node ai-agent/cli.ts requirements/login-flow.md` runs without crash
- [ ] 2.8 Verify: LLM API call works (returns valid response)
- [ ] 2.9 Verify: Playwright MCP returns accessibility tree

## Success Criteria

- [ ] CLI runs end-to-end without crash
- [ ] LLM generates valid Gherkin from requirement
- [ ] Playwright MCP returns accessibility tree (not raw HTML)
- [ ] Generated file structure matches expected pattern

## Risk Assessment

| Risk | Impact | Mitigation |
|---|---|---|
| LLM API key invalid/expired | High | Check key early in pipeline, clear error message |
| Playwright MCP connection fails | High | Add timeout + retry, fallback to manual snapshot |
| LLM generates invalid Gherkin syntax | Medium | Validate with Cucumber parser before proceeding |
| Context window overflow | Medium | Accessibility Tree reduces DOM by ~95% |
