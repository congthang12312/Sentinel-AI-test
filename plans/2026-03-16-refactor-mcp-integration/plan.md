# Goal Description
The objective is to refactor the `.ai-agent` project structure to follow best practice conventions, implement a Playwright MCP server to grant the AI real-time DOM contextual awareness (fixing the "blind" generation issue), and update the prompts/steps to fully utilize this context for highly accurate Test and POM code generation.

## User Review Required
> [!IMPORTANT]
> - **Architecture Choice:** Do you prefer compiling the MCP Server as a separate standalone process that the agent connects to via `stdio`, OR integrating the MCP tools directly into the orchestrator's AI loop (using Gemini Function Calling + Playwright) to keep the setup as simple as running a single script? (The plan currently leans towards direct integration or an in-process MCP Server to keep `npm run pipeline` simple).
> - **Structure Shift:** Is moving `ai-agent/` to `src/agent/` and `tests/support/` to `src/framework/` acceptable for your architectural vision?

## Proposed Changes

### 1. Project Structure Refactoring
Organize the repository to clearly separate the AI Agent code, the Test Framework core, and the actual test cases.

#### [NEW] `src/agent/`
- Move all AI logic (`orchestrator.ts`, `self-healing.ts`, `config.ts`, `cli.ts`) from `ai-agent/` to `src/agent/`.
- Update `orchestrator.ts` to output files dynamically to `tests/<module>/pages` instead of hardcoded paths.

#### [NEW] `src/framework/`
- Move `tests/support/world.ts`, `hooks.ts`, and `base.page.ts` here.
- Update all existing step definitions and POM files in `tests/` to import from `src/framework/` instead of `tests/support/`.

#### [DELETE] `ai-agent/`
- Remove completely after successful migration.

### 2. Playwright MCP Integration
#### [MODIFY] `package.json`
- Install `@modelcontextprotocol/sdk` to build/consume the MCP Server.

#### [NEW] `src/agent/mcp-playwright.ts`
- Build a local MCP Server (or direct tool map) wrapping a Playwright browser instance.
- Provide tools: `playwright_navigate`, `playwright_get_dom`, `playwright_get_accessibility_tree`, `playwright_screenshot`.

#### [MODIFY] `src/agent/config.ts`
- Upgrade the Gemini API call to support `tools` (function calling). Bind the Playwright MCP tools so the LLM can actively fetch DOM info before writing code.

### 3. Prompt & Step Enhancements
#### [MODIFY] `src/agent/prompts/generate-pom.md`
- Instruct the LLM to call `playwright_navigate` and `playwright_get_accessibility_tree` FIRST to understand the page structure, *then* generate the `locator` elements.

#### [MODIFY] `src/agent/self-healing.ts`
- Enhance the diagnosis prompt: Ask the LLM to use the `playwright_get_dom` tool to inspect the state of the page at the exact moment the test failed, drastically improving the accuracy of the proposed fix.
- Add "Contextual Memory": inject a summary of previous failed attempts to prevent infinite retry loops.

## Verification Plan

### Automated Tests
- Run `npm run compile` to ensure there are no broken imports after refactoring.
- Run `npm run test` (Cucumber) to ensure the existing PIM and Auth tests pass with the new `src/framework` structure.

### Manual Verification
- Run `npm run pipeline:login` to verify the pipeline intelligently inspects the page using MCP tools (watch console logs) and places the generated files into `tests/auth/`.
- Run `npm run heal:demo` to verify the AI self-healer fetches the current DOM when it catches a failure, resulting in an accurate single-attempt fix.
