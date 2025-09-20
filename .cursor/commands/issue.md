# Issue Command

Get GitHub issue information, save to issue.md, and optionally create development branch with AI Agent

## Parameters

- `issue_number` or `issue_url` (required): GitHub issue number (e.g., "115") or full GitHub issue URL (e.g., "https://github.com/owner/repo/issues/115")
- `branch_type` (optional): Branch type (feature/fix/hotfix, defaults to feature). If provided, automatically creates development branch after issue retrieval
- `output_path` (optional): Output file path (defaults to docs/issues/{issue_number}/issue.md)

## Instructions

Retrieve GitHub issue information, save to issue.md file, and optionally create development branch through interactive AI Agent collaboration.

**Instructions for AI Agent:**

1. **Parse Issue Input**: Determine if input is issue number or URL and extract the issue number
   - If `issue_url` is provided: Extract issue number from URL (e.g., from "https://github.com/owner/repo/issues/115" extract "115")
   - If `issue_number` is provided: Use directly
2. **Fetch Issue Information**: Use GitHub CLI to retrieve issue details
3. **Generate Issue Document**: Create a structured issue document with status, description, and implementation tracking
4. **Save Document**: Save the issue information to {output_path} (default: docs/issues/{issue_number}/issue.md)
5. **Branch Creation (Optional)**: If `branch_type` is provided, automatically create development branch:
   - Check Git status for uncommitted changes
   - Handle uncommitted changes with user interaction (stash/discard/commit/cancel)
   - Generate appropriate branch name based on issue and branch type
   - Create and checkout new branch
   - Display branch information

**Process:**
- Parse input to extract issue number from URL if needed
- Use `gh issue view {issue_number} --json title,body,labels,assignees,state,createdAt,updatedAt,url` to fetch data
- Generate structured issue document in Markdown format
- Include status, description, implementation status checklist
- Create output directory if needed
- Save to specified file path with UTF-8 encoding
- If `branch_type` is provided: Execute integrated branch creation workflow

**Branch Creation Workflow (when branch_type is provided):**
- Check `git status` for uncommitted changes in working directory
- If changes exist, present options to user:
  - **Stash**: Save changes temporarily (`git stash`)
  - **Discard**: Discard changes (`git checkout -- .`)
  - **Commit**: Commit changes with appropriate message
  - **Cancel**: Abort branch creation (issue document still saved)
- Generate branch name using convention: `{issue_number}-{branch_type}-{description}`
- Execute `git checkout -b {branch_name}` to create and switch to new branch
- Display branch URL and current status

**Branch Naming Convention:**
- Feature: `{issue_number}-feat-{description}`
- Fix: `{issue_number}-fix-{description}`
- Hotfix: `{issue_number}-hotfix-{description}`

**Backward Compatibility:**
- When `branch_type` is omitted, command behaves exactly as before (issue retrieval only)
- All existing `/issue` command functionality is preserved
- No breaking changes to existing workflows

**Issue**: {issue_number or issue_url}
**Branch Type**: {branch_type (optional)}
**Output**: {output_path}
