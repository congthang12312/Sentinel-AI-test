---
description: Intelligent plan creation with research and structured phases
---

## Mission

Create a comprehensive implementation plan for the given task.

## Steps

1. **Analyze the task** — Understand requirements, identify complexity level
2. **Research phase** — Search for best practices, existing patterns, relevant documentation
   - Read `./docs/` for project context
   - Activate `planning` skill (read `.agent/skills/planning/SKILL.md`)
   - Research relevant technologies via `search_web` or `read_url_content`
3. **Create plan directory** — `./plans/{date}-{plan-name}/`
4. **Write plan.md** — Overview (< 80 lines) with phases, status, links
5. **Write phase files** — `phase-XX-name.md` for each implementation phase containing:
   - Overview, Requirements, Architecture, Implementation Steps, Todo List, Success Criteria, Risk Assessment
6. **Present plan to user** — Ask for review and approval before any implementation

## Principles
- Honor YAGNI, KISS, DRY
- Be honest and concise
- DO NOT start implementing — only plan
- List unresolved questions at the end
