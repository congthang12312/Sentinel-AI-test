import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema, Tool } from '@modelcontextprotocol/sdk/types.js';
import { chromium, Browser, Page } from 'playwright';
import { z } from 'zod';

// Validate zod and return errors string if invalid
function validateInput<T>(schema: z.ZodType<T>, data: unknown): T {
    const result = schema.safeParse(data);
    if (!result.success) {
        throw new Error(`Invalid input: ${result.error.message}`);
    }
    return result.data;
}

class PlaywrightMCPServer {
    private server: Server;
    private browser: Browser | null = null;
    private page: Page | null = null;

    constructor() {
        this.server = new Server(
            {
                name: 'playwright-mcp-server',
                version: '1.0.0',
            },
            {
                capabilities: {
                    tools: {},
                },
            },
        );

        this.setupToolHandlers();
    }

    private async ensureBrowser() {
        if (!this.browser) {
            console.error('Launching Playwright browser...');
            this.browser = await chromium.launch({ headless: true });
            const context = await this.browser.newContext();
            this.page = await context.newPage();
            this.page.setDefaultTimeout(15000);
        }
        return this.page!;
    }

    private setupToolHandlers() {
        this.server.setRequestHandler(ListToolsRequestSchema, async () => {
            const tools: Tool[] = [
                {
                    name: 'playwright_navigate',
                    description: 'Navigate the Playwright browser to a specific URL.',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            url: {
                                type: 'string',
                                description: 'The URL to navigate to (e.g. https://example.com/login)',
                            },
                        },
                        required: ['url'],
                    },
                },
                {
                    name: 'playwright_get_dom',
                    description:
                        'Get the current HTML DOM of the page. Use this to inspect the page structure and find locators if the accessibility tree is insufficient.',
                    inputSchema: {
                        type: 'object',
                        properties: {},
                    },
                },
                {
                    name: 'playwright_get_accessibility_tree',
                    description:
                        'Get the Playwright accessibility snapshot (Accessibility Tree) of the current page. This is highly recommended for building resilient page objects as it maps exactly to getByRole() and getByLabel() locators.',
                    inputSchema: {
                        type: 'object',
                        properties: {},
                    },
                },
            ];

            return { tools };
        });

        this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
            const { name, arguments: args } = request.params;

            try {
                const page = await this.ensureBrowser();

                switch (name) {
                    case 'playwright_navigate': {
                        const schema = z.object({ url: z.string().url() });
                        const { url } = validateInput(schema, args);

                        await page.goto(url, { waitUntil: 'load' });
                        await page.waitForTimeout(1000);

                        return {
                            content: [{ type: 'text', text: `Successfully navigated to ${url}` }],
                        };
                    }

                    case 'playwright_get_dom': {
                        const html = await page.evaluate(() => {
                            const doc = (globalThis as any).document;
                            const clone = doc.body.cloneNode(true) as typeof doc.body;
                            clone
                                .querySelectorAll(
                                    'script, style, svg, noscript, [aria-hidden="true"], [hidden], [style*="display: none"]',
                                )
                                .forEach((el: unknown) => (el as { remove: () => void }).remove());
                            return clone.innerHTML;
                        });

                        const truncatedHtml =
                            html.length > 50000 ? html.substring(0, 50000) + '\\n... (DOM TRUNCATED)' : html;

                        return {
                            content: [{ type: 'text', text: truncatedHtml }],
                        };
                    }

                    case 'playwright_get_accessibility_tree': {
                        const snapshot = await (
                            page as unknown as { accessibility: { snapshot: () => Promise<unknown> } }
                        ).accessibility.snapshot();

                        const treeStr = JSON.stringify(snapshot, null, 2);
                        const truncatedTree =
                            treeStr.length > 30000 ? treeStr.substring(0, 30000) + '\\n... (TREE TRUNCATED)' : treeStr;

                        return {
                            content: [{ type: 'text', text: truncatedTree }],
                        };
                    }

                    default:
                        throw new Error(`Unknown tool: ${name}`);
                }
            } catch (error) {
                const message = error instanceof Error ? error.message : String(error);
                return {
                    content: [{ type: 'text', text: `Error: ${message}` }],
                    isError: true,
                };
            }
        });
    }

    public async run() {
        const transport = new StdioServerTransport();
        await this.server.connect(transport);
        console.error('Playwright MCP Server running on stdio');
    }
}

const server = new PlaywrightMCPServer();
server.run().catch((error) => {
    console.error('Fatal error running server:', error);
    process.exit(1);
});
