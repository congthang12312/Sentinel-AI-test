# Phase 04: Scale — 2-4 More Scenarios

**Status**: `[ ]` pending
**Effort**: 3-4 days
**Dependencies**: Phase 03 (login scenario passing)

## Overview

Mở rộng POC với 2-4 kịch bản nghiệp vụ thêm để chứng minh AI xử lý được nhiều loại tương tác UI khác nhau (CRUD, navigation, form validation, data tables).

## Proposed Scenarios

| # | Scenario | Complexity | UI Elements |
|---|---|---|---|
| 2 | Create New Data (CRUD) | Medium | Form, inputs, dropdowns, submit |
| 3 | View/Search Reports | Medium | Table, search, filters, pagination |
| 4 | Edit Existing Record | Medium | Pre-filled form, update, confirmation |
| 5 | User Profile/Settings | Easy | Navigation, toggle, save |

> Chọn 2-3 scenarios tùy vào SUT có sẵn những trang nào.

## Implementation Steps (Per Scenario)

### For each scenario, repeat:

1. **Write requirement** → `requirements/{scenario-name}.md`
2. **Prepare fixtures** → `fixtures/{scenario-name}/*.json`
3. **Run pipeline** → `npx ts-node ai-agent/cli.ts requirements/{scenario-name}.md`
4. **Validate** → Review generated .feature, steps, POM
5. **Debug** → Fix until tests pass
6. **Verify** → Full pipeline end-to-end

### 4.1 Create Data Flow

**`requirements/create-data-flow.md`**:
```markdown
# Create New User

## User Story
As an admin, I want to create a new user account
so that new team members can access the system.

## Acceptance Criteria
1. Navigate to User Management page
2. Click "Tạo mới" button
3. Fill form: Name, Email, Role (dropdown), Phone
4. Click "Lưu" button
5. Success message appears
6. New user appears in the user list

## Validation Rules
- Email must be valid format
- Name is required (min 2 chars)
- Role must be selected from dropdown
```

### 4.2 Report/Search Flow

**`requirements/report-flow.md`**:
```markdown
# View and Search Reports

## User Story
As a manager, I want to search and view reports
so that I can track team performance.

## Acceptance Criteria
1. Navigate to Reports page
2. Use search bar to filter by keyword
3. Results update in table
4. Click on a report row to view details
5. Report detail page shows full information
```

## Todo List

- [ ] 4.1 Write create-data requirement + fixtures
- [ ] 4.2 Run pipeline for create-data → test passes
- [ ] 4.3 Write report-flow requirement + fixtures
- [ ] 4.4 Run pipeline for report-flow → test passes
- [ ] 4.5 (Optional) Additional scenario(s)
- [ ] 4.6 All scenarios pass together: `npx cucumber-js`

## Success Criteria

- [ ] AI generates correct different POM classes per page
- [ ] AI handles various UI elements (forms, tables, dropdowns, search)
- [ ] ≥ 3 total scenarios passing (including login from Phase 03)
- [ ] Fixtures pattern applied consistently
- [ ] No hardcoded data in any step definition

## Risk Assessment

| Risk | Impact | Mitigation |
|---|---|---|
| SUT pages have complex dynamic UI | High | Focus on simpler pages first, skip complex ones |
| AI reuses wrong POM for different pages | Medium | Clear page URL in prompt, separate POM files |
| Test data conflicts between scenarios | Medium | Unique fixture files per scenario, cleanup in After hooks |
