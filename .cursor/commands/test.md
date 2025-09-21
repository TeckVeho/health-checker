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
     - **IMPORTANT**: Save to `docs/issues/{issue_number}/evidence/` (root level), NOT `backend/docs/issues/{issue_number}/evidence/`
   - Create final structured report in `docs/issues/{issue_number}/test.md`

5. **Generate Report**
   - Summarize total tests, passed, failed, and coverage
   - List failed tests with error details
   - **Compare Issue Requirements vs Implementation vs Test Results**
   - Provide comprehensive **review notes** with improvement suggestions

6. **Cross-Reference Analysis**
   - Read `docs/issues/{issue_number}/issue.md` to understand requirements
   - Read `docs/issues/{issue_number}/spec.md` to understand specifications
   - Read `docs/issues/{issue_number}/plan.md` to understand planned tasks
   - Read `docs/issues/{issue_number}/dev.md` to understand implementation progress
   - Compare actual test results against planned coverage goals

7. **Handle Failures**
   - Do NOT commit or fix here
   - Document failure causes and suspected issues in `test.md`
   - Identify gaps between issue requirements and test coverage

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

**IMPORTANT**: Evidence files must be saved to `docs/issues/{issue_number}/evidence/` (root level), NOT `backend/docs/issues/{issue_number}/evidence/`

## `test.md` Template

```markdown
# Test Report for Issue #{issue_number}

## Summary
- Total Tests: 128
- Passed: 125
- Failed: 3
- Coverage: 87%

## Requirements vs Implementation Analysis

### Issue Requirements (from issue.md)
- **Primary Goal**: [Summarize main requirement from issue]
- **Success Criteria**: [List acceptance criteria from issue]
- **Target Coverage**: [Coverage goals if specified]

### Planned Implementation (from plan.md)
- **Task 1**: [Task description] - ✅ Completed
- **Task 2**: [Task description] - ✅ Completed
- **Task 3**: [Task description] - ❌ Not completed

### Actual Implementation (from dev.md)
- **Completed Tasks**: [List of completed tasks]
- **Coverage Achieved**: [Actual coverage numbers]
- **Test Files Created**: [Number and types of test files]

## Failures
1. `tests/services/userService.test.js` - "should create user with valid data"  
   Error: ValidationError: email must be unique

2. `tests/routes/projectRoute.test.js` - "GET /projects returns list"  
   Error: Timeout (response > 5000ms)

3. `tests/utils/dateHelper.test.js` - "formatDate handles null input"  
   Error: TypeError: Cannot read property 'toISOString' of null

## Cross-Reference Analysis

### ✅ Requirements Met
- [List requirements that were successfully implemented and tested]

### ❌ Requirements Gap
- [List requirements that were not fully implemented or tested]

### 🔄 Implementation vs Plan
- **Planned**: [What was planned in plan.md]
- **Actual**: [What was actually implemented in dev.md]
- **Gap**: [Difference between plan and implementation]

### 📊 Coverage Analysis
- **Target Coverage**: [Coverage goals from issue/spec]
- **Achieved Coverage**: [Actual coverage from test results]
- **Gap**: [Coverage shortfall and areas needing attention]

## Review Notes

### ✅ Strengths
- [List successful implementations and test achievements]

### 🔍 Areas for Improvement
- [ ] **Requirement Gap**: [Specific requirement not met]
- [ ] **Coverage Gap**: [Areas with low coverage and why]
- [ ] **Implementation Gap**: [Planned vs actual implementation differences]
- [ ] **Test Quality**: [Test quality issues or missing test scenarios]

### 📋 Recommendations for PR
1. **Requirements Compliance**: [How well the implementation meets the original issue requirements]
2. **Test Coverage**: [Coverage analysis and recommendations]
3. **Code Quality**: [Code quality observations from test results]
4. **Future Improvements**: [Suggestions for future iterations]
```
