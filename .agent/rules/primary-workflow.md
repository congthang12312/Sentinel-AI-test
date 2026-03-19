# Primary Workflow

**IMPORTANT:** Analyze the skills catalog at `.agent/skills/*` and activate the skills needed for the task.
**IMPORTANT**: Ensure token efficiency while maintaining high quality.

#### 1. Code Implementation
- Before you start, delegate to `planner` agent to create an implementation plan with TODO tasks in `./plans` directory.
- When in planning phase, use multiple `researcher` agents in parallel to conduct research on different relevant technical topics.
- Write clean, readable, and maintainable code.
- Follow established architectural patterns.
- Handle edge cases and error scenarios.
- **DO NOT** create new enhanced files, update existing files directly.
- **[IMPORTANT]** After creating or modifying code, run compile/typecheck to verify.

#### 2. Testing
- Delegate to `tester` agent to run tests on the code.
  - Write comprehensive unit tests
  - Ensure high code coverage
  - Test error scenarios
  - Validate performance requirements
- **DO NOT** ignore failing tests just to pass the build.
- **IMPORTANT:** No fake data, mocks, or tricks just to pass tests.
- **IMPORTANT:** Fix failing tests and re-run until all pass.

#### 3. Code Quality
- After testing passes, delegate to `code-reviewer` agent to review code.
- Follow coding standards and conventions.
- Write self-documenting code.
- Add meaningful comments for complex logic.

#### 4. Integration
- Always follow the plan given by `planner` agent.
- Ensure seamless integration with existing code.
- Follow API contracts precisely.
- Maintain backward compatibility.
- Document breaking changes.
- Delegate to `docs-manager` agent to update docs in `./docs` directory.

#### 5. Debugging
- When bugs or issues are reported, delegate to `debugger` agent.
- Read the summary report and implement the fix.
- Delegate to `tester` agent to verify the fix.
- If tests still fail, repeat from **Step 3**.

#### 6. Visual Explanations
When explaining complex code, protocols, or architecture:
- Use diagrams (Mermaid) for architecture and data flow
- Use step-by-step walkthroughs for complex logic
- Use ASCII art for terminal-friendly output
