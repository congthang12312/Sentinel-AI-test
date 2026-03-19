# MCP Architecture Refactoring Plan

## 1. Goal Description
The objective is to transition the current POC automation pipeline into a production-ready, modular architecture leveraging the Model Context Protocol (MCP). Currently, Playwright automation functions are tightly coupled with the Gemini AI agent. By adopting a strict MCP Server/Client model, we can achieve:
- **Decoupling**: The AI Agent (Client) logic is separated from the execution environment (Server).
- **Reusability**: The Playwright MCP Server can be consumed by other LLM clients (Cursor, Claude Desktop, etc.).
- **Scalability**: We can easily add new capabilities (e.g., File System access, Database access) by simply connecting to new MCP Servers.

## 2. Architecture Review: Server vs Client

### MCP Clients
These components will **consume** tools from MCP Servers.
1. **Agent Orchestrator (`ai-agent/orchestrator.ts`)**: The brain of the operation. It will initialize MCP Clients to connect to various MCP Servers, aggregate the tools, and provide them to Gemini.
2. **Self-Healing Agent (`ai-agent/self-healing.ts`)**: Will also act as an MCP Client to use File System tools and Playwright tools for debugging test failures.

### MCP Servers
These components will **provide** tools to the MCP Clients.
1. **Jira MCP Server** (External): 
   - We are already using this correctly via `jira-mcp-client.ts` which spawns `npx @aashari/mcp-server-atlassian-jira`.
2. **Playwright Test Execution MCP Server** (NEW - Internal):
   - We need to refactor `ai-agent/mcp-playwright.ts` into a standalone standard MCP Server.
   - It will run as an independent process (e.g., via `stdio` transport) and expose tools like `browser_navigate`, `browser_click`, `browser_fill`, `browser_get_dom`, `browser_get_accessibility_tree`.
3. **File System MCP Server** (External/Ready-to-use):
   - To allow the `self-healing.ts` agent to edit `.spec.ts` files safely, we can integrate the official `@modelcontextprotocol/server-filesystem` MCP Server instead of writing custom Node `fs` logic.

## 3. Proposed Changes

### Phase 1: Build Playwright MCP Server
Create a new isolated package/folder for the internal Playwright MCP Server.

#### [NEW] `ai-agent/mcp-servers/playwright/index.ts`
Implement an `@modelcontextprotocol/sdk/server` instance exposing Playwright capabilities as standard MCP tools.
#### [NEW] `ai-agent/mcp-servers/playwright/package.json`
Dependencies for the standalone server (Playwright, MCP SDK, Zod).
#### [DELETE] `ai-agent/mcp-playwright.ts`
Remove the old hardcoded Gemini function caller once the new MCP server is ready.

### Phase 2: Update Orchestrator to use MCP Client
#### [MODIFY] `ai-agent/orchestrator.ts`
Instead of directly instantiating `PlaywrightContext`, use `@modelcontextprotocol/sdk/client` to spawn and connect to our new Playwright MCP Server over `stdio`. Convert the received MCP Tools into Gemini Function Declarations dynamically.

### Phase 3: Integrate File System MCP (For Self-Healing)
#### [MODIFY] `ai-agent/self-healing.ts`
Set up an MCP Client connecting to `npx -y @modelcontextprotocol/server-filesystem ./src/tests` to allow the LLM to inspect and fix test files securely.

## 4. User Review Required
> [!IMPORTANT]
> - Do you want to proceed with **Phase 1** (Building the Playwright MCP Server from scratch inside this repository)?
> - Alternatively, we can structure the new MCP server as a completely separate Node package outside this `ai-agent` folder. What is your preference?

## 5. Verification Plan
### Automated Tests
- Run `npm run pipeline:login` after Phase 2 to ensure the AI can still navigate and test the UI using the new MCP-based Playwright Server.
### Manual Verification
- We can connect Claude Desktop to our new local Playwright MCP Server to verify it works independently of our Gemini orchestrator.
