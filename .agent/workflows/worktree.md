---
description: Create isolated git worktree for parallel feature development
---

# Worktree — Git Worktree Management

Create isolated git worktrees for parallel feature development without branch switching.

## Usage

```
/worktree <feature description>
```

## What is a Git Worktree?
A worktree lets you have multiple branches checked out simultaneously in separate directories. Instead of `git stash` + `git checkout`, you just `cd` to a different folder.

## Workflow

### Step 1: Detect Branch Prefix

From user's description, auto-detect branch type:

| Keywords | Prefix |
|---|---|
| "fix", "bug", "error", "issue" | `fix` |
| "refactor", "restructure", "rewrite" | `refactor` |
| "docs", "documentation", "readme" | `docs` |
| "test", "spec", "coverage" | `test` |
| "chore", "cleanup", "deps" | `chore` |
| "perf", "performance", "optimize" | `perf` |
| Default | `feat` |

### Step 2: Generate Branch Name

Convert description to slug:
- "add authentication system" → `feat/add-auth`
- "fix login validation bug" → `fix/login-validation-bug`
- Max 50 chars, kebab-case

### Step 3: Get Base Branch

```bash
# Get current default branch
git symbolic-ref refs/remotes/origin/HEAD 2>/dev/null | sed 's@^refs/remotes/origin/@@'
# Fallback: main or master
```

### Step 4: Create Worktree

```bash
# Fetch latest
git fetch origin

# Determine worktree path (sibling directory)
# Example: if project is at ~/projects/my-app
# Worktree goes to ~/projects/my-app-feat-add-auth

# Create worktree
git worktree add -b <prefix>/<slug> ../<project-name>-<slug> origin/<base-branch>
```

### Step 5: Install Dependencies

Detect and run package manager in the new worktree:

```bash
# Auto-detect from lock files:
# bun.lock     → bun install
# pnpm-lock.yaml → pnpm install
# yarn.lock    → yarn install
# package-lock.json → npm install
# requirements.txt → pip install -r requirements.txt
# Cargo.toml   → cargo build
# go.mod       → go mod download
```

### Step 6: Copy Environment Files

```bash
# Copy .env files (if .env.example exists)
cp .env.example ../<worktree-dir>/.env 2>/dev/null
# Or copy existing .env if no example
cp .env ../<worktree-dir>/.env 2>/dev/null
```

### Step 7: Report

```
✅ Worktree created!
📁 Path: ../<project>-<slug>
🌿 Branch: <prefix>/<slug>
📦 Dependencies: installed

To start working:
  cd ../<project>-<slug>

To remove when done:
  git worktree remove ../<project>-<slug>
  git branch -d <prefix>/<slug>
```

## Other Worktree Commands

```bash
# List all worktrees
git worktree list

# Remove a worktree
git worktree remove <path>

# Prune stale worktree entries
git worktree prune
```

## Notes
- Worktrees share the same `.git` history — commits in one are visible in others
- Each worktree must be on a different branch
- Prefer sibling directories to avoid nesting issues
