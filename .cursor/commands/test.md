# Test Command

Execute tests and record results with AI Agent

## Parameters

- `issue_number` (optional): Issue number. If omitted, uses the most recently processed issue from previous `/issue` command
- `output_path` (optional): Output directory path (defaults to current directory)

## Instructions

Execute tests and record results through interactive AI Agent collaboration.

**Workflow Position**: This command should be run after `/dev` (development) and before `/pr` (commit and pull request creation).

**Instructions for AI Agent:**

**⛔ ABSOLUTE PROHIBITION: DO NOT EXECUTE ANY GIT COMMIT COMMANDS ⛔**
- NEVER run `git commit` in any form
- NEVER run `git add . && git commit`
- NEVER suggest or execute commit operations
- Testing phase MUST end with uncommitted changes

1. **Determine Issue Number**: 
   - If `issue_number` is provided: Use the specified issue number
   - If `issue_number` is omitted: Look for the most recently created issue document in `docs/issues/*/issue.md` to determine the issue number
   - Check for existing `docs/issues/{issue_number}/issue.md` file to ensure issue data is available
2. **Analyze Project Structure**: Identify test framework and test files
3. **Execute Test Suite**: Run appropriate test commands
4. **Record Results**: Save test results and evidence
5. **Generate Report**: Create test execution report
6. **Handle Failures**: Analyze and report test failures (WITHOUT committing)

**🚨 CRITICAL: NEVER COMMIT CHANGES DURING TESTING PHASE 🚨**

**STRICT RULE**: Do NOT use `git commit`, `git add && git commit`, or any commit commands during testing phase.
- All changes MUST remain uncommitted
- Changes will be committed later in the `/pr` phase
- This ensures proper workflow separation and testing before committing
- Violating this rule breaks the development workflow

**Test Execution Process:**
- Determine issue number (from parameter or most recent `/issue` command)
- Identify test framework (Jest, Mocha, pytest, etc.)
- Run test suite with appropriate commands
- Capture test output and results
- Save results to test report file
- Generate evidence of test execution

**Auto-Detection Process:**
- Search `docs/issues/*/issue.md` files for the most recently modified file
- Extract issue number from the directory structure
- Verify the issue exists and is accessible

**Issue Data Retrieval Optimization:**
- **Cache Strategy**: Reuse existing issue.md files to avoid repeated GitHub API calls
- **Fallback Support**: Automatic GitHub API fallback if cached data unavailable
- **Speed Improvement**: 1-2 seconds faster execution by eliminating redundant API calls

**Supported Test Frameworks:**
- **JavaScript/TypeScript**: npm test, yarn test, jest
- **Python**: pytest, python -m unittest
- **Java**: mvn test, gradle test
- **C#**: dotnet test
- **Go**: go test

**Output Files:**
- Test results: `docs/issues/{issue_number}/evidence/test-results.json`
- Test report: `docs/issues/{issue_number}/evidence/test-report.md`
- Evidence: Screenshots, logs, coverage reports in `docs/issues/{issue_number}/evidence/`

**Issue**: {issue_number or auto-detected}
**Output**: {output_path}
