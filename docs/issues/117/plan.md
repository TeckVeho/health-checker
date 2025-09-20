# Issue #117: Disable check "Expired End Date" - Implementation Plan

## Functional Requirements Mapping

This implementation plan addresses the complete removal of the `issue_expired_end_date` check functionality from the Health Checker system. The plan maps directly to the functional requirements defined in the specification:

- **FR-1**: Backend Alert Generation Removal
- **FR-2**: Frontend UI Component Removal  
- **FR-3**: Test Suite Cleanup
- **FR-4**: Data Cleanup (Optional)

## Directory Structure and File List

### Files Requiring Modification (7 files)

#### Backend Files (3 files)
```
backend/
├── src/
│   └── domain/
│       └── alert/
│           ├── alertService.ts                    # Remove checkType references and SQL aggregation
│           └── util/
│               └── checkIssues/
│                   └── validators.ts              # Remove expired date validation logic
└── tests/
    └── unit/
        └── domain/
            └── alert/
                └── checkIssues.test.ts           # Remove expired date test cases
```

#### Frontend Files (4 files)
```
frontend/
├── src/
│   ├── types/
│   │   └── alerts.ts                             # Remove type definitions
│   ├── constants/
│   │   └── table.ts                              # Remove from check type mapping
│   ├── pages/
│   │   └── authors/
│   │       └── [author].vue                      # Remove UI labels and styling
│   └── components/
│       └── Molecules/
│           └── AuthorGroupedTable.vue            # Remove "Overdue" column
└── tests/
    └── unit/
        └── composables/
            └── useCheckTypeAlerts.spec.ts        # Remove test references
```

### Additional Files (2 files)
```
frontend/src/composables/useAuthorAlerts.ts       # Remove expiredEndDate property
```

## Architecture Design

### Current System Flow (To Be Modified)
```
GitHub Issues → checkIssues() → validators.ts → issue_expired_end_date alerts → Database
                     ↓
Database → alertService.ts → API Response → Frontend → UI Display
```

### Target System Flow (After Implementation)
```
GitHub Issues → checkIssues() → validators.ts → [other alert types] → Database
                     ↓
Database → alertService.ts → API Response → Frontend → UI Display
                                                            ↓
                                                    [No Overdue column]
```

### Key Architectural Changes

1. **Alert Generation Layer**: Remove expired date validation logic
2. **Data Processing Layer**: Remove SQL aggregation and response mapping
3. **API Response Layer**: Remove `expiredEndDate` fields from responses
4. **UI Presentation Layer**: Remove "Overdue" column and related styling
5. **Type System**: Remove TypeScript interfaces and constants

## Data Model

### Current Alert Schema (Unchanged)
```sql
CREATE TABLE alerts (
  id BIGINT PRIMARY KEY,
  owner VARCHAR(255) NOT NULL,
  repo VARCHAR(255) NOT NULL,
  check_type VARCHAR(100) NOT NULL,  -- Will no longer contain 'issue_expired_end_date'
  title TEXT NOT NULL,
  description TEXT,
  severity VARCHAR(20),
  -- ... other fields
);
```

### API Response Changes
```typescript
// BEFORE (Current)
interface AuthorAlertCounts {
  expiredEndDate: number;  // ← Remove this field
  missingEndDate: number;
  // ... other fields
}

// AFTER (Target)
interface AuthorAlertCounts {
  missingEndDate: number;
  // ... other fields (expiredEndDate removed)
}
```

## Implementation Tasks

### Phase 1: Backend Core Logic Removal

