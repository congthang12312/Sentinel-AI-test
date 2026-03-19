import { readFileSync, writeFileSync, existsSync } from 'fs';
import { execSync } from 'child_process';
import { callLLMWithPlaywright } from './config';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';

// --- Types ---

export interface HealingReport {
    featurePath: string;
    attempts: {
        error: string;
        proposedFix: string;
        action: string;
        success: boolean;
    }[];
    finalPassed: boolean;
}

// --- High-Level Analysis ---
export async function analyzeTestFailure(
    errorMessage: string,
    featureContent: string,
    stepsContent: string,
    pomContent: string,
    playwrightMcpClient?: Client,
): Promise<{ rootCause: string; proposedFix: string; recommendedAction: 'update_steps' | 'update_pom' | 'other' }> {
    const systemPrompt = `
You are an expert SDET AI Agent. Your goal is to analyze Playwright/Cucumber test failures and determine the root cause.
You will be provided with:
1. The error message from the test run.
2. The Gherkin Feature file.
3. The Step Definitions file.
4. The Page Object Model (POM) file.

Analyze the error and determine exactly what went wrong and how to fix it.
Return the result in valid JSON format matching this schema:
{
  "rootCause": "Detailed explanation of what failed",
  "proposedFix": "Explanation of how to fix it (e.g. 'Update CSS selector in POM from X to Y')",
  "recommendedAction": "update_steps" | "update_pom" | "other"
}
`;

    const userPrompt = `
Error Message:
${errorMessage}

Feature File:
${featureContent}

Step Definitions:
${stepsContent}

POM File:
${pomContent}
`;

    console.log('  🔍 Analyzing failure root cause...');
    const resultString = await callLLMWithPlaywright(systemPrompt, userPrompt, playwrightMcpClient, true);

    try {
        const jsonMatch = resultString.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }
        return JSON.parse(resultString);
    } catch (e) {
        console.error('Failed to parse AI analysis json:', resultString);
        return { rootCause: 'Unknown', proposedFix: 'Unknown', recommendedAction: 'other' };
    }
}

// --- Specific Fix Generators ---

export async function askAIToFixCode(
    errorMessage: string,
    analysis: string,
    pomPath: string,
    stepsPath: string,
    previousAttempts: string[],
    playwrightMcpClient?: Client,
): Promise<{ pomFile?: string; stepsFile?: string } | null> {
    const pomContent = existsSync(pomPath) ? readFileSync(pomPath, 'utf-8') : '';
    const stepsContent = existsSync(stepsPath) ? readFileSync(stepsPath, 'utf-8') : '';

    const prompt = `
You are a senior SDET fixing a failing Playwright/Cucumber test.
The previous test run failed with this error:
${errorMessage}

AI Analysis of the root cause:
${analysis}

We have already tried these fixes (if any), which failed:
${previousAttempts.join('\n- ')}

Here is the current POM code (Path: ${pomPath}):
${pomContent}

Here is the current Step Definitions code (Path: ${stepsPath}):
${stepsContent}

Your job is to provide the FIXED code for either the POM or the Steps file (or both).
Return ONLY valid JSON in this exact structure. Do not return markdown blocks outside the JSON.
{
    "explanation": "Brief reasoning",
    "updatedPomCode": "Full code for POM only if it needs changes, else null",
    "updatedStepsCode": "Full code for Steps only if it needs changes, else null"
}
`;

    console.log('  🤖 Asking AI for code fix...');
    const fixContent = await callLLMWithPlaywright(
        'You are an expert Playwright test debugger. Return ONLY valid JSON, no markdown.',
        prompt,
        playwrightMcpClient,
        true, // JSON mode
    );

    try {
        const parsed = JSON.parse(fixContent);

        let fixedSomething = false;
        if (parsed.updatedPomCode) {
            writeFileSync(pomPath, parsed.updatedPomCode);
            console.log('  ✅ Applied fix to POM');
            fixedSomething = true;
        }

        if (parsed.updatedStepsCode) {
            writeFileSync(stepsPath, parsed.updatedStepsCode);
            console.log('  ✅ Applied fix to Steps');
            fixedSomething = true;
        }

        if (fixedSomething) {
            return {
                pomFile: parsed.updatedPomCode ? pomPath : undefined,
                stepsFile: parsed.updatedStepsCode ? stepsPath : undefined,
            };
        }
        return null;
    } catch (error) {
        console.error('  ❌ Failed to parse AI fix JSON.', error, fixContent);
        return null;
    }
}

