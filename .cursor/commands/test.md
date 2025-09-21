# Test Command

Execute tests and record results with AI Agent

## Purpose (Goal)
- Verify the correctness of implemented code
- Capture and store raw test evidence
- Generate a structured test report for review
- Provide review notes and improvement points before creating a PR  

## Parameters
- `issue_number` (optional): Issue number. If omitted, uses the most recently processed issue from previous `/issue` command
- `output_path` (optional): Output directory path (defaults to current directory)

## Workflow Position
- This command should be run **after `/dev` (development)** and **before `/pr` (commit and pull request creation)**

## Critical Rules
**⛔ ABSOLUTE PROHIBITION: DO NOT EXECUTE ANY GIT COMMIT COMMANDS ⛔**
- NEVER run `git commit` in any form
- NEVER run `git add . && git commit`
- NEVER suggest or execute commit operations
- All changes MUST remain uncommitted at this stage

---

## Instructions for AI Agent

1. **Determine Issue Number**
   - If `issue_number` is provided: Use the specified issue number
   - If omitted: Look for the most recently created issue document in `docs/issues/*/issue.md`
   - Verify that `docs/issues/{issue_number}/issue.md` exists

2. **Analyze Project Structure**
   - Identify test framework (Jest, Mocha, pytest, etc.)
   - Detect test file locations

3. **Execute Test Suite**
   - Run appropriate test commands based on the framework

4. **Record Results**
   - Save raw outputs to `docs/issues/{issue_number}/evidence/`  
     (e.g., `test_output.log`, `coverage.json`)
   - Create final structured report in `docs/issues/{issue_number}/test.md`

5. **Generate Report**
   - Summarize total tests, passed, failed, and coverage
   - List failed tests with error details
   - Provide **review notes** with improvement suggestions

6. **Handle Failures**
   - Do NOT commit or fix here
   - Document failure causes and suspected issues in `test.md`

---

## Output Structure Example

```
docs/
└── issues/
    └── 42/
        ├── issue.md
        ├── evidence/
        │   ├── test_output.log
        │   ├── coverage.json
        │   └── screenshot.png
        └── test.md
```

## `test.md` Template

```markdown
# Test Report for Issue #{issue_number}

## Summary
- Total Tests: 128
- Passed: 125
- Failed: 3
- Coverage: 87%

## Failures
1. `tests/services/userService.test.js` - "should create user with valid data"  
   Error: ValidationError: email must be unique

2. `tests/routes/projectRoute.test.js` - "GET /projects returns list"  
   Error: Timeout (response > 5000ms)

3. `tests/utils/dateHelper.test.js` - "formatDate handles null input"  
   Error: TypeError: Cannot read property 'toISOString' of null

## Review Notes
- [ ] userService: check unique index and test fixture data
- [ ] projectRoute: possible performance issue, investigate DB query
- [ ] dateHelper: needs null guard
```
