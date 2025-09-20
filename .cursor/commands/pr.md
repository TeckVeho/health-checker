# PR Command

Create Pull Request with streamlined 2-step process: commit changes and GitHub PR creation with automatic issue linking

## Parameters

- `issue_number` (optional): Issue number. If omitted, uses the most recently processed issue from previous `/issue` command
- `auto_link` (optional): Automatically link PR to issue (defaults to true)

## Instructions

Create Pull Request through interactive AI Agent collaboration with streamlined 2-step process and automatic issue linking.

**Instructions for AI Agent:**

**🔗 CRITICAL: AUTOMATIC ISSUE LINKING 🔗**
- ALWAYS link PR to the corresponding issue
- Use "Closes #{issue_number}" in commit messages and PR body
- Ensure GitHub automatically closes the issue when PR is merged
- This maintains proper issue tracking and project management

**Streamlined Workflow**: This command handles committing changes and creating PR with automatic issue linking. Development should be done with `/dev` (no commits), tested with `/test`, then committed and PR created with `/pr`.

## Step 0: Issue Number Determination

1. **Determine Issue Number**: 
   - If `issue_number` is provided: Use the specified issue number
   - If `issue_number` is omitted: Look for the most recently created issue document in `docs/issues/*/issue.md` to determine the issue number
   - Check for existing `docs/issues/{issue_number}/issue.md` file to ensure issue data is available

## Step 1: Git Status Validation, Commit, and User Confirmation

1. **Check Git Status**: Run `git --no-pager status` to show current repository state (with pager disabled)
2. **Display Status Summary**: Show all modified, added, and deleted files with status indicators using `git --no-pager diff --name-status origin/develop..HEAD`
3. **Commit Changes**: If there are uncommitted changes:
   - Stage all changes with `git add .`
   - Create commit with descriptive message based on issue and changes
   - Use format: `feat/fix/docs: {description} - Closes #{issue_number}`
4. **User Confirmation**: Ask user "Do you want to create a PR? (y/n)" and wait for confirmation
5. **Proceed Only if Confirmed**: Continue to Step 2 only if user confirms with 'y' or 'yes'

## Step 2: Commit and Push Verification

1. **Check Uncommitted Changes**: Run `git --no-pager status --porcelain 2>$null` to check for uncommitted changes (with pager disabled)
2. **Stage and Commit Changes**: If uncommitted changes exist:
   - Run `git add . > $null 2>&1` to stage all changes
   - Create comprehensive commit message including:
     - Issue reference and main changes
     - Key improvements and features
     - Test results summary
     - "Closes #{issue_number}" to auto-close issue
   - Run `git commit -m "..." --no-edit --quiet > $null 2>&1` with detailed message
3. **Push to Remote**: Check if local branch exists on remote:
   - Run `git push origin {current_branch} --quiet --no-progress` to push commits
   - Ensure remote branch is up to date before PR creation

## Step 3: GitHub Pull Request Creation with Issue Linking

1. **Fetch Issue Data**: Get issue #{issue_number} information using optimized caching strategy (cached local file first, GitHub CLI fallback)
2. **Generate PR Content**: Create PR title and body with automatic issue linking:
   - Title: Based on issue title with proper prefix (feat/fix/docs)
   - Body: Include issue reference and "Closes #{issue_number}" for automatic linking
   - Add implementation summary and key changes
3. **Create GitHub PR**: Use `gh pr create` command to create pull request:
   - Title: `{type}: {issue_title}`
   - Body: Auto-generated with issue linking
   - Base branch: `develop`
   - Head branch: Current branch
4. **Handle PR Creation Errors**: If PR creation fails:
   - Check if commits exist between base and head branches
   - Verify remote branch is properly pushed
   - Retry PR creation after resolving issues
5. **Display PR Information**: Show created PR URL and linked issue status
6. **Confirmation**: Confirm successful PR creation and issue linking

**Process Flow:**
```
Step 0: Issue Number Determination
├── Check if issue_number is provided
├── If not, auto-detect from docs/issues/*/issue.md
└── Verify issue exists and is accessible

Step 1: Git Status Check and Commit
├── Run git --no-pager status (pager disabled)
├── Display file changes with git --no-pager diff --name-status origin/develop..HEAD
├── Commit changes with "Closes #{issue_number}" message
└── Ask: "Do you want to create a PR? (y/n)"

Step 2: Commit and Push Verification
├── Check git --no-pager status --porcelain 2>$null for uncommitted changes (pager disabled)
├── If changes exist: git add . > $null 2>&1 && git commit -m "..." --no-edit --quiet > $null 2>&1
├── Push to remote: git push origin {current_branch} --quiet --no-progress
└── Verify remote branch is up to date

Step 3: GitHub PR Creation with Issue Linking
├── Fetch issue data for PR content generation
├── Generate PR title and body with "Closes #{issue_number}"
├── Run gh pr create --title "..." --body "..." --base develop
├── Handle errors: check commits between branches, retry if needed
├── Display PR URL and linked issue status
└── Confirm completion and issue linking
```

**Auto-Detection Process:**
- Search `docs/issues/*/issue.md` files for the most recently modified file
- Extract issue number from the directory structure
- Verify the issue exists and is accessible via GitHub CLI

**Issue Data Retrieval Optimization:**
- **Cache Strategy**: Reuse existing issue.md files to avoid repeated GitHub API calls
- **Fallback Support**: Automatic GitHub API fallback if cached data unavailable
- **Speed Improvement**: 1-2 seconds faster execution by eliminating redundant API calls

**🔗 Issue Linking Requirements:**
- **Commit Messages**: MUST include "Closes #{issue_number}" for automatic issue closure
- **PR Body**: MUST include "Closes #{issue_number}" to link PR to issue
- **PR Title**: Should follow format "{type}: {issue_title}" for consistency
- **Verification**: Confirm issue linking is successful after PR creation

**Required Commands:**
- `git --no-pager status` - Check repository state (with pager disabled)
- `git --no-pager status --porcelain 2>$null` - Check for uncommitted changes (with pager disabled)
- `git --no-pager diff --name-status origin/develop..HEAD` - Show file changes (with pager disabled)
- `git add . > $null 2>&1` - Stage all changes (if needed)
- `git commit -m "..." --no-edit --quiet > $null 2>&1` - Commit changes with "Closes #{issue_number}" (if needed)
- `git push origin {branch} --quiet --no-progress` - Push commits to remote (if needed)
- `gh issue view {issue_number} --json title,body,labels,assignees,state,createdAt,updatedAt,url` - Get issue data for PR content
- `gh pr create --title "..." --body "..." --base develop` - Create GitHub PR with issue linking

**Key Features:**
- **Streamlined Process**: Removed pr.md creation step for faster execution
- **Automatic Issue Linking**: Every PR automatically links to its corresponding issue
- **Consistent Formatting**: Standardized PR titles and commit messages
- **Error Handling**: Robust error handling for Git and GitHub operations

**Issue**: {issue_number or auto-detected}
**Auto Link**: {auto_link (defaults to true)}
