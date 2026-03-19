---
description: Run comprehensive tests and ensure code quality before merge
---

## Mission

Write and run comprehensive tests, fix failures, and ensure all tests pass.

## Steps

1. **Understand scope** — Identify what needs testing (new features, bug fixes, refactors)
2. **Write tests**:
   - Unit tests for individual functions/components
   - Integration tests for component interactions
   - Edge case tests for boundary conditions
   - Error scenario tests
3. **Run tests**:
   - Execute test suite with appropriate runner
   - Capture output and analyze results
4. **Fix failures**:
   - DO NOT ignore failing tests
   - DO NOT use fake data, mocks, or tricks just to pass
   - Fix the actual code issues causing failures
   - Re-run tests after each fix
5. **Verify coverage**:
   - Check code coverage report
   - Identify untested paths
   - Add missing test cases
6. **Report results**:
   - Tests passed/failed count
   - Coverage percentage
   - Any remaining issues

## Principles
- Tests must use REAL data, not mocks/fakes just to pass
- All tests must pass before claiming completion
- Test error scenarios, not just happy paths
- Run fresh verification before claiming success
