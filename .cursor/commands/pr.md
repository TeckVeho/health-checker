# PR Command

Create Pull Request with 3-step process: validation, documentation, and GitHub PR creation

## Parameters

- `issue_number` (optional): Issue number. If omitted, uses the most recently processed issue from previous `/issue` command
- `output_path` (optional): Output directory path (defaults to docs/issues/{issue_number}/pr.md)

## Instructions

Create Pull Request through interactive AI Agent collaboration with 3-step process.

**Instructions for AI Agent:**

## Step 0: Issue Number Determination

1. **Determine Issue Number**: 
   - If `issue_number` is provided: Use the specified issue number
   - If `issue_number` is omitted: Look for the most recently created issue document in `docs/issues/*/issue.md` to determine the issue number
   - Check for existing `docs/issues/{issue_number}/issue.md` file to ensure issue data is available

## Step 1: Git Status Validation and User Confirmation

1. **Check Git Status**: Run `git status` to show current repository state
2. **Display Status Summary**: Show all modified, added, and deleted files with status indicators
3. **User Confirmation**: Ask user "PRを作成してよろしいですか？ (y/n)" and wait for confirmation
4. **Proceed Only if Confirmed**: Continue to Step 2 only if user confirms with 'y' or 'yes'

## Step 2: PR Documentation Creation

1. **Fetch Issue Data**: Get issue #{issue_number} information using GitHub CLI
2. **Generate PR Content**: Create PR documentation using integrated template structure:
   - Include issue title, description, and related information
   - Add current branch and target branch information
   - Include file changes and implementation details
   - Generate structured PR documentation
3. **Save Documentation**: Save to `docs/issues/{issue_number}/pr.md`
4. **User Confirmation**: Show created pr.md content and ask "この内容でPRを作成してよろしいですか？ (y/n)"
5. **Proceed Only if Confirmed**: Continue to Step 3 only if user confirms

**PR Documentation Structure:**
```markdown
## Description
{pull_request_description}

## Cursor Log
{development_process_log}

## Evidence
{implementation_evidence}
```

## Step 3: GitHub Pull Request Creation

1. **Create GitHub PR**: Use `gh pr create` command to create pull request:
   - Title: Based on issue title and implementation
   - Body: Use content from created pr.md file
   - Base branch: `develop`
   - Head branch: Current branch
2. **Display PR Information**: Show created PR URL and status
3. **Confirmation**: Confirm successful PR creation

**Process Flow:**
```
Step 0: Issue Number Determination
├── Check if issue_number is provided
├── If not, auto-detect from docs/issues/*/issue.md
└── Verify issue exists and is accessible

Step 1: Git Status Check
├── Run git status
├── Display file changes
└── Ask: "PRを作成してよろしいですか？ (y/n)"

Step 2: PR Documentation
├── Fetch issue #{issue_number} data
├── Generate pr.md content using integrated template
├── Save to docs/issues/{issue_number}/pr.md
└── Ask: "この内容でPRを作成してよろしいですか？ (y/n)"

Step 3: GitHub PR Creation
├── Run gh pr create --title "..." --body "..." --base develop
├── Display PR URL
└── Confirm completion
```

**Auto-Detection Process:**
- Search `docs/issues/*/issue.md` files for the most recently modified file
- Extract issue number from the directory structure
- Verify the issue exists and is accessible via GitHub CLI

**Required Commands:**
- `git status` - Check repository state
- `gh issue view {issue_number} --json title,body,labels,assignees,state,createdAt,updatedAt,url` - Get issue data
- `gh pr create --title "..." --body "..." --base develop` - Create GitHub PR

**Issue**: {issue_number or auto-detected}
**Output**: {output_path}
