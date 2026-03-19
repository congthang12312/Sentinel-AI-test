import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import * as path from 'path';

// Load environment variables locally if not already loaded
import * as dotenv from 'dotenv';
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

export async function fetchJiraRequirement(ticketId: string): Promise<string> {
    const jiraUrl = process.env.JIRA_URL || process.env.JIRA_BASE_URL;
    const jiraEmail = process.env.JIRA_USERNAME || process.env.JIRA_EMAIL;
    const jiraToken = process.env.JIRA_API_TOKEN;

    if (!jiraUrl || !jiraEmail || !jiraToken) {
        throw new Error(
            'Jira configuration missing. Please check JIRA_URL, JIRA_USERNAME, and JIRA_API_TOKEN in your .env or .env.local file.',
        );
    }

    const transport = new StdioClientTransport({
        command: 'npx',
        args: ['-y', '@aashari/mcp-server-atlassian-jira'],
        env: {
            ...process.env,
            ATLASSIAN_SITE_NAME: (jiraUrl as string).replace(/^https?:\/\//, '').split('.')[0],
            ATLASSIAN_USER_EMAIL: jiraEmail,
            ATLASSIAN_API_TOKEN: jiraToken,
        },
    });

    const client = new Client({ name: 'automation-test-client', version: '1.0.0' }, { capabilities: {} });

    console.log(`🔌 Kết nối tới Jira MCP Server để lấy ticket: ${ticketId}...`);
    await client.connect(transport);

    try {
        const result: any = await client.callTool({
            name: 'jira_get',
            arguments: {
                path: `/rest/api/3/issue/${ticketId}`,
                queryParams: {
                    fields: 'summary,description',
                },
                jq: '{key: key, summary: fields.summary, description: fields.description}',
                outputFormat: 'json',
            },
        });

        if (!result || !result.content || result.content.length === 0) {
            throw new Error('Không nhận được dữ liệu từ Jira MCP Server.');
        }

        const issueData = JSON.parse(result.content[0].text);

        const summary = issueData.summary || 'No Summary';
        let description = '';

        if (issueData.description && typeof issueData.description === 'object') {
            description = JSON.stringify(issueData.description, null, 2);
        } else {
            description = issueData.description || 'No Description';
        }

        let requirementText = `# [${ticketId}] ${summary}\n\n`;
        requirementText += `## Requirement Detail:\n${description}\n`;

        console.log(`✅ Lấy thành công requirement từ Jira!`);
        return requirementText;
    } catch (error: Error | unknown) {
        console.error('❌ Lỗi khi lấy Jira Ticket qua MCP:', error instanceof Error ? error.message : String(error));
        throw error;
    } finally {
        await transport.close();
    }
}
