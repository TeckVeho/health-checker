# Quickstart: checkIssues.ts Refactoring

**Feature**: Modularization of checkIssues.ts  
**Branch**: 001-backend-src-domain

## Overview
This guide validates the refactored checkIssues.ts maintains backward compatibility while improving code organization through modularization.

## Prerequisites
```bash
# Ensure you're on the feature branch
git checkout 001-backend-src-domain

# Install dependencies
npm install

# Run existing tests to establish baseline
npm test -- backend/tests/unit/domain/alert/checkIssues.test.ts
```

## Module Structure Validation

### 1. Verify Module Creation
```bash
# Check new module structure exists
ls -la backend/src/domain/alert/util/checkIssues/

# Expected output:
# index.ts       # Main orchestrator (public API)
# types.ts       # Shared interfaces
# github.ts      # GitHub API client
# projects.ts    # Projects integration
# parsers.ts     # Text parsing utilities
# llm.ts         # AI-powered analysis
# validators.ts  # Business rules
```

### 2. Verify Backward Compatibility
```bash
# The original import path should still work
grep -r "from.*checkIssues" backend/src/

# Should show existing imports unchanged:
# backend/src/services/alertService.ts: import { checkIssues } from '../domain/alert/util/checkIssues'
# backend/src/commands/checkIssues.ts: import { checkIssues } from '../domain/alert/util/checkIssues'
```

## Functional Testing

### 1. Run Existing Test Suite
```bash
# All existing tests must pass without modification
npm test -- backend/tests/unit/domain/alert/checkIssues.test.ts

# Expected: All 30+ test cases pass
# ✓ Should return empty alerts for no issues
# ✓ Should detect unassigned issues
# ✓ Should detect missing story points
# ✓ Should detect large story points
# ✓ Should detect missing end dates
# ✓ Should detect expired end dates
# ✓ Should detect issues not in project
# ✓ Should detect template-only issues
# ✓ Should detect unclear instructions
# ... (all tests passing)
```

### 2. Run Module-Level Tests
```bash
# New module tests should exist and pass
npm test -- backend/tests/unit/domain/alert/checkIssues/

# Expected: New granular tests for each module
# ✓ GitHub module tests
# ✓ Projects module tests
# ✓ Parsers module tests
# ✓ LLM module tests
# ✓ Validators module tests
```

### 3. Integration Test
```bash
# Run the actual command against a test repository
npm run check:issues -- --owner octocat --repo hello-world

# Expected: Same output as before refactoring
# {
#   "owner": "octocat",
#   "repo": "hello-world",
#   "alerts": [...]
# }
```

## Performance Validation

### 1. Measure API Call Count
```bash
# Run with debug logging to count API calls
DEBUG=github:api npm run check:issues -- --owner octocat --repo hello-world 2>&1 | grep -c "GET\|POST"

# Expected: Same number of API calls as before
```

### 2. Execution Time Comparison
```bash
# Time the execution
time npm run check:issues -- --owner octocat --repo hello-world

# Expected: Execution time within 5% of original
```

## Code Quality Metrics

### 1. File Size Check
```bash
# Verify each module is under 200 lines
wc -l backend/src/domain/alert/util/checkIssues/*.ts

# Expected:
# index.ts:      < 100 lines
# github.ts:     < 150 lines
# projects.ts:   < 180 lines
# parsers.ts:    < 80 lines
# llm.ts:        < 150 lines
# validators.ts: < 90 lines
```

### 2. Complexity Analysis
```bash
# Run complexity analysis
npx eslint backend/src/domain/alert/util/checkIssues/ --format json | jq '.[] | .messages[] | select(.ruleId=="complexity")'

# Expected: No high complexity warnings
```

## Manual Verification Checklist

### Public API Preserved
- [ ] `checkIssues` function signature unchanged
- [ ] `IssueAlertCandidate` interface unchanged
- [ ] `CheckIssuesResult` interface unchanged
- [ ] Import paths work from existing code

### Module Independence
- [ ] Each module has single responsibility
- [ ] No circular dependencies between modules
- [ ] Clear interfaces between modules
- [ ] Each module independently testable

### Test Coverage
- [ ] All existing tests pass
- [ ] New module tests added
- [ ] Coverage maintained or improved
- [ ] Edge cases still handled

### Performance
- [ ] No additional API calls
- [ ] Same execution time
- [ ] Memory usage unchanged
- [ ] No performance regressions

## Troubleshooting

### If existing tests fail:
1. Check that public interfaces haven't changed
2. Verify import paths are correctly aliased
3. Ensure all exports are maintained

### If performance degrades:
1. Check for duplicate API calls
2. Verify caching is maintained
3. Profile to identify bottlenecks

### If imports break:
1. Ensure index.ts re-exports all public interfaces
2. Check that backward compatibility layer exists
3. Verify TypeScript paths configuration

## Success Criteria

✅ **All existing tests pass without modification**  
✅ **Public API completely unchanged**  
✅ **Each module under 200 lines**  
✅ **No circular dependencies**  
✅ **Performance within 5% of original**  
✅ **Code coverage maintained or improved**

## Next Steps

After validation:
1. Run full test suite: `npm test`
2. Run linting: `npm run lint`
3. Run type checking: `npm run typecheck`
4. Create PR with refactoring details

---

**This quickstart validates that the refactoring achieves its goals without breaking changes**