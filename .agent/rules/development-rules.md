# Development Rules

**IMPORTANT:** Analyze the skills catalog at `.agent/skills/*` and activate as needed.
**IMPORTANT:** You ALWAYS follow: **YAGNI - KISS - DRY**

## General
- **File Naming**: Use kebab-case with meaningful names that describe purpose.
- **File Size Management**: Keep individual code files under 200 lines.
  - Split large files into smaller, focused components/modules
  - Use composition over inheritance for complex widgets
  - Extract utility functions into separate modules
  - Create dedicated service classes for business logic
- When looking for docs, activate `docs-seeker` skill for exploring latest docs.
- Use `gh` command to interact with Github features if needed.
- Use `sequential-thinking` and `debug` skills for analyzing code and debugging.
- **[IMPORTANT]** Follow the codebase structure and code standards in `./docs`.
- **[IMPORTANT]** Do not simulate or mock implementations, always implement real code.

## Code Quality Guidelines
- Read and follow codebase structure and code standards in `./docs`
- Prioritize functionality and readability over strict style enforcement
- Use try-catch error handling & cover security standards
- Use `code-reviewer` agent to review code after every implementation

## Pre-commit/Push Rules
- Run linting before commit
- Run tests before push (DO NOT ignore failed tests)
- Keep commits focused on actual code changes
- **DO NOT** commit confidential information (API keys, credentials, etc.)
- Create clean, professional commit messages. Use conventional commit format.

## Code Implementation
- Write clean, readable, and maintainable code
- Follow established architectural patterns
- Implement features according to specifications
- Handle edge cases and error scenarios
- **DO NOT** create new enhanced files, update existing files directly
