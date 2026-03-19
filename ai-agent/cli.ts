import { runPipeline, generateGherkin, generateStepsAndPOM, runTests } from './orchestrator';
import { healTest } from './self-healing';
import { fetchJiraRequirement } from './jira-mcp-client';
import * as fs from 'fs';

async function main() {
    const args = process.argv.slice(2);
    const healFlag = args.includes('--heal');
    let requirementPath = args.find((a) => !a.startsWith('--'));
    const stepFlag = args.find((a) => a.startsWith('--step='));
    const step = stepFlag ? parseInt(stepFlag.split('=')[1]) : undefined;
    const tagsFlag = args.find((a) => a.startsWith('--tags='));
    const tags = tagsFlag ? tagsFlag.split('=')[1] : undefined;
    const moduleFlag = args.find((a) => a.startsWith('--module='));
    let moduleName = moduleFlag ? moduleFlag.split('=')[1] : 'default';

    if (!requirementPath) {
        console.log(`
╔══════════════════════════════════════════════════════════╗
║           AI-Powered Automation Testing CLI              ║
╠══════════════════════════════════════════════════════════╣
║                                                          ║
║  Usage:                                                  ║
║    npx ts-node ai-agent/cli.ts <requirement-file-or-jira-ticket> ║
║                                                          ║
║  Options:                                                ║
║    --step=1   Generate Gherkin only                      ║
║    --step=2   Generate Steps + POM only                  ║
║    --step=3   Run tests only                             ║
║    --heal     Run tests + self-heal on failure           ║
║    --tags=@x  Filter by Cucumber tags (with --heal)      ║
║    --module=m Specify target module (e.g. auth, pim)     ║
║    (no flag)  Run full pipeline (1→2→3 + self-healing)   ║
║                                                          ║
║  Examples:                                               ║
║    npx ts-node ai-agent/cli.ts requirements/login-flow.md║
║    npx ts-node ai-agent/cli.ts PIM-123                   ║
║    npx ts-node ai-agent/cli.ts features/login.feature --heal║
║                                                          ║
╚══════════════════════════════════════════════════════════╝
`);
        process.exit(1);
    }

    try {
        // Handle Jira Ticket ID
        if (
            requirementPath &&
            requirementPath.match(/^[A-Z]+-\d+$/) &&
            !healFlag &&
            !requirementPath.endsWith('.feature')
        ) {
            console.log(`🔎 Phát hiện Jira Ticket ID: ${requirementPath}`);
            const ticketContent = await fetchJiraRequirement(requirementPath);

            // Extract module from Jira prefix if not specified
            if (moduleName === 'default') {
                moduleName = requirementPath.split('-')[0].toLowerCase();
            }

            if (!fs.existsSync('requirements')) {
                fs.mkdirSync('requirements', { recursive: true });
            }
            const savedPath = `requirements/${requirementPath}-flow.md`;
            fs.writeFileSync(savedPath, ticketContent);
            console.log(`📥 Đã lưu requirement vào file tạm: ${savedPath}`);

            // Update requirementPath to point to the newly downloaded requirement file
            requirementPath = savedPath;
        }
    } catch (error: Error | unknown) {
        console.error('❌ Error fetching from Jira MCP:', error instanceof Error ? error.message : String(error));
        process.exit(1);
    }

    if (moduleName === 'default' && requirementPath && requirementPath.endsWith('.md')) {
        try {
            const content = fs.readFileSync(requirementPath, 'utf-8');
            const match = content.match(/Module:\*\*\s*(\w+)/i) || content.match(/Module:\s*(\w+)/i);
            if (match) moduleName = match[1].toLowerCase();
        } catch (e) {
            // Ignored intentional empty block
            void e;
        }
    }

    try {
        if (healFlag) {
            // Self-healing mode
            console.log('🏥 Self-Healing Mode');

            // Derive POM and steps paths from feature path
            const featureName = requirementPath.replace(`src/features/${moduleName}/`, '').replace('.feature', '');
            const pomPath = `src/tests/${moduleName}/pages/${featureName}.page.ts`;
            const stepsPath = `src/tests/${moduleName}/steps/${featureName}.steps.ts`;

            console.log(`  Feature: ${requirementPath}`);
            console.log(`  POM:     ${pomPath}`);
            console.log(`  Steps:   ${stepsPath}`);
            if (tags) console.log(`  Tags:    ${tags}`);
            console.log('');

            const report = await healTest(requirementPath, pomPath, stepsPath, 3, tags);
            process.exit(report.finalPassed ? 0 : 1);
        } else if (step === 1) {
            console.log('🚀 Running Step 1 only: Generate Gherkin');
            const featureFile = await generateGherkin(requirementPath, moduleName);
            console.log(`\n✅ Done! Feature file: ${featureFile}`);
        } else if (step === 2) {
            console.log('🔧 Running Step 2 only: Generate Steps + POM');
            const featureName = requirementPath
                .replace('requirements/', '')
                .replace(/-flow\.md$/, '')
                .replace(/\.md$/, '');
            const featurePath = `src/features/${moduleName}/${featureName}.feature`;
            const result = await generateStepsAndPOM(featurePath, moduleName);
            console.log(`\n✅ Done! Steps: ${result.stepsFile}, POM: ${result.pomFile}`);
        } else if (step === 3) {
            console.log('▶️  Running Step 3 only: Execute Tests');
            const result = await runTests();
            console.log(`\n${result.success ? '✅ Tests PASSED!' : '❌ Tests FAILED!'}`);
            if (!result.success) {
                console.log('Output:', result.output.slice(0, 2000));
            }
        } else {
            // Full pipeline
            const result = await runPipeline(requirementPath, moduleName);
            process.exit(result.testResult.success ? 0 : 1);
        }
    } catch (error: Error | unknown) {
        console.error('❌ Error:', error instanceof Error ? error.message : String(error));
        process.exit(1);
    }
}

main();
