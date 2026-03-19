---
description: Full codebase scan — research, review, improvement plan, final report
---

# Review Codebase — Comprehensive Codebase Analysis

Scan and analyze the entire codebase for quality, patterns, security, and improvement opportunities.

## Usage

```
/review-codebase [specific focus or prompt]
```

## Workflow

### Step 1: Codebase Discovery
- Read `./docs/codebase-summary.md` and `./docs/system-architecture.md` for context
- Use `find_by_name` to map the full project structure
- Identify: entry points, core modules, test files, config files
- Count: total files, lines of code, test coverage

### Step 2: Research Best Practices
- Identify the tech stack from project files
- Use `search_web` for latest best practices for the detected stack
- Compare project patterns against industry standards

### Step 3: Systematic Code Review
Activate `code-review` skill and scan across these areas:

| Area | What to Check |
|---|---|
| **Architecture** | Separation of concerns, dependency direction, modularity |
| **Code Quality** | Naming, complexity, duplication, dead code |
| **Security** | Hardcoded secrets, SQL injection, XSS, auth vulnerabilities |

**Run automated scans:**
```bash
# Security SAST scan (zero-token, regex-based)
python3 .agent/skills/security-scanner/scripts/vuln_scan.py .

# Generate security release checklist
python3 .agent/skills/security-scanner/scripts/checklist_gen.py > SECURITY_GATE.md

# SEO compliance check (for web projects)
python3 .agent/skills/seo-analyzer/scripts/seo_check.py src/app/layout.tsx
```

| Area | What to Check |
| **Performance** | N+1 queries, memory leaks, unnecessary re-renders |
| **Testing** | Coverage gaps, test quality, missing edge cases |
| **Dependencies** | Outdated packages, vulnerable deps, unnecessary deps |
| **Error Handling** | Uncaught exceptions, generic catches, missing validation |
| **Documentation** | Missing JSDoc/docstrings, outdated README, unclear comments |

### Step 4: Create Improvement Plan
Save to `./plans/{date}-codebase-review/`:
- `plan.md` — Overview with prioritized issues
- Phase files for each improvement area

**Priority classification:**
- 🔴 **Critical** — Security vulnerabilities, data loss risks, breaking bugs
- 🟠 **High** — Performance bottlenecks, missing error handling, type safety
- 🟡 **Medium** — Code smells, duplication, maintainability concerns
- 🟢 **Low** — Style, minor optimizations, nice-to-haves

### Step 5: Final Report
Present to user:
- **Executive Summary** — Overall health score (A-F), key findings
- **Top Issues** — Prioritized list with specific file references
- **Positive Observations** — What's done well
- **Improvement Plan** — Link to generated plan
- **Quick Wins** — Issues fixable in < 30 minutes
- **Suggested Next Steps** — Prioritized action items

## Principles
- Be constructive — acknowledge good practices
- Specific file + line references for every finding
- Respect existing `./docs/code-standards.md` conventions
- Concise reports — sacrifice grammar for clarity
- Focus on actionable improvements, not nitpicking
