# Orchestration Protocol

## Delegation Context (MANDATORY)

When spawning agents, **ALWAYS** include in prompt:

1. **Work Context Path**: The git root of the PRIMARY files being worked on
2. **Reports Path**: `{work_context}/plans/reports/` for that project
3. **Plans Path**: `{work_context}/plans/` for that project

**Example:**
```
Task prompt: "Fix parser bug.
Work context: /path/to/project
Reports: /path/to/project/plans/reports/
Plans: /path/to/project/plans/"
```

**Rule:** If CWD differs from work context, use the **work context paths**, not CWD paths.

---

#### Sequential Chaining
Chain agents when tasks have dependencies:
- **Planning → Implementation → Simplification → Testing → Review**: Feature development
- **Research → Design → Code → Documentation**: New system components
- Each agent completes fully before the next begins
- Pass context and outputs between agents in the chain

#### Parallel Execution
Spawn multiple agents simultaneously for independent tasks:
- **Code + Tests + Docs**: Separate, non-conflicting components
- **Multiple Feature Branches**: Different agents on isolated features
- **Cross-platform Development**: Platform-specific implementations
- **Careful Coordination**: Ensure no file conflicts
- **Merge Strategy**: Plan integration points before parallel execution
