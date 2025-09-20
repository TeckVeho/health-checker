# Issue #117: Disable check "Expired End Date"

## Overview

This specification outlines the complete removal of the "Expired End Date" check functionality (`issue_expired_end_date`) from the Health Checker system. The system currently generates alerts when GitHub issues have end dates that have passed, but this functionality is no longer required for operational purposes and needs to be completely eliminated from the codebase.

## Purpose

The primary goal is to:
- **Remove obsolete functionality**: Eliminate the `issue_expired_end_date` check type that is no longer operationally relevant
- **Clean up codebase**: Remove all references, logic, UI components, and tests related to expired end date checking
- **Maintain system integrity**: Ensure that removal does not affect other alert checking mechanisms
- **Improve performance**: Reduce unnecessary processing by eliminating unused validation logic

## Functional Requirements

### FR-1: Backend Alert Generation Removal
- **FR-1.1**: Remove expired end date validation logic from `validators.ts` (lines 133-142)
- **FR-1.2**: Remove `issue_expired_end_date` from alert service check type arrays
- **FR-1.3**: Remove expired end date count aggregation from SQL queries
- **FR-1.4**: Remove `expiredEndDate` property from response objects

### FR-2: Frontend UI Component Removal
- **FR-2.1**: Remove "Overdue" column from AuthorGroupedTable component
- **FR-2.2**: Remove `issue_expired_end_date` type definitions and labels
- **FR-2.3**: Remove expired end date styling and display logic from author pages
- **FR-2.4**: Remove `expiredEndDate` property from TypeScript interfaces

### FR-3: Test Suite Cleanup
- **FR-3.1**: Remove expired end date test cases from backend unit tests
- **FR-3.2**: Remove expired end date references from frontend composable tests
- **FR-3.3**: Ensure all remaining tests pass after removal

### FR-4: Data Cleanup (Optional)
- **FR-4.1**: Provide SQL script to mark existing `issue_expired_end_date` alerts as system-resolved
- **FR-4.2**: Prevent generation of new expired end date alerts

## Specification

### Features

#### Core Functionality Removal
The system will no longer:
- Check GitHub issues for expired end dates during validation runs
- Generate `issue_expired_end_date` alerts in the database
- Display "Overdue" information in the frontend UI
- Count expired end date alerts in aggregation queries
- Include expired end date logic in test scenarios

#### Preserved Functionality
The system will continue to:
- Check for missing end dates (`issue_missing_end_date`)
- Validate all other issue-related checks (missing SP, large SP, template-only, etc.)
- Process and display all non-expired-end-date alert types
- Maintain existing alert resolution mechanisms

### System Requirements

#### Required External Tools
- **Git**: For version control and branch management
- **Node.js & npm/yarn**: For dependency management and build processes
- **TypeScript compiler**: For type checking and compilation
- **Jest**: For running backend unit tests
- **Vitest**: For running frontend unit tests
- **PostgreSQL**: Database system (for optional data cleanup)

#### Operating Environment
- **Development Environment**: Node.js 18+ with TypeScript support
- **Database**: PostgreSQL with existing alerts table structure
- **Frontend**: Nuxt.js application with Vue 3 and TypeScript
- **Backend**: Node.js application with Express and Sequelize ORM

#### Quality Requirements
- **Backward Compatibility**: No breaking changes to API contracts for other alert types
- **Performance**: No degradation in alert processing performance for remaining check types
- **Maintainability**: Clean removal without leaving dead code or unused imports
- **Type Safety**: All TypeScript interfaces and types must remain consistent
- **Test Coverage**: Maintain existing test coverage for non-affected functionality

## Success Criteria

### Functional Criteria
- **FC-1**: No new `issue_expired_end_date` alerts are generated after implementation
- **FC-2**: "Overdue" column is completely removed from all frontend tables
- **FC-3**: All backend and frontend tests pass successfully
- **FC-4**: TypeScript compilation completes without errors
- **FC-5**: System continues to process all other alert types correctly
- **FC-6**: API responses no longer include `expiredEndDate` fields