#### Task 1.1: Remove Expired Date Validation Logic
**File**: `backend/src/domain/alert/util/checkIssues/validators.ts`
**Location**: Lines 133-142
**Action**: Remove the complete `else if` block that checks for expired end dates
**Code to Remove**:
```typescript
} else if (endDate < new Date(Date.now() - 24 * 60 * 60 * 1000)) {
  // End Date expired (before yesterday)
  alerts.push(createAlert(
    issue,
    owner,
    repo,
    'issue_expired_end_date',
    `Issue #${issue.number} has expired End Date: ${endDate.toISOString().split('T')[0]}.`,
    'middle'
  ));
}
```
**Validation**: Ensure the surrounding logic for missing end date checks remains intact

#### Task 1.2: Update Alert Service Check Types
**File**: `backend/src/domain/alert/alertService.ts`
**Location**: Line 293
**Action**: Remove `'issue_expired_end_date'` from the checkType array
**Before**:
```typescript
checkType: ['issue_missing_sp', 'issue_large_sp', 'issue_missing_end_date', 'issue_expired_end_date', 'issue_not_in_project', 'issue_template_only', 'issue_unclear_instruction']
```
**After**:
```typescript
checkType: ['issue_missing_sp', 'issue_large_sp', 'issue_missing_end_date', 'issue_not_in_project', 'issue_template_only', 'issue_unclear_instruction']
```

#### Task 1.3: Remove SQL Aggregation for Expired End Date
**File**: `backend/src/domain/alert/alertService.ts`
**Location**: Line 572
**Action**: Remove the COUNT aggregation for expired end date
**Code to Remove**:
```sql
COUNT(CASE WHEN check_type = 'issue_expired_end_date' THEN 1 END) as expired_end_date_count,
```

#### Task 1.4: Remove Response Property Mapping
**File**: `backend/src/domain/alert/alertService.ts`
**Location**: Line 624
**Action**: Remove the `expiredEndDate` property from the response object
**Code to Remove**:
```typescript
expiredEndDate: parseInt(row.expired_end_date_count),
```

### Phase 2: Frontend UI Component Removal

#### Task 2.1: Remove Type Definitions and Labels
**File**: `frontend/src/types/alerts.ts`
**Location**: Line 31
**Action**: Remove the `issue_expired_end_date` entry from `checkTypeLabels`
**Code to Remove**:
```typescript
issue_expired_end_date: 'Issue Expired End Date',
```

#### Task 2.2: Update Table Constants
**File**: `frontend/src/constants/table.ts`
**Location**: Line 30
**Action**: Remove `'issue_expired_end_date'` from the CHECK_TYPE_MAPPING array
**Before**:
```typescript
issue: [
  'issue_unclear_instruction',
  'issue_template_only', 
  'issue_missing_end_date',
  'issue_expired_end_date',  // ← Remove this line
  'issue_missing_sp',
  // ...
]
```

#### Task 2.3: Remove Author Page Labels and Styling
**File**: `frontend/src/pages/authors/[author].vue`
**Location**: Lines 233 and 247
**Actions**:
1. Remove 'Overdue' label mapping (line 233):
```typescript
'issue_expired_end_date': 'Overdue',  // ← Remove this line
```
2. Remove styling definition (line 247):
```typescript
'issue_expired_end_date': 'bg-red-100 text-red-800',  // ← Remove this line
```

#### Task 2.4: Remove "Overdue" Column from Table Component
**File**: `frontend/src/components/Molecules/AuthorGroupedTable.vue`
**Location**: Lines 108-113
**Action**: Remove the complete Column definition for "Overdue"
**Code to Remove**:
```vue
<!-- Expired End Date Column -->
<Column field="issueTypeCounts.expiredEndDate" header="Overdue" :sortable="true" class="text-center min-w-16">
  <template #body="{ data: row }">
    <Badge 
      :value="row.issueTypeCounts.expiredEndDate || 0" 
      :severity="row.issueTypeCounts.expiredEndDate > 0 ? 'danger' : 'secondary'"
    />
  </template>
