# Phase 00: Jira/Confluence MCP Setup & OrangeHRM SUT Configuration

**Status**: `[ ]` pending
**Effort**: 1-2 days
**Dependencies**: None (can run parallel with Phase 01)
**Priority**: P1 — must be done before Phase 03

## Overview

Thiết lập kết nối tới Jira/Confluence qua MCP Server để AI có thể đọc User Stories và Requirements trực tiếp. Đồng thời xác nhận OrangeHRM demo làm SUT (System Under Test) cho POC.

---

## Part A: OrangeHRM Demo — SUT Configuration

### Thông tin SUT

| Item | Value |
|---|---|
| **URL** | `https://opensource-demo.orangehrmlive.com` |
| **Username** | `Admin` |
| **Password** | `admin123` |
| **Technology** | React SPA (OrangeHRM 5.x) |
| **Reset** | Demo data reset tự động hàng ngày |

### Các trang có thể test

| Page | URL Path | Test Scenarios |
|---|---|---|
| **Login** | `/web/index.php/auth/login` | Login success/fail, validation |
| **Dashboard** | `/web/index.php/dashboard/index` | Verify elements, navigation |
| **PIM (Employee)** | `/web/index.php/pim/viewEmployeeList` | CRUD employee, search, filter |
| **Leave** | `/web/index.php/leave/viewLeaveList` | Apply leave, approve, reject |
| **Admin** | `/web/index.php/admin/viewSystemUsers` | User management, roles |
| **Recruitment** | `/web/index.php/recruitment/viewCandidates` | Add candidate, track status |

### POC Scenarios (mapped to OrangeHRM)

| # | Scenario | OrangeHRM Page | Gherkin Feature |
|---|---|---|---|
| 1 | Login Flow | Login page | `login.feature` |
| 2 | Create Employee (CRUD) | PIM > Add Employee | `create-employee.feature` |
| 3 | Search Employee | PIM > Employee List | `search-employee.feature` |
| 4 | Apply Leave | Leave > Apply | `apply-leave.feature` |
| 5 | Admin User Mgmt | Admin > Users | `admin-users.feature` |

---

## Part B: Jira/Confluence MCP Server Setup

### Option 1: `mcp-atlassian` (Python — Cloud + Server/DC) ⭐ Recommended

Best maintained, supports cả Cloud và Server/Data Center.

#### Cài đặt

```bash
# Install via pip (Python 3.10+)
pip install mcp-atlassian

# OR via uvx (faster, isolated)
uvx mcp-atlassian --help
```

#### Cấu hình cho IDE (Cursor / Claude Desktop)

Thêm vào file cấu hình MCP của IDE:

**Cho Jira Cloud + Confluence Cloud:**

```json
{
  "mcpServers": {
    "atlassian": {
      "command": "uvx",
      "args": ["mcp-atlassian"],
      "env": {
        "JIRA_URL": "https://your-company.atlassian.net",
        "JIRA_USERNAME": "your-email@company.com",
        "JIRA_API_TOKEN": "your-jira-api-token",
        "CONFLUENCE_URL": "https://your-company.atlassian.net/wiki",
        "CONFLUENCE_USERNAME": "your-email@company.com",
        "CONFLUENCE_API_TOKEN": "your-confluence-api-token"
      }
    }
  }
}
```

**Cho Jira Server / Data Center:**

```json
{
  "mcpServers": {
    "atlassian": {
      "command": "uvx",
      "args": ["mcp-atlassian"],
      "env": {
        "JIRA_URL": "https://jira.your-company.com",
        "JIRA_PERSONAL_TOKEN": "your-personal-access-token"
      }
    }
  }
}
```

#### Tạo API Token (Atlassian Cloud)

1. Truy cập: https://id.atlassian.com/manage-profile/security/api-tokens
2. Nhấn **"Create API token"**
3. Đặt tên: `MCP-POC-Token`
4. Copy token ngay (không hiển thị lại)
5. Lưu vào `.env.test`:
   ```env
   JIRA_URL=https://your-company.atlassian.net
   JIRA_USERNAME=your-email@company.com
   JIRA_API_TOKEN=your-token-here
   CONFLUENCE_URL=https://your-company.atlassian.net/wiki
   CONFLUENCE_USERNAME=your-email@company.com
   CONFLUENCE_API_TOKEN=your-token-here
   ```

#### Tạo Personal Access Token (Server/DC)

1. Trong Jira: Avatar → Profile → **Personal Access Tokens** → Create token
2. Trong Confluence: Avatar → Settings → **Personal Access Tokens**
3. Lưu vào `.env.test`

