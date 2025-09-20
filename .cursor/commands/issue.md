# Issue Command

Get GitHub issue information, create development branch first, then save issue.md in the new branch with AI Agent

## Parameters

- `issue_number` or `issue_url` (required): GitHub issue number (e.g., "115") or full GitHub issue URL (e.g., "https://github.com/owner/repo/issues/115")
- `branch_type` (optional): Branch type (feature/fix/hotfix, defaults to feature). Automatically creates development branch before issue document creation
- `output_path` (optional): Output file path (defaults to docs/issues/{issue_number}/issue.md)
- `no_branch` (optional): Set to true to skip branch creation and only retrieve issue information
- `--auto` or `--workflow` (optional): Enable auto-workflow mode to execute full development pipeline (issue → spec → plan → dev → test → pr)
- `--skip-spec` (optional): Skip spec generation in auto-workflow mode
- `--skip-plan` (optional): Skip plan generation in auto-workflow mode

## Instructions

Retrieve GitHub issue information, create development branch first, then save issue.md file in the new branch through interactive AI Agent collaboration.

**Key Improvement**: The workflow now creates the development branch BEFORE saving the issue document, ensuring that:
- The original branch remains clean
- All issue-related files are contained within the feature branch
- Better separation of concerns between different issues
- Easier rollback if branch creation fails

**Instructions for AI Agent:**

**⛔ ABSOLUTE PROHIBITION: DO NOT EXECUTE ANY GIT COMMIT COMMANDS ⛔**
- NEVER run `git commit` in any form
- NEVER run `git add . && git commit`
- NEVER suggest or execute commit operations
- Issue processing phase MUST end with uncommitted changes

1. **Parse Issue Input**: Determine if input is issue number or URL and extract the issue number
   - If `issue_url` is provided: Extract issue number from URL (e.g., from "https://github.com/owner/repo/issues/115" extract "115")
   - If `issue_number` is provided: Use directly
2. **Fetch Issue Information**: Use GitHub CLI to retrieve issue details
3. **Branch Creation (Default)**: Unless `no_branch` is set to true, create development branch FIRST:
   - Use `branch_type` parameter (defaults to "feature")
   - Check Git status for uncommitted changes
   - Handle uncommitted changes with user interaction (stash/discard/commit/cancel)
   - Generate appropriate branch name based on issue and branch type
   - Create and checkout new branch
   - Display branch information
4. **Generate Issue Document**: Create a structured issue document with status, description, and implementation tracking (in the new branch)
5. **Save Document**: Save the issue information to {output_path} (default: docs/issues/{issue_number}/issue.md) in the new branch (WITHOUT committing)
6. **Auto-Workflow Execution (Optional)**: If `--auto` or `--workflow` is specified, execute full development pipeline:
   - Execute `/spec {issue_number}` (unless `--skip-spec` is specified)
   - Execute `/plan {issue_number}` (unless `--skip-plan` is specified)
   - Execute `/dev {issue_number}`
   - Execute `/test {issue_number}`
   - Execute `/pr {issue_number}`
   - Handle errors at each stage and provide appropriate feedback
   - Display progress and completion status

**Process:**
- Parse input to extract issue number from URL if needed
- Use `gh issue view {issue_number} --json title,body,labels,assignees,state,createdAt,updatedAt,url` to fetch data
- Unless `no_branch` is true: Execute integrated branch creation workflow first
- Generate structured issue document in Markdown format (after branch creation)
- Include status, description, implementation status checklist
- Create output directory if needed
- Save to specified file path with UTF-8 encoding in the new branch (WITHOUT committing)
- If `--auto` or `--workflow` is specified: Execute auto-workflow pipeline with progress tracking

**🚨 CRITICAL: NEVER COMMIT CHANGES DURING ISSUE PROCESSING 🚨**

**STRICT RULE**: Do NOT use `git commit`, `git add && git commit`, or any commit commands during issue processing phase.
- All changes MUST remain uncommitted
- Changes will be committed later in the `/pr` phase
- This ensures proper workflow separation and testing before committing
- Violating this rule breaks the development workflow

**Branch Creation Workflow (default behavior, unless no_branch=true):**
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

**Default Behavior:**
- By default, creates a feature branch BEFORE issue document creation
- Issue document is saved in the new branch, keeping the original branch clean
- Use `no_branch=true` to skip branch creation (legacy behavior)
- `branch_type` defaults to "feature" if not specified
- All existing `/issue` command functionality is preserved
- Auto-workflow mode (`--auto` or `--workflow`) executes full development pipeline automatically

**Auto-Workflow Pipeline:**
When `--auto` or `--workflow` is specified, the following sequence is executed:
1. **Issue Processing**: Standard issue retrieval and branch creation
2. **Spec Generation**: `/spec {issue_number}` (skipped if `--skip-spec`)
3. **Plan Creation**: `/plan {issue_number}` (skipped if `--skip-plan`)
4. **Development**: `/dev {issue_number}` with interactive development
5. **Testing**: `/test {issue_number}` with test execution and evidence collection
6. **Pull Request**: `/pr {issue_number}` with commit and PR creation

**Auto-Workflow Features:**
- **Progress Tracking**: Real-time progress display with stage indicators
- **Error Handling**: Graceful error handling with detailed error messages
- **Stage Skipping**: Optional spec/plan skipping for rapid development
- **Interactive Mode**: User interaction at critical decision points
- **Rollback Support**: Ability to stop and rollback on errors
- **Log Generation**: Comprehensive execution log for troubleshooting

**Usage Examples:**

**Standard Issue Processing:**
```
/issue 129
/issue https://github.com/owner/repo/issues/129
/issue 129 branch_type=fix
/issue 129 no_branch=true
```

**Auto-Workflow Mode:**
```
/issue 129 --auto
/issue 129 --workflow
/issue 129 --auto --skip-spec
/issue 129 --workflow --skip-plan
/issue 129 --auto --skip-spec --skip-plan branch_type=fix
```

**Parameters:**
- **Issue**: {issue_number or issue_url}
- **Branch Type**: {branch_type (defaults to feature)}
- **No Branch**: {no_branch (optional, set to true to skip branch creation)}
- **Auto-Workflow**: {--auto or --workflow (optional, enables full pipeline)}
- **Skip Spec**: {--skip-spec (optional, skips spec generation in auto mode)}
- **Skip Plan**: {--skip-plan (optional, skips plan generation in auto mode)}
- **Output**: {output_path}
