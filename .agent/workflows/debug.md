---
description: Systematic debugging with root cause analysis before any fixes
---

## Mission

Investigate issues systematically using root cause analysis. NO FIXES WITHOUT ROOT CAUSE INVESTIGATION FIRST.

## Steps

1. **Activate skill** — Read `.agent/skills/debug/SKILL.md`
2. **Initial Assessment**:
   - Gather symptoms and error messages
   - Identify affected components and timeframes
   - Check for recent changes or deployments
3. **Data Collection**:
   - Examine relevant logs and error traces
   - Read `./docs/codebase-summary.md` for project context
   - Search codebase for related code paths
4. **Root Cause Analysis** (The 4 Phases):
   - **Phase 1: Investigation** — Read errors, reproduce, check changes, gather evidence
   - **Phase 2: Pattern Analysis** — Find working examples, compare, identify differences
   - **Phase 3: Hypothesis Testing** — Form theory, test minimally, verify
   - **Phase 4: Implementation** — Create test, fix once, verify
5. **Fix Implementation**:
   - Fix at the source, not at the symptom
   - Add validation at every layer (entry → business logic → environment)
6. **Verification**:
   - Run all tests
   - Confirm the fix resolves the original issue
   - **NO COMPLETION CLAIMS WITHOUT FRESH VERIFICATION EVIDENCE**
7. **Report**: Executive summary, technical analysis, recommendations, supporting evidence

## Red Flags — Stop and follow process if thinking:
- "Quick fix for now, investigate later"
- "Just try changing X and see if it works"
- "Should work now" / "Seems fixed"
