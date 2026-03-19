# Phase 05: Self-Healing & Polish

**Status**: `[ ]` pending
**Effort**: 2-3 days
**Dependencies**: Phase 04 (≥3 scenarios passing)

## Overview

Triển khai self-healing mechanism: khi test fail do UI thay đổi, AI tự phát hiện locator cũ bị hỏng, quét lại trang web qua Playwright MCP, và sinh locator mới. Đồng thời polish toàn bộ POC cho demo.

## Implementation Steps

### 5.1 Self-Healing Mechanism

**`ai-agent/steps/self-healing.ts`**:
```typescript
export async function selfHeal(
  failedTest: TestResult,
  pomFile: string,
  pageUrl: string
): Promise<string> {
  // 1. Parse error → identify which locator failed
  const failedLocator = extractFailedLocator(failedTest.error);
  
  // 2. Re-scan page via Playwright MCP
  const freshSnapshot = await getAccessibilitySnapshot(pageUrl);
  
  // 3. Ask LLM to find new locator
  const healPrompt = `
    The locator "${failedLocator}" no longer works on this page.
    Here is the current Accessibility Tree:
    ${freshSnapshot}
    
    Find the correct replacement locator using getByRole() or getByLabel().
    Return ONLY the new locator code.
  `;
  const newLocator = await callLLM(SYSTEM_PROMPT, healPrompt);
  
  // 4. Update POM file with new locator
  const updatedPOM = replaceLoctorInPOM(pomFile, failedLocator, newLocator);
  
  return updatedPOM;
}
```

### 5.2 Integrate Self-Healing into Pipeline

Update `ai-agent/orchestrator.ts` Step 3:
```typescript
// In runPipeline(), after test failure:
if (!testResult.success) {
  for (let retry = 0; retry < 3; retry++) {
    console.log(`🔄 Self-healing attempt ${retry + 1}/3`);
    
    // Identify failed step + locator
    const failureInfo = parseTestFailure(testResult.output);
    
    // Re-scan page and heal
    const healedPOM = await selfHeal(failureInfo, pomFile, pageUrl);
    writeFileSync(pomFile, healedPOM);
    
    // Re-run tests
    testResult = await runCucumberTests();
    if (testResult.success) {
      console.log(`✅ Self-healed after ${retry + 1} attempts!`);
      break;
    }
  }
}
```

### 5.3 Demo: Simulate UI Change

Để demo self-healing cho stakeholder:
1. Chạy login test → PASS
2. Thay đổi login page element (e.g., đổi button text "Đăng nhập" → "Login")
3. Chạy lại test → FAIL
4. Self-healing tự kích hoạt:
   - AI phát hiện button locator cũ không match
   - Playwright MCP quét lại trang → tìm thấy button "Login" 
   - AI cập nhật POM locator
   - Re-run test → PASS

### 5.4 Polish: Error Reporting

Add clear error messages + suggestions:
```typescript
// When self-healing fails after 3 retries
console.log(`
❌ Self-healing failed after 3 attempts.
📋 Failed locator: ${failedLocator}
🔍 Page snapshot saved: reports/failed-snapshot.txt
💡 Suggestions:
   1. Check if the page URL has changed
   2. Verify the element still exists on the page
   3. Manually inspect the page and update POM
`);
```

### 5.5 Polish: Summary Report

Generate final run summary:
```
╔══════════════════════════════════════════╗
║  AI-Powered Automation Testing - Report ║
╠══════════════════════════════════════════╣
║ Scenarios generated: 5                  ║
║ Scenarios passed:    4 ✅               ║
║ Scenarios failed:    1 ❌               ║
║ Self-healed:         2 🔄               ║
║ Time saved:          ~3 hours           ║
║ HTML Report: reports/cucumber-report.html║
╚══════════════════════════════════════════╝
```

### 5.6 Documentation

Write `README.md` with:
- Project overview
- How to run the pipeline
- How to add new scenarios
- Architecture diagram
- Demo video/screenshots

## Todo List

- [ ] 5.1 Implement self-healing mechanism
- [ ] 5.2 Integrate into orchestrator pipeline
- [ ] 5.3 Demo: simulate UI change → self-heal → test pass
- [ ] 5.4 Polish error reporting
- [ ] 5.5 Summary report generation
- [ ] 5.6 Write README.md documentation

## Success Criteria

- [ ] Self-healing demo: locator change → auto-fixed → test passes
- [ ] ≤ 3 retry attempts for self-healing
- [ ] All scenarios still pass after self-healing
- [ ] Clear error messages when self-healing fails
- [ ] Final report shows metrics (pass rate, time saved, self-healed count)
- [ ] README.md complete for handoff

## Risk Assessment

| Risk | Impact | Mitigation |
|---|---|---|
| Self-healing generates wrong locator | High | Limit to 3 retries, fallback to manual fix |
| Page structure changes too drastically | High | Self-healing works for minor changes, not redesigns |
| Demo doesn't look impressive | Medium | Pre-prepare the UI change scenario, rehearse |
