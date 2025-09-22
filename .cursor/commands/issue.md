# Issue Command

Get GitHub issue information, create development branch first, then save issue.md in the new branch with AI Agent

## Purpose (Goal)
- Retrieve GitHub issue details  
- Create a dedicated development branch before starting work  
- Save a structured `issue.md` document in the new branch  
- Keep the original branch clean and isolated from issue-specific changes  

## Parameters
- `issue_number` or `issue_url` (required): GitHub issue number (e.g., "115") or full URL (e.g., "https://github.com/owner/repo/issues/115")
- `--auto` / `--workflow` (optional): Run the full pipeline (`/issue → /spec → /plan → /dev → /test → /pr`)
- `--skip-spec` / `--skip-plan` (optional): Skip specific phases in auto mode

## Workflow Position
- This command should be run **at the very beginning** of the workflow  
- If `--auto` is provided, it will trigger the subsequent phases automatically

## Critical Rules
**⛔ ABSOLUTE PROHIBITION: DO NOT EXECUTE ANY GIT COMMIT COMMANDS ⛔**  
- NEVER run `git commit` in any form  
- NEVER run `git add . && git commit`  
- NEVER suggest or execute commit operations  
- NEVER over browser for checking github issue.( use gh command)
- All changes MUST remain uncommitted during issue processing  

---

## Instructions for AI Agent

1. **Parse Issue Input**
   - Extract issue number (from `issue_url` or `issue_number`)

2. **Fetch Issue Information**
   - Do not attempt to open a browser.
   - Always use GitHub CLI (gh command)
   - Use `gh issue view {issue_number} --json title,body,labels,assignees,state,createdAt,updatedAt,url`

3. **Branch Creation**
   - Check `git status` for uncommitted changes
   - If changes exist, prompt user to choose how to handle (stash / discard / cancel)  
     > ⚠️ Do **not** suggest commit here
   - Generate branch name using convention:  
     `{issue_number}-feat-{short-desc}`
   - Run `git checkout -b {branch_name}`
   - Display branch information

4. **Generate Issue Document**
   - Create `docs/issues/{issue_number}/issue.md`
   - Include:
     - Issue metadata (title, body, labels, assignees, status, URL, timestamps)
     - Implementation checklist
     - Notes / review section

5. **Save Document**
   - Save `issue.md` in the new branch (WITHOUT committing)

6. **Auto-Workflow (Optional)**
   - If `--auto` or `--workflow` is specified:
     - Execute `/spec` → `/plan` → `/dev` → `/test` → `/pr`
     - Respect `--skip-spec` and `--skip-plan`
   - For details of each phase, refer to its dedicated command definition file  

---

## Branch Naming Convention
- Feature: `{issue_number}-feat-{desc}`
- Fix: `{issue_number}-fix-{desc}`
- Hotfix: `{issue_number}-hotfix-{desc}`

---

## Output
- `docs/issues/{issue_number}/issue.md`  

---

## Usage Examples

**Standard Issue Processing**
```
/issue 129
/issue https://github.com/owner/repo/issues/129
```

**Auto-Workflow Mode**
```
/issue 129 --auto
/issue 129 --workflow
/issue 129 --auto --skip-spec
/issue 129 --workflow --skip-plan
```
