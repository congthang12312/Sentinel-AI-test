import {
    GoogleGenerativeAI,
    HarmCategory,
    HarmBlockThreshold,
    Part,
    FunctionDeclaration,
    Tool,
} from '@google/generative-ai';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

async function safeGenerateContent(model: ReturnType<GoogleGenerativeAI['getGenerativeModel']>, prompt: string) {
    for (let i = 0; i < 4; i++) {
        try {
            return await model.generateContent(prompt);
        } catch (e: unknown) {
            if (e instanceof Error && e.message?.includes('429')) {
                console.log(`  ⏳ Rate limit hit! Sleeping 25s (Attempt ${i + 1}/4)...`);
                await new Promise((r) => setTimeout(r, 25000));
            } else throw e;
        }
    }
    throw new Error('LLM generateContent failed after max retries due to 429.');
}

async function safeSendMessage(
    chat: ReturnType<ReturnType<GoogleGenerativeAI['getGenerativeModel']>['startChat']>,
    payload: (string | Part)[],
) {
    for (let i = 0; i < 4; i++) {
        try {
            return await chat.sendMessage(payload);
        } catch (e: unknown) {
            if (e instanceof Error && e.message?.includes('429')) {
                console.log(`  ⏳ Rate limit hit! Sleeping 25s (Attempt ${i + 1}/4)...`);
                await new Promise((r) => setTimeout(r, 25000));
            } else throw e;
        }
    }
    throw new Error('LLM sendMessage failed after max retries due to 429.');
}

export async function callLLM(systemPrompt: string, userPrompt: string): Promise<string> {
    const modelName = process.env.GEMINI_MODEL || 'gemini-3.1-flash-lite-preview';
    const model = genAI.getGenerativeModel({
        model: modelName,
        systemInstruction: systemPrompt,
    });

    const result = await safeGenerateContent(model, userPrompt);
    const text = result.response.text();

    return text
        .replace(/^```\w*\n?/gm, '')
        .replace(/^```$/gm, '')
        .trim();
}

export async function callLLMWithPlaywright(
    systemPrompt: string,
    userPrompt: string,
    playwrightMcpClient?: Client,
    jsonMode: boolean = false,
): Promise<string> {
    const modelName = process.env.GEMINI_MODEL || 'gemini-2.0-flash-lite-preview-02-05';

    const tools: Tool[] = [];
    if (playwrightMcpClient) {
        const toolsList = await playwrightMcpClient.listTools();
        const playwrightToolsDec: FunctionDeclaration[] = toolsList.tools.map((tool) => ({
            name: tool.name,
            description: tool.description || '',
            parameters: tool.inputSchema as FunctionDeclaration['parameters'],
        }));
        tools.push({ functionDeclarations: playwrightToolsDec });
    }

    const model = genAI.getGenerativeModel({
        model: modelName,
        tools: tools,
        generationConfig: {
            responseMimeType: jsonMode ? 'application/json' : 'text/plain',
            temperature: 0.1,
        },
        safetySettings: [
            {
                category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
                threshold: HarmBlockThreshold.BLOCK_NONE,
            },
            {
                category: HarmCategory.HARM_CATEGORY_HARASSMENT,
                threshold: HarmBlockThreshold.BLOCK_NONE,
            },
            {
                category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
                threshold: HarmBlockThreshold.BLOCK_NONE,
            },
            {
                category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
                threshold: HarmBlockThreshold.BLOCK_NONE,
            },
        ],
    });

    const chat = model.startChat({
        history: [
            {
                role: 'user',
                parts: [{ text: systemPrompt }],
            },
        ],
        tools: tools,
    });
    console.log('  🤖 AI is analyzing the request (may use tools)...');

    let responseText = '';
    let result = await safeSendMessage(chat, [{ text: userPrompt }]);

    // Loop to handle up to 10 tool calls automatically
    for (let i = 0; i < 10; i++) {
        const response = result.response;
        const functionCalls =
            typeof response.functionCalls === 'function' ? response.functionCalls() : response.functionCalls;

        if (functionCalls && functionCalls.length > 0) {
            const call = functionCalls[0];
            console.log(`  🛠️  AI used tool: ${call.name}`);

            let toolResultString = '';
            let toolErrorString = '';

            if (playwrightMcpClient) {
                try {
                    const mcpResult = await playwrightMcpClient.callTool({
                        name: call.name,
                        arguments: call.args as unknown as Record<string, unknown>,
                    });

                    if (mcpResult.isError) {
                        toolErrorString = `Error executing tool: ${(mcpResult.content as any[]).map((c) => (c.type === 'text' ? c.text : '')).join('\\n')}`;
                    } else {
                        toolResultString = (mcpResult.content as any[])
                            .map((c) => (c.type === 'text' ? c.text : ''))
                            .join('\\n');
                    }
                } catch (error: unknown) {
                    const errMsg = error instanceof Error ? error.message : String(error);
                    toolErrorString = `Exception executing tool: ${errMsg}`;
                }
            } else {
                toolErrorString = 'Error: MCP client no longer connected.';
            }

            // Send the result back to the model
            const functionResponsePart = toolErrorString ? { error: toolErrorString } : { result: toolResultString };

            result = await safeSendMessage(chat, [
                {
                    functionResponse: {
                        name: call.name,
                        response: functionResponsePart,
                    },
                },
            ]);
        } else {
            // No more function calls, we have the final text
            responseText = response.text();
            break;
        }
    }

    if (jsonMode) {
        return responseText
            .replace(/^```\w*\n?/gm, '')
            .replace(/^```$/gm, '')
            .trim();
    }

    // For normal code generation, strip markdown output
    return responseText
        .replace(/^```\w*\n?/gm, '')
        .replace(/^```$/gm, '')
        .trim();
}

export function getConfig() {
    return {
        baseUrl: process.env.BASE_URL || 'https://opensource-demo.orangehrmlive.com',
        aiProvider: process.env.AI_PROVIDER || 'gemini',
        geminiModel: process.env.GEMINI_MODEL || 'gemini-3.1-flash-lite-preview',
    };
}
