import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'fs';
import { basename, join } from 'path';
import { execSync } from 'child_process';
import * as crypto from 'crypto';
import { callLLM, callLLMWithPlaywright } from './config';
import { healTest } from './self-healing';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import * as path from 'path';

export interface PipelineResult {
    requirementPath: string;
    featureFile: string;
    stepsFile: string;
    pomFile: string;
    testResult: { success: boolean; output: string };
}

// --- Step 1: Requirement → Gherkin ---
export async function generateGherkin(requirementPath: string, moduleName: string): Promise<string> {
    const requirement = readFileSync(requirementPath, 'utf-8');
    const systemPrompt = readFileSync('ai-agent/prompts/generate-gherkin.md', 'utf-8');

    // Hash checking logic
    const reqHash = crypto.createHash('md5').update(requirement).digest('hex');
    const reqName = basename(requirementPath, '.md').replace(/-flow$/, '');
    const featurePath = `src/features/${moduleName}/${reqName}.feature`;

    if (existsSync(featurePath)) {
        const existingFeature = readFileSync(featurePath, 'utf-8');
        const match = existingFeature.match(/^# RequirementHash: ([a-f0-9]{32})/);
        if (match && match[1] === reqHash) {
            console.log(`  ⚡ CACHE HIT: Requirement hasn't changed. Skipping AI Gherkin generation.`);
            return featurePath;
        } else {
            console.log(`  🔄 CACHE MISS: Requirement changed or no hash found. Regenerating Gherkin...`);
        }
    }

    console.log('  📄 Reading requirement:', requirementPath);
    console.log('  🤖 Calling LLM to generate Gherkin...');

    const featureContent = await callLLM(systemPrompt, requirement);

    mkdirSync(`src/features/${moduleName}`, { recursive: true });

    // Prepend hash to the output
    const finalContent = `# RequirementHash: ${reqHash}\n${featureContent}`;
    writeFileSync(featurePath, finalContent);
    console.log('  ✅ Generated:', featurePath);

    return featurePath;
}

// --- Step 2: Gherkin → Step Definitions + POM ---
export async function generateStepsAndPOM(
    featurePath: string,
    moduleName: string,
    pageUrl?: string,
    playwrightMcpClient?: Client,
): Promise<{ stepsFile: string; pomFile: string }> {
    const featureContent = readFileSync(featurePath, 'utf-8');
    const stepsPrompt = readFileSync('ai-agent/prompts/generate-steps.md', 'utf-8');
    const pomPrompt = readFileSync('ai-agent/prompts/generate-pom.md', 'utf-8');

    // Determine file names
    const featureName = basename(featurePath, '.feature');

    // Read fixtures if available
    let fixturesInfo = '';
    const fixtureDir = `src/fixtures`;
    if (existsSync(fixtureDir)) {
        const fixtureFiles = readdirSync(fixtureDir);
        fixturesInfo = `\nAvailable fixture files in ${fixtureDir}/:\n`;
        for (const f of fixtureFiles) {
            const content = readFileSync(join(fixtureDir, f), 'utf-8');
            fixturesInfo += `- ${f}: ${content}\n`;
        }
    }

    // Generate POM
    console.log('  🤖 Generating Page Object Model...');
    const pomUserPrompt = `
Generate a Page Object class for the "${featureName}" page.

Page URL: ${pageUrl || 'see the feature file for context'}

Feature file for context:
${featureContent}

${fixturesInfo}

Class name should be: ${toPascalCase(featureName)}Page
File will be saved as: src/tests/${moduleName}/pages/${featureName}.page.ts
`;

    const pomContent = await callLLMWithPlaywright(pomPrompt, pomUserPrompt, playwrightMcpClient);
    const pomPath = `src/tests/${moduleName}/pages/${featureName}.page.ts`;
    mkdirSync(`src/tests/${moduleName}/pages`, { recursive: true });
    writeFileSync(pomPath, pomContent);
    console.log('  ✅ Generated POM:', pomPath);

    // Generate Step Definitions
    console.log('  🤖 Generating Step Definitions...');
    const stepsUserPrompt = `
Generate step definitions for this Gherkin feature:

${featureContent}

Use this Page Object class (already created at ../pages/${featureName}.page):
${pomContent}

${fixturesInfo}

Step definitions file: src/tests/${moduleName}/steps/${featureName}.steps.ts
`;

    const stepsContent = await callLLMWithPlaywright(stepsPrompt, stepsUserPrompt, playwrightMcpClient);
    const stepsPath = `src/tests/${moduleName}/steps/${featureName}.steps.ts`;
    mkdirSync(`src/tests/${moduleName}/steps`, { recursive: true });
    writeFileSync(stepsPath, stepsContent);
    console.log('  ✅ Generated Steps:', stepsPath);

    return { stepsFile: stepsPath, pomFile: pomPath };
}

// --- Step 3: Run Cucumber Tests via Playwright-BDD ---
export async function runTests(): Promise<{ success: boolean; output: string }> {
    mkdirSync('reports/screenshots', { recursive: true });

    const cmd = `npx playwright test --reporter=html,allure-playwright`;

    console.log('  🏗️ Compiling BDD Specs and Running Tests...');

    try {
        // Ensure steps compile
        execSync('npx bddgen', { stdio: 'pipe', encoding: 'utf-8', env: { ...process.env, NODE_ENV: 'test' } });

        console.log('  🏃 Running Playwright Tests...');
        const output = execSync(cmd, {
            encoding: 'utf-8',
            timeout: 120000,
            env: { ...process.env, NODE_ENV: 'test' },
        });
        return { success: true, output };
    } catch (error: Error | unknown) {
        return {
            success: false,
            output:
                error instanceof Error ? (error as Error & { stdout?: string }).stdout || error.message : String(error),
        };
    }
}

// --- Self-Healing ---
// This is now handled entirely by healTest in self-healing.ts

// --- Full Pipeline ---
export async function runPipeline(requirementPath: string, moduleName: string): Promise<PipelineResult> {
    console.log('\n╔══════════════════════════════════════════╗');
    console.log('║  AI-Powered Automation Testing Pipeline  ║');
    console.log('╚══════════════════════════════════════════╝\n');

    // Step 1
    console.log('🚀 STEP 1: Requirement → Gherkin');
    const featureFile = await generateGherkin(requirementPath, moduleName);

    // Step 2
    console.log('\n🔧 STEP 2: Gherkin → Step Definitions + POM');

    // Setup Local Playwright MCP Client
    const serverPath = path.resolve(process.cwd(), 'ai-agent/mcp-servers/playwright/dist/index.js');
    const playwrightMcpTransport = new StdioClientTransport({
        command: 'node',
        args: [serverPath],
    });

    const playwrightMcpClient = new Client({ name: 'automation-orchestrator', version: '1.0.0' }, { capabilities: {} });

    await playwrightMcpClient.connect(playwrightMcpTransport);
    console.log('✅ Connected to Playwright MCP Server');

    const { stepsFile, pomFile } = await generateStepsAndPOM(featureFile, moduleName, undefined, playwrightMcpClient);

    // Validate AI-generated code quality
    console.log('\n🔎 Validating AI-generated code quality...');
    validateGeneratedCode(pomFile, stepsFile, moduleName);

    // Run Code Quality Checks (Linter & Prettier)
    console.log('\n✨ Running Prettier & Linter to format AI-generated code...');
    try {
        execSync('npm run format', { stdio: 'inherit' });
    } catch (e) {
        void e;
        console.log('  ⚠️ Code Quality Check found unfixable issues, but continuing anyway...');
    }

    // Validate compilation (Pre-execution validation)
    console.log('\n🔍 Pre-execution Validation (Compiling TypeScript)...');
    try {
        execSync('npm run compile', { stdio: 'ignore' });
        console.log('  ✅ Compilation successful!');
    } catch (e) {
        void e;
        console.log('  ⚠️ TypeScript Compilation Failed! The AI generated invalid code. Tests will likely crash.');
    }

    // Step 3
    console.log('\n▶️  STEP 3: Run Tests');
    let testResult = await runTests();

    // Self-healing loop (max 3 retries)
    if (!testResult.success) {
        console.log(`\n🔄 AI Agent detected test failure. Triggering Self-Healing Protocol...`);
        const report = await healTest(featureFile, pomFile, stepsFile, 3, undefined, playwrightMcpClient);
        testResult.success = report.finalPassed;
    }

    // Summary
    console.log('\n╔══════════════════════════════════════════╗');
    console.log('║              Pipeline Summary            ║');
    console.log('╠══════════════════════════════════════════╣');
    console.log(`║ Requirement: ${requirementPath}`);
    console.log(`║ Feature:     ${featureFile}`);
    console.log(`║ Steps:       ${stepsFile}`);
    console.log(`║ POM:         ${pomFile}`);
    console.log(`║ Result:      ${testResult.success ? 'PASSED ✅' : 'FAILED ❌'}`);
    console.log('╚══════════════════════════════════════════╝\n');

    await playwrightMcpTransport.close();
    return { requirementPath, featureFile, stepsFile, pomFile, testResult };
}

// --- Output Validation ---
function validateGeneratedCode(pomPath: string, stepsPath: string, moduleName: string): void {
    const warnings: string[] = [];

    if (existsSync(pomPath)) {
        const pomCode = readFileSync(pomPath, 'utf-8');

        // Check: POM extends BasePage
        if (!pomCode.includes('extends BasePage')) {
            warnings.push('POM does not extend BasePage');
        }

        // Check: Correct BasePage import path
        if (!pomCode.includes("from '../../../support/base.page'") && !pomCode.includes("from '../../support/base.page'")) {
            warnings.push('POM has incorrect or missing BasePage import path');
        }

        // Check: No CSS class selectors
        const cssClassPattern = /\.oxd-|\.css-|\.btn-|\.ng-|querySelector\(/;
        if (cssClassPattern.test(pomCode)) {
            warnings.push('POM contains CSS class selectors (forbidden)');
        }
    }

    if (existsSync(stepsPath)) {
        const stepsCode = readFileSync(stepsPath, 'utf-8');

        // Check: No hardcoded credentials
        const hardcodedCreds = /['"]admin123['"]|['"]Admin['"](?!.*field)/i;
        if (hardcodedCreds.test(stepsCode)) {
            warnings.push('Steps may contain hardcoded credentials — should use testData from fixtures');
        }

        // Check: No CSS class selectors
        const cssClassPattern = /\.oxd-|\.css-|\.btn-|\.ng-|querySelector\(/;
        if (cssClassPattern.test(stepsCode)) {
            warnings.push('Steps contain CSS class selectors (forbidden)');
        }
    }

    if (warnings.length === 0) {
        console.log('  ✅ All validation checks passed!');
    } else {
        console.log(`  ⚠️ Found ${warnings.length} quality warning(s):`);
        warnings.forEach((w) => console.log(`     - ${w}`));
    }
}

// --- Helpers ---
function toPascalCase(str: string): string {
    return str
        .split(/[-_]/)
        .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
        .join('');
}

