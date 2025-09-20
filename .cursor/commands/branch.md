# Branch Command

Create branch for issue with AI Agent

## Parameters

- `issue_number` (optional): Issue number. If omitted, uses the most recently processed issue from previous `/issue` command
- `branch_type` (required): Branch type (feature/fix/hotfix)

## Instructions

Create a new branch for the specified issue through interactive AI Agent collaboration.

**Instructions for AI Agent:**

1. **Determine Issue Number**: 
   - If `issue_number` is provided: Use the specified issue number
   - If `issue_number` is omitted: Look for the most recently created issue document in `docs/issues/*/issue.md` to determine the issue number
   - Check for existing `docs/issues/{issue_number}/issue.md` file to ensure issue data is available
2. **Check Git Status**: Check for uncommitted changes in the working directory
3. **Handle Uncommitted Changes**: If changes exist, present options to the user:
   - **Stash**: Save changes temporarily (`git stash`)
   - **Discard**: Discard changes (`git checkout -- .`)
   - **Commit**: Commit changes (`git commit -m "message" --no-edit --quiet`)
   - **Cancel**: Abort branch creation
4. **Generate Branch Name**: Create branch name based on issue number and type
5. **Create Branch**: Create and checkout the new branch
6. **Display Information**: Show branch URL and status

**Branch Naming Convention:**
- Feature: `{issue_number}-feat-{description}`
- Fix: `{issue_number}-fix-{description}`
- Hotfix: `{issue_number}-hotfix-{description}`

**Interactive Process:**
- Determine issue number (from parameter or most recent `/issue` command)
- Check `git status` for uncommitted changes
- If changes exist, ask user to choose: stash/discard/commit/cancel
- Generate appropriate branch name
- Execute `git checkout -b {branch_name}`
- Display branch information

**Auto-Detection Process:**
- Search `docs/issues/*/issue.md` files for the most recently modified file
- Extract issue number from the directory structure
- Verify the issue exists and is accessible

**Issue**: {issue_number or auto-detected}
**Type**: {branch_type}
