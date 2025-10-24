# PR: Show PR alert check type-based-view / Author based-view

Closes #174

## Summary

This PR implements a dedicated PR category for pull request related alerts and ensures they are properly displayed in both Check Type-based view and Author-based view. Previously, PR-related alerts were incorrectly categorized under Test/Performance, which has been resolved by creating a separate PR category.

## Key Changes

### Backend Changes
- **`backend/src/domain/alert/alertService.ts`**:
  - Updated `getAlertsByAuthor` method to include `pr_missing_evidence` and `pr_unclear_changes` in SQL queries
  - Added `pr_missing_evidence_count` and `pr_unclear_changes_count` to SELECT clause
  - Updated result mapping to include `prMissingEvidence` and `prUnclearChanges` in `issueTypeCounts`
  - Modified `getAlertsBySpecificAuthor` to include PR-related check types in filtering

### Frontend Changes
- **`frontend/src/constants/table.ts`**:
  - Added new "PR" category to `CHECK_TYPE_COLUMNS`
  - Created `pr` category in `CHECK_TYPE_MAPPING` with PR-related alert types:
    - `pull_request_format_violation`
    - `pr_missing_evidence`
    - `pr_unclear_changes`
    - `pr_review_workflow_missing`
  - Moved PR-related alerts from `test_performance` to `pr` category

- **`frontend/src/components/Molecules/AuthorGroupedTable.vue`**:
  - Added "PR Missing Evidence" and "PR Unclear Changes" columns
  - Updated column definitions to display PR-related alert counts

- **`frontend/src/composables/useAuthorAlerts.ts`**:
  - Updated `AuthorAggregation` interface to include `prMissingEvidence` and `prUnclearChanges` properties

## Implementation Details

### Problem Analysis
The original issue was that PR body check alerts (`pr_missing_evidence` and `pr_unclear_changes`) were not displayed in either view because:
1. Backend `getAlertsByAuthor` method only filtered for `issue_%` patterns, excluding PR-related alerts
2. Frontend `AuthorGroupedTable` lacked columns for PR-related alert types
3. PR-related alerts were incorrectly categorized under Test/Performance

### Solution Approach
1. **Backend**: Extended SQL queries to include PR-related alert types and added proper counting
2. **Frontend**: Created dedicated PR category and updated UI components to display PR alerts
3. **Categorization**: Separated PR-related alerts from Test/Performance into their own category

## Results

### Check Type-based View
- **New "PR" column** displays PR-related alert counts
- **`izumi-cloud`**: PR **"2"**, Test/Performance **"0"**
- **`drivee-link`**: PR **"1"**, Test/Performance **"0"**

### Author-based View
- **New columns**: "PR Missing Evidence" and "PR Unclear Changes"
- **`maitue`**: PR Missing Evidence **"1"**, PR Unclear Changes **"1"**
- **`devin-ai-integration[bot]`**: PR Missing Evidence **"1"**, PR Unclear Changes **"0"**

## Evidence

### Test Execution Summary
⚠️ **No test results available**
- Tests have not been executed or results are not accessible
- Please run `/test` command to execute tests before creating PR
- Test results file: `docs/issues/174/evidence/test-results.json` not found

## Screenshots

No screenshots available for this implementation.

## Documentation
- Issue details: `docs/issues/174/issue.md`
- Implementation plan: `docs/issues/174/plan.md`
- Development log: `docs/issues/174/dev.md`