#### MCP Tools có sẵn

Sau khi kết nối, AI có thể dùng các tools sau:

**Jira Tools:**
| Tool | Mô tả |
|---|---|
| `jira_get_issue` | Đọc chi tiết issue (user story, acceptance criteria) |
| `jira_search` | Tìm issues theo JQL query |
| `jira_get_project_issues` | Lấy tất cả issues trong project |
| `jira_get_sprint_issues` | Issues trong sprint hiện tại |

**Confluence Tools:**
| Tool | Mô tả |
|---|---|
| `confluence_search` | Tìm trang theo CQL |
| `confluence_get_page` | Đọc nội dung trang (requirements, specs) |
| `confluence_get_page_children` | Lấy trang con (sub-pages) |

### Option 2: `@phuc-nt/mcp-atlassian-server` (Node.js)

Nếu muốn giữ toàn bộ stack TypeScript/Node.js:

```bash
npm install -g @phuc-nt/mcp-atlassian-server
```

```json
{
  "mcpServers": {
    "atlassian": {
      "command": "npx",
      "args": ["-y", "@phuc-nt/mcp-atlassian-server"],
      "env": {
        "ATLASSIAN_SITE_URL": "https://your-site.atlassian.net",
        "ATLASSIAN_USER_EMAIL": "your-email@company.com",
        "ATLASSIAN_API_TOKEN": "your-token"
      }
    }
  }
}
```

### Option 3: Local File MCP (Fallback — không cần Jira)

Nếu chưa có Jira/Confluence access, dùng local files:

```
requirements/
├── login-flow.md              # Viết bằng tay hoặc copy từ Jira
├── create-employee-flow.md
└── search-employee-flow.md
```

AI sẽ đọc file local qua filesystem thay vì MCP.
**Đây là fallback cho POC nếu chưa setup được Jira.**

---

## Part C: Tích hợp Jira MCP vào AI Orchestrator

### Cập nhật Step 1 (Gherkin Generation)

```typescript
// ai-agent/steps/step1-gherkin.ts — updated
export async function generateGherkin(source: string): Promise<string> {
  let requirement: string;
  
  if (source.startsWith('JIRA:')) {
    // Đọc từ Jira MCP
    const issueKey = source.replace('JIRA:', '');
    requirement = await jiraMcp.getIssue(issueKey);
    // Returns: summary, description, acceptance criteria
  } else if (source.startsWith('CONFLUENCE:')) {
    // Đọc từ Confluence MCP
    const pageId = source.replace('CONFLUENCE:', '');
    requirement = await confluenceMcp.getPage(pageId);
  } else {
    // Đọc từ local file (fallback)
    requirement = readFileSync(source, 'utf-8');
  }
  
  const gherkinContent = await callLLM(GHERKIN_PROMPT, requirement);
  return gherkinContent;
}
```

### CLI Usage Examples

```bash
# Từ local file
npx ts-node ai-agent/cli.ts requirements/login-flow.md

# Từ Jira issue
npx ts-node ai-agent/cli.ts JIRA:KIT-123

# Từ Confluence page
npx ts-node ai-agent/cli.ts CONFLUENCE:12345
```

---

## Todo List

- [ ] 0.1 Verify OrangeHRM demo accessible (`curl https://opensource-demo.orangehrmlive.com`)
- [ ] 0.2 Test login credentials (Admin / admin123)
- [ ] 0.3 Map OrangeHRM pages to test scenarios
- [ ] 0.4 Choose Jira/Confluence MCP option (Python or Node.js)
- [ ] 0.5 Create Atlassian API token
- [ ] 0.6 Configure MCP server in IDE
- [ ] 0.7 Test MCP connection: read a Jira issue / Confluence page
- [ ] 0.8 Update orchestrator to support `JIRA:` and `CONFLUENCE:` sources
- [ ] 0.9 Write sample requirement in Jira (for demo) OR use local file fallback

## Success Criteria

- [ ] OrangeHRM demo accessible and login works
- [ ] Jira MCP reads at least 1 issue successfully
- [ ] OR: Local file fallback works with markdown requirements
- [ ] Orchestrator supports 3 input sources (local, Jira, Confluence)

## Risk Assessment

| Risk | Impact | Mitigation |
|---|---|---|
| No Jira/Confluence access at KIT | Medium | Use local files as fallback, demo MCP later |
| OrangeHRM demo down/reset | Low | Demo resets daily but is always available |
| API token permissions insufficient | Medium | Request admin to grant read-only access |
| MCP server compatibility issues | Medium | Have 3 options (Python, Node.js, local fallback) |
