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

**📄 CRITICAL: PR BODY SAVING 📄**
- **CREATE pr.md FILES**: This command MUST create pr.md files in docs/issues/{issue_number}/ before committing
- **Evidence Section**: Include test results and execution commands in PR body
- **Pre-commit Documentation**: Save PR body content locally for tracking and review

**Streamlined Workflow**: This command handles committing changes and creating PR with automatic issue linking. Development should be done with `/dev` (no commits), tested with `/test`, then committed and PR created with `/pr`.

## Step 0: Issue Number Determination

1. **Determine Issue Number**: 
   - If `issue_number` is provided: Use the specified issue number
   - If `issue_number` is omitted: Look for the most recently created issue document in `docs/issues/*/issue.md` to determine the issue number
   - Check for existing `docs/issues/{issue_number}/issue.md` file to ensure issue data is available

## Step 1: Git Status Validation and PR Body Generation

1. **Check Git Status**: Run `git --no-pager status` to show current repository state (with pager disabled)
2. **Display Status Summary**: Show all modified, added, and deleted files with status indicators using `git --no-pager diff --name-status origin/develop..HEAD`
3. **Fetch Issue Data**: Get issue #{issue_number} information using optimized caching strategy (cached local file first, GitHub CLI fallback)
4. **Load Test Results**: Read test results from `docs/issues/{issue_number}/evidence/test-results.json` if available
5. **Generate PR Body**: Create comprehensive PR body including:
   - Issue reference and "Closes #{issue_number}" for automatic linking
   - Implementation summary and key changes
   - **Evidence Section** with test results and execution details
6. **Save PR Body**: Write PR body content to `docs/issues/{issue_number}/pr.md` **BEFORE** committing
7. **Display PR Body Preview**: Show generated PR body content for user review
8. **User Confirmation**: Ask user "Do you want to create a PR? (y/n)" and wait for confirmation
9. **Proceed Only if Confirmed**: Continue to Step 2 only if user confirms with 'y' or 'yes'

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

1. **Create GitHub PR**: Use `gh pr create` command to create pull request:
   - Title: `{type}: {issue_title}`
   - Body: Generated PR body with Evidence section
   - Base branch: `develop`
   - Head branch: Current branch
2. **Handle PR Creation Errors**: If PR creation fails:
   - Check if commits exist between base and head branches
   - Verify remote branch is properly pushed
   - Retry PR creation after resolving issues
3. **Display PR Information**: Show created PR URL and linked issue status
4. **Confirmation**: Confirm successful PR creation and issue linking

**Process Flow:**
```
Step 0: Issue Number Determination
├── Check if issue_number is provided
├── If not, auto-detect from docs/issues/*/issue.md
└── Verify issue exists and is accessible

Step 1: Git Status Check and PR Body Generation
├── Run git --no-pager status (pager disabled)
├── Display file changes with git --no-pager diff --name-status origin/develop..HEAD
├── Fetch issue data for PR content generation
├── Load test results from docs/issues/{issue_number}/evidence/test-results.json
├── Generate PR body with Evidence section including test results
├── Save PR body to docs/issues/{issue_number}/pr.md BEFORE committing
├── Display PR body preview for user review
└── Ask: "Do you want to create a PR? (y/n)"

Step 2: Commit and Push Verification
├── Check git --no-pager status --porcelain 2>$null for uncommitted changes (pager disabled)
├── If changes exist: git add . > $null 2>&1 && git commit -m "..." --no-edit --quiet > $null 2>&1
├── Push to remote: git push origin {current_branch} --quiet --no-progress
└── Verify remote branch is up to date

Step 3: GitHub PR Creation with Issue Linking
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

**Evidence Section Implementation Details:**

1. **Test Results Loading**:
   - Read `docs/issues/{issue_number}/evidence/test-results.json`
   - Parse backend and frontend test results
   - Extract test counts, pass/fail status, coverage data
   - **CRITICAL: NO TEST RESULT FALSIFICATION**: If test results are missing or unavailable, explicitly state "No test results available" - NEVER create fake or simulated test results

2. **Test Summary Generation**:
   - **If test results exist**: Format backend test results: "X tests passed, Y tests failed (Z.Xs)"
   - **If test results exist**: Format frontend test results: "X tests passed, Y tests failed (Z.Xs)"
   - **If test results exist**: Calculate total execution time
   - **If test results exist**: Determine overall status (PASSED/FAILED/PARTIAL)
   - **If NO test results**: Display "⚠️ No test results available - Tests have not been executed or results are not accessible"

3. **Failed Test Details**:
   - If any tests failed, include detailed failure information
   - Show failed test names and error messages
   - Include stack traces for debugging

4. **Coverage Information**:
   - Display coverage percentages for statements, branches, functions, lines
   - Include coverage trends if available
   - Highlight low coverage areas

**Required Commands:**
- `git --no-pager status` - Check repository state (with pager disabled)
- `git --no-pager status --porcelain 2>$null` - Check for uncommitted changes (with pager disabled)
- `git --no-pager diff --name-status origin/develop..HEAD` - Show file changes (with pager disabled)
- `git add . > $null 2>&1` - Stage all changes (if needed)
- `git commit -m "..." --no-edit --quiet > $null 2>&1` - Commit changes with "Closes #{issue_number}" (if needed)
- `git push origin {branch} --quiet --no-progress` - Push commits to remote (if needed)
- `gh issue view {issue_number} --json title,body,labels,assignees,state,createdAt,updatedAt,url` - Get issue data for PR content
- `gh pr create --title "..." --body "..." --base develop` - Create GitHub PR with issue linking
- **File Operations**: Read test-results.json, write pr.md files

**Evidence Section Template:**
```markdown
## Evidence

### Test Execution Summary
{test_execution_summary}

### Test Results Details
{test_results_details}

### Failed Tests (if any)
{failed_test_details}

### Coverage Information
{coverage_information}
```

**Test Execution Summary Templates:**

**When test results are available:**
```markdown
### Test Execution Summary
- **Backend Tests**: {backend_test_summary}
- **Frontend Tests**: {frontend_test_summary}
- **Total Execution Time**: {total_duration}
- **Overall Status**: {overall_status}
```

**When NO test results are available:**
```markdown
### Test Execution Summary
⚠️ **No test results available**
- Tests have not been executed or results are not accessible
- Please run `/test` command to execute tests before creating PR
- Test results file: `docs/issues/{issue_number}/evidence/test-results.json` not found
```

**Key Features:**
- **PR Body Saving**: Creates pr.md files in docs/issues/{issue_number}/ **BEFORE** committing
- **Evidence Section**: Includes comprehensive test results and execution details
- **Test Integration**: Automatically loads and formats test results from evidence files
- **No Test Falsification**: NEVER creates fake test results - explicitly states when tests are not available
- **Automatic Issue Linking**: Every PR automatically links to its corresponding issue
- **Consistent Formatting**: Standardized PR titles and commit messages
- **Error Handling**: Robust error handling for Git and GitHub operations
- **Pre-commit Documentation**: PR body is generated and saved before any git operations

**Issue**: {issue_number or auto-detected}
**Auto Link**: {auto_link (defaults to true)}