</Column>
```

#### Task 2.5: Update TypeScript Interface
**File**: `frontend/src/composables/useAuthorAlerts.ts`
**Location**: Line 17
**Action**: Remove the `expiredEndDate` property from the interface
**Code to Remove**:
```typescript
expiredEndDate: number;
```

### Phase 3: Test Suite Cleanup

#### Task 3.1: Remove Backend Unit Tests
**File**: `backend/tests/unit/domain/alert/checkIssues.test.ts`
**Actions**:
1. Remove complete test case (lines 176-212):
```typescript
it('should detect expired end date', async () => {
  // ... entire test implementation
});
```
2. Remove expired end date assertions from mixed scenario tests (lines 1064-1095):
   - Remove expectations for `issue_expired_end_date` alerts
   - Update alert count expectations accordingly

#### Task 3.2: Remove Frontend Test References
**File**: `frontend/tests/unit/composables/useCheckTypeAlerts.spec.ts`
**Locations**: Lines 30 and 158
**Action**: Remove `issue_expired_end_date` references from test assertions
**Code to Remove**:
```typescript
// Remove references like:
expect(result).toContain('issue_expired_end_date');  // ← Remove or update
```

### Phase 4: Quality Assurance and Validation

#### Task 4.1: TypeScript Compilation Check
**Command**: `npm run build` (both backend and frontend)
**Expected Result**: No TypeScript compilation errors
**Validation**: Ensure all removed references don't cause type errors

#### Task 4.2: Unit Test Execution
**Commands**:
- Backend: `npm test` in backend directory
- Frontend: `npm run test` in frontend directory
**Expected Result**: All tests pass, no failures related to removed functionality

#### Task 4.3: Integration Testing
**Actions**:
1. Start local development environment
2. Verify alert generation works for other check types
3. Confirm UI displays correctly without "Overdue" column
4. Test API responses don't include `expiredEndDate` fields

#### Task 4.4: Code Review Checklist
- [ ] All `issue_expired_end_date` references removed
- [ ] No unused imports or variables
- [ ] TypeScript interfaces consistent
- [ ] UI layout remains intact after column removal
- [ ] Test coverage maintained for other functionality

### Phase 5: Optional Database Cleanup

#### Task 5.1: Data Migration Script (Optional)
**Action**: Execute SQL to resolve existing expired end date alerts
**SQL Script**:
```sql
UPDATE alerts 
SET system_resolved = true, 
    system_resolved_reason = 'Feature disabled - Expired End Date check removed'
WHERE check_type = 'issue_expired_end_date' 
AND system_resolved = false;
```
**Validation**: Verify existing alerts are marked as resolved

## Implementation Order

### Recommended Sequence
1. **Start with Backend** (Tasks 1.1 → 1.4): Remove core logic first
2. **Update Frontend** (Tasks 2.1 → 2.5): Remove UI components and types
3. **Clean Tests** (Tasks 3.1 → 3.2): Update test suites
4. **Quality Assurance** (Tasks 4.1 → 4.4): Validate implementation
5. **Optional Cleanup** (Task 5.1): Database migration if needed

### Parallel Execution Opportunities
- Tasks 1.1-1.4 can be done in parallel (different sections of same files)
- Tasks 2.1-2.5 can be done in parallel (different files)
- Tasks 3.1-3.2 can be done in parallel (different test files)

## Risk Mitigation

### High Priority Risks
1. **Breaking Other Alert Types**: Carefully preserve surrounding logic in validators.ts
2. **TypeScript Compilation Errors**: Remove all references systematically
3. **UI Layout Issues**: Test frontend display after column removal

### Mitigation Strategies
- **Incremental Testing**: Test after each phase completion
- **Code Backup**: Use Git branches for safe experimentation
- **Peer Review**: Have another developer review changes
- **Rollback Plan**: Keep detailed record of changes for easy reversion

## Completion Criteria

### Definition of Done
- [ ] All 9 files modified according to plan
- [ ] No `issue_expired_end_date` references remain in codebase
- [ ] TypeScript compilation successful (backend and frontend)
- [ ] All unit tests pass
- [ ] UI displays correctly without "Overdue" column
- [ ] API responses exclude `expiredEndDate` fields
- [ ] Integration tests confirm other alert types work correctly
- [ ] Code review completed and approved

### Success Metrics
- **Code Quality**: No linting errors, clean TypeScript compilation
- **Functionality**: Other alert types continue to work as expected
- **Performance**: No degradation in alert processing speed
- **User Experience**: UI remains intuitive without removed column
