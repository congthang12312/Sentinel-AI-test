---
description: Smart bug fixing with auto-detection, complexity routing, and verification
---

# Fix — Intelligent Bug Fixing

Fix bugs, errors, test failures, CI/CD issues, type errors, lint problems, and UI issues with intelligent routing based on complexity.

## Usage

```
/fix <error description or log output>
```

**Flags:**
- `--auto` → Fix autonomously without review gates (default)
- `--review` → Pause for approval at each step
- `--quick` → Fast mode for trivial bugs (type errors, lint, typos)

## Workflow

### Step 0: Complexity Assessment

Auto-detect complexity and route accordingly:

| Level | Indicators | Strategy |
|---|---|---|
| **Simple** | Single file, clear error, type/lint issue | Quick: debug → fix → verify |
| **Moderate** | Multi-file, root cause unclear | Standard: debug → analyze → fix → test → review |
| **Complex** | System-wide, architecture impact | Deep: research → brainstorm → plan → fix → test → review |

### Step 1: Debug (Root Cause Analysis)

- Activate `debug` skill (read `.agent/skills/debug/SKILL.md`)
- Gather all possible root causes
- Search codebase with `grep_search` for related patterns
- Identify the **actual root cause** — not just the symptom

### Step 2: Fix Implementation

**Simple (Quick):**
1. Fix the identified issue directly
2. Run compile/build to verify
3. Done

**Moderate (Standard):**
1. Create a fix plan
2. Implement fix at the source
3. Add validation at entry points
4. Run tests → must all pass
5. Self-review: did the fix break anything?

**Complex (Deep):**
1. Research alternative approaches
2. Consider: is this a symptom of a deeper design problem?
3. Activate `problem-solving` or `sequential-thinking` skill
4. Implement fix following the plan
5. Run full test suite
6. Comprehensive code review

### Step 3: Verification

- Read and analyze all implemented changes
- Search for related code that might be affected
- Run all tests — **100% pass required**
- Verify the original error is resolved with fresh evidence

### Step 4: Prevent Future Issues

- Add guards/validation to prevent recurrence
- Add tests covering the fixed scenario
- Document the fix if it affects architecture

### Step 5: Finalize (MANDATORY)

1. Summary report:
   ```
   ✓ Root cause: [description]
   ✓ Fix: [what was changed]
   ✓ Files: [list of modified files]
   ✓ Tests: [X/X passed]
   ✓ Confidence: [high/medium/low]
   ```
2. Update `./docs/` if changes warrant
3. Ask user if they want to commit

## Specialized Routing

Detect issue type from input and apply focused strategy:

| Issue Type | Detected When | Focus |
|---|---|---|
| **Test failure** | "test fail", "spec fail" | Read test output → find assertion mismatch → fix |
| **Type error** | "TypeError", "type error", "TS" | Check types → fix signature/cast |
| **Lint error** | "lint", "eslint", "biome" | Auto-fix with lint tool, manual fix remainder |
| **CI/CD** | "CI", "pipeline", "build fail" | Check build logs → fix config/deps |
| **UI issue** | "visual", "layout", "CSS" | Activate `ui-styling` skill → inspect → fix |
| **Runtime error** | Stack trace, "undefined", "null" | Trace data flow → add null checks → fix |

## Principles
- **Root cause first** — never apply band-aid fixes
- Fix at the source, not the symptom
- Always verify with fresh test run
- Concise reports
