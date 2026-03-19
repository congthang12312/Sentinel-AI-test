---
description: Comprehensive code review with quality assessment and security audit
---

## Mission

Perform a thorough code review on specified files or recent changes.

## Steps

1. **Activate skill** — Read `.agent/skills/code-review/SKILL.md`
2. **Identify scope** — Check recent changes with `git diff` or review specified files
3. **Edge Case Scouting** — Before reviewing, identify:
   - Affected dependents and data flow risks
   - Boundary conditions and async races
   - State mutations and side effects
4. **Systematic Review**:
   | Area | Focus |
   |------|-------|
   | Structure | Organization, modularity |
   | Logic | Correctness, edge cases |
   | Types | Safety, error handling |
   | Performance | Bottlenecks, inefficiencies |
   | Security | Vulnerabilities, data exposure |
5. **Prioritize findings**:
   - **Critical**: Security vulnerabilities, data loss, breaking changes
   - **High**: Performance issues, type safety, missing error handling
   - **Medium**: Code smells, maintainability, docs gaps
   - **Low**: Style, minor optimizations
6. **Generate report** with: Scope, Assessment, Issues by priority, Positive observations, Recommended actions

## Principles
- Constructive, pragmatic feedback
- Acknowledge good practices
- Respect `./docs/code-standards.md`
- No AI attribution in code/commits
- Be concise