// --- Helper Functions ---
function getActivePlaywrightClient(client?: Client): Client | undefined {
    // If we wanted to create a new client locally here we could, but the design
    // now requires the orchestrator to pass the client in from the outside.
    return client;
}

// --- Main Self-Healing Loop ---

export async function healTest(
    featurePath: string,
    pomPath: string,
    stepsPath: string,
    maxRetries: number = 3,
    tags?: string,
    existingPlaywrightMcpClient?: Client,
): Promise<HealingReport> {
    const report: HealingReport = {
        featurePath,
        attempts: [],
        finalPassed: false,
    };

    const playwrightMcpClient = getActivePlaywrightClient(existingPlaywrightMcpClient);
    const previousAttemptsMemory: string[] = [];

    for (let i = 1; i <= maxRetries; i++) {
        console.log(`\n🩺 SELF-HEALING ATTEMPT ${i}/${maxRetries}`);

        // 1. Run the test to get the actual failure
        console.log(`  🏃 Running failed test to capture error logs...`);
        let testOutput = '';
        let testFailed = false;

        const cmd = tags ? `npx playwright test --grep "${tags}"` : `npx playwright test`;

        try {
            // Need to run bddgen first in case we just modified steps
            execSync('npx bddgen', { stdio: 'pipe', encoding: 'utf-8', env: { ...process.env, NODE_ENV: 'test' } });
            testOutput = execSync(cmd, { encoding: 'utf-8', env: { ...process.env, NODE_ENV: 'test' } });
        } catch (error: any) {
            testFailed = true;
            testOutput = error.stdout || error.message;
        }

        if (!testFailed) {
            console.log(`  ✅ Test passed! No healing needed.`);
            report.finalPassed = true;
            break;
        }

        // Extract a clean error message (crude heuristic for now)
        const errorSnippet = testOutput.substring(0, 3000); // Send first 3k chars to LLM
        console.log(`  💥 Test failed. Extracted error snippet length: ${errorSnippet.length}`);

        // Read current state
        const featureContent = existsSync(featurePath) ? readFileSync(featurePath, 'utf-8') : '';
        const pomContent = existsSync(pomPath) ? readFileSync(pomPath, 'utf-8') : '';
        const stepsContent = existsSync(stepsPath) ? readFileSync(stepsPath, 'utf-8') : '';

        // 2. High level analysis
        const analysis = await analyzeTestFailure(
            errorSnippet,
            featureContent,
            stepsContent,
            pomContent,
            playwrightMcpClient,
        );

        console.log(`  🧠 Analysis: ${analysis.rootCause}`);
        console.log(`  💡 Proposed fix: ${analysis.proposedFix} (${analysis.recommendedAction})`);

        // 3. Ask for code
        const fixResult = await askAIToFixCode(
            errorSnippet,
            analysis.rootCause,
            pomPath,
            stepsPath,
            previousAttemptsMemory,
            playwrightMcpClient,
        );

        if (!fixResult) {
            console.log(`  ❌ AI couldn't generate a code fix.`);
            report.attempts.push({
                error: analysis.rootCause,
                proposedFix: analysis.proposedFix,
                action: 'Failed to generate code',
                success: false,
            });
            break;
        }

        previousAttemptsMemory.push(analysis.proposedFix);
        report.attempts.push({
            error: analysis.rootCause,
            proposedFix: analysis.proposedFix,
            action: analysis.recommendedAction,
            success: false, // will update on next loop if it passes
        });

        // Loop continues, the next iteration will run the test again
    }

    if (!report.finalPassed) {
        console.log(`\n😔 Self-healing exhausted all ${maxRetries} retries.`);
    }

    return report;
}
