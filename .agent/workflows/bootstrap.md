---
description: Bootstrap a new project from scratch with full planning and setup
---

## Mission

Bootstrap a new project step by step, from requirements gathering to initial implementation.

## Steps

1. **Gather requirements** — Ask user clarifying questions (1 at a time) until fully understood
2. **Check Git** — Verify if Git is initialized; if not, ask user and run `git init`
3. **Research** — Search for best practices, tech stack recommendations, similar projects
4. **Tech Stack Decision**
   - Ask user for preferred tech stack
   - If none specified, research and propose 2-3 options with pros/cons
   - Wait for user approval
5. **Create implementation plan** — Use `/plan` workflow
   - Save to `./plans/{date}-{project-name}/`
   - Wait for user approval before implementing
6. **Design (Optional)** — Ask if user wants wireframes/design guidelines
   - If yes, create design guidelines at `./docs/design-guidelines.md`
   - Generate wireframes if applicable
7. **Implementation** — Follow the plan phase by phase
   - Run type checking and compile after each phase
   - Activate relevant skills from `.agent/skills/`
8. **Testing** — Write and run comprehensive tests with real data
9. **Code Review** — Self-review using `code-review` skill checklist
10. **Documentation** — Create/update:
    - `./docs/codebase-summary.md`
    - `./docs/project-overview-pdr.md`
    - `./docs/code-standards.md`
    - `./docs/system-architecture.md`
11. **Final Report** — Summarize changes, guide user to get started, suggest next steps

## Principles
- Ask 1 question at a time, wait for answer
- YAGNI, KISS, DRY
- Be concise in reports