### Non-Functional Criteria
- **NFC-1**: **Performance**: Alert processing time is maintained or improved
- **NFC-2**: **Security**: No security vulnerabilities introduced by the changes
- **NFC-3**: **Maintainability**: Code remains clean and well-structured
- **NFC-4**: **Reliability**: System stability is maintained across all environments
- **NFC-5**: **Usability**: UI remains intuitive without the removed "Overdue" column

## Implementation Details

### Backend Changes (3 files)

#### 1. validators.ts
- **Location**: `backend/src/domain/alert/util/checkIssues/validators.ts`
- **Action**: Remove lines 133-142 containing expired end date validation logic
- **Impact**: Eliminates core alert generation for expired end dates

#### 2. alertService.ts
- **Location**: `backend/src/domain/alert/alertService.ts`
- **Actions**:
  - Remove `issue_expired_end_date` from checkType array (line 293)
  - Remove `expired_end_date_count` from SQL COUNT aggregation (line 572)
  - Remove `expiredEndDate` property from response object (line 624)
- **Impact**: Eliminates alert processing and API response inclusion

### Frontend Changes (5 files)

#### 1. alerts.ts (Types)
- **Location**: `frontend/src/types/alerts.ts`
- **Action**: Remove `issue_expired_end_date` entry from checkTypeLabels (line 31)
- **Impact**: Eliminates type definition and label mapping

#### 2. table.ts (Constants)
- **Location**: `frontend/src/constants/table.ts`
- **Action**: Remove `issue_expired_end_date` from CHECK_TYPE_MAPPING array (line 30)
- **Impact**: Eliminates table column configuration

#### 3. [author].vue (Author Page)
- **Location**: `frontend/src/pages/authors/[author].vue`
- **Actions**:
  - Remove 'Overdue' label mapping (line 233)
  - Remove expired end date styling definition (line 247)
- **Impact**: Eliminates UI display and styling

#### 4. AuthorGroupedTable.vue (Table Component)
- **Location**: `frontend/src/components/Molecules/AuthorGroupedTable.vue`
- **Action**: Remove entire "Overdue" column definition (lines 108-113)
- **Impact**: Eliminates table column from UI

#### 5. useAuthorAlerts.ts (Composable)
- **Location**: `frontend/src/composables/useAuthorAlerts.ts`
- **Action**: Remove `expiredEndDate` property from interface (line 17)
- **Impact**: Eliminates TypeScript interface property

### Test Changes (2 files)

#### 1. Backend Unit Tests
- **Location**: `backend/tests/unit/domain/alert/checkIssues.test.ts`
- **Actions**:
  - Remove 'should detect expired end date' test (lines 176-212)
  - Remove expired end date assertions from mixed scenario tests (lines 1064-1095)
- **Impact**: Eliminates test coverage for removed functionality

#### 2. Frontend Composable Tests
- **Location**: `frontend/tests/unit/composables/useCheckTypeAlerts.spec.ts`
- **Action**: Remove `issue_expired_end_date` references (lines 30, 158)
- **Impact**: Eliminates test assertions for removed functionality

## Data Migration

### Optional Database Cleanup
```sql
UPDATE alerts 
SET system_resolved = true, 
    system_resolved_reason = 'Feature disabled - Expired End Date check removed'
WHERE check_type = 'issue_expired_end_date' 
AND system_resolved = false;
```

This query will:
- Mark all existing unresolved expired end date alerts as system-resolved
- Provide a clear reason for the resolution
- Prevent these alerts from appearing in active alert lists

## Risk Assessment

### Low Risks
- **Code Removal**: Standard refactoring with well-defined scope
- **UI Changes**: Simple column removal with no complex interactions
- **Test Updates**: Straightforward removal of specific test cases

### Mitigation Strategies
- **Comprehensive Testing**: Run full test suite to ensure no regressions
- **Code Review**: Thorough review to catch any missed references
- **Staged Deployment**: Deploy to development environment first
- **Rollback Plan**: Git branch allows easy reversion if issues arise

## References

- **GitHub Issue**: https://github.com/TeckVeho/health-checker/issues/117
- **Repository**: TeckVeho/health-checker
- **Related Documentation**: Health Checker system architecture and alert processing documentation
- **Database Schema**: Alerts table structure and relationships
