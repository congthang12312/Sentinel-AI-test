---
description: End-to-end feature implementation with smart intent detection and review gates
---

# Cook — Smart Feature Implementation

Implement features end-to-end: from research to code to test to finalize.

## Usage

```
/cook <natural language task OR plan path>
```

**Flags (add to your request):**
- `--fast` → Skip research, go straight to scout → plan → code
- `--auto` → Auto-approve all steps (no review gates)
- `--no-test` → Skip testing step
- Default → Interactive (user approves each step)

## Smart Intent Detection

| Input Pattern | Detected Mode |
|---|---|
| Path to `plan.md` or `phase-*.md` | **code** — execute existing plan |
| Contains "fast", "quick" | **fast** — skip research |
| Contains "trust me", "auto" | **auto** — no review gates |
| Contains "no test", "skip test" | **no-test** — skip testing |
| Default | **interactive** — full workflow |

## Workflow

```
[Intent Detection] → [Research?] → [Review] → [Plan] → [Review] → [Implement] → [Review] → [Test?] → [Review] → [Finalize]
```

### Step 1: Scout & Research (skip in `fast`/`code` mode)
- Read `./docs/` for project context
- Activate `research` skill — search for best practices, relevant docs
- Use `search_web` or `read_url_content` for external research
- Use `find_by_name` and `grep_search` to discover relevant codebase files
- **Review Gate:** Present findings → wait for user approval

### Step 2: Plan
- If plan path provided → read and use existing plan
- Otherwise → create implementation plan:
  - Save to `./plans/{date}-{feature-name}/plan.md`
  - Break down into phases with clear tasks
- **Review Gate:** Present plan → wait for user approval

### Step 3: Implement
- Follow plan phase by phase
- Activate relevant skills based on task:
  - Frontend work → `frontend-design`, `ui-styling` skills
  - Backend work → `backend-development`, `databases` skills
  - Both → activate both sets
- After each file change → run compile/build to check for errors
- **Review Gate:** Present implemented code → wait for approval

### Step 4: Test (skip in `no-test` mode)
- Write comprehensive tests with REAL data (no mocks just to pass)
- Run test suite → all must pass
- If tests fail → fix and re-run (max 3 retries)
- **Review Gate:** Present test results → wait for approval

### Step 5: Self-Review
- Activate `code-review` skill
- Check: structure, logic, types, performance, security
- **Run security scan:**
  ```bash
  python3 .agent/skills/security-scanner/scripts/vuln_scan.py .
  ```
- Fix any issues found

### Step 6: Finalize (MANDATORY — never skip)
1. Update `./docs/` if codebase changed significantly
2. Summary report: changes made, files modified, test results
3. Ask user if they want to commit (conventional commit format)

## Mode Matrix

| Mode | Research | Testing | Review Gates |
|---|---|---|---|
| interactive | ✓ | ✓ | User approval at each step |
| auto | ✓ | ✓ | No stops |
| fast | ✗ | ✓ | User approval at each step |
| no-test | ✓ | ✗ | User approval at each step |
| code | ✗ | ✓ | User approval at each step |

## Output Format

```
✓ Step [N]: [Brief status] - [Key metrics]
```

## Principles
- YAGNI, KISS, DRY
- Concise reports — sacrifice grammar for concision
- Always run compile/build after code changes
- 100% test pass required before claiming done
