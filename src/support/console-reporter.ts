import type { Reporter, TestCase, TestResult, FullResult, Suite } from '@playwright/test/reporter';

const RESET = '\x1b[0m';
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const CYAN = '\x1b[36m';
const DIM = '\x1b[2m';

class ConsoleReporter implements Reporter {
    private passed = 0;
    private failed = 0;
    private skipped = 0;
    private total = 0;

    onBegin(_config: unknown, suite: Suite) {
        this.total = suite.allTests().length;
        console.log(`\n${CYAN}═══════════════════════════════════════════════════${RESET}`);
        console.log(`${CYAN}  Running ${this.total} tests (1 worker)${RESET}`);
        console.log(`${CYAN}═══════════════════════════════════════════════════${RESET}\n`);
    }

    onTestBegin(test: TestCase) {
        const project = test.parent.project()?.name || '';
        const title = this.cleanTitle(test.titlePath().slice(2));
        console.log(`${DIM}  ▶ [${project}] ${title}${RESET}`);
    }

    onTestEnd(test: TestCase, result: TestResult) {
        const project = test.parent.project()?.name || '';
        const title = this.cleanTitle(test.titlePath().slice(2));
        const duration = (result.duration / 1000).toFixed(1);

        if (result.status === 'passed') {
            this.passed++;
            console.log(`  ${GREEN}✓${RESET} [${project}] ${title} ${DIM}(${duration}s)${RESET}`);
        } else if (result.status === 'failed' || result.status === 'timedOut') {
            this.failed++;
            console.log(`  ${RED}✗${RESET} [${project}] ${title} ${RED}(${duration}s)${RESET}`);
            // Show first line of error
            if (result.errors.length > 0) {
                const msg = result.errors[0].message?.split('\n')[0] || '';
                console.log(`    ${RED}→ ${msg}${RESET}`);
            }
        } else {
            this.skipped++;
            console.log(`  ${YELLOW}○${RESET} [${project}] ${title} ${DIM}(skipped)${RESET}`);
        }
    }

    onEnd(result: FullResult) {
        console.log(`\n${CYAN}═══════════════════════════════════════════════════${RESET}`);
        console.log(`  ${GREEN}✓ ${this.passed} passed${RESET}  ${this.failed ? `${RED}✗ ${this.failed} failed${RESET}  ` : ''}${this.skipped ? `${YELLOW}○ ${this.skipped} skipped${RESET}  ` : ''}${DIM}(${result.duration ? (result.duration / 1000).toFixed(0) + 's' : ''})${RESET}`);
        console.log(`${CYAN}═══════════════════════════════════════════════════${RESET}\n`);
    }

    /** Strip allure tags and file paths, keep only readable test name */
    private cleanTitle(parts: string[]): string {
        return parts
            .map(p => p.replace(/@allure\.label\.\w+:\w+/g, '').trim())
            .filter(p => p.length > 0)
            .join(' › ');
    }
}

export default ConsoleReporter;
