# Issue #110: feat: Fix author page last detected column to show specific datetime like other pages - Implementation Plan

## Functional Requirements Mapping

### FR1: Date Format Standardization → Task 1.1, 1.2, 1.3
- **Current State**: Custom `formatDate` function in author page returns relative time ("Today", "X days ago")
- **Target State**: Use standardized `useAlerts` composable's `formatDate` function returning `YYYY-MM-DD HH:mm:ss`
- **Implementation**: Import composable, extract function, replace usage

### FR2: Consistent User Experience → Task 2.1, 2.2
- **Current State**: Inconsistent date display between author page and other pages
- **Target State**: Identical date formatting across all pages
- **Implementation**: Visual testing and validation across multiple pages

### FR3: Code Maintainability → Task 1.3, 2.3
- **Current State**: Duplicate date formatting logic in author page
- **Target State**: Single source of truth via `useAlerts` composable
- **Implementation**: Remove custom function, leverage existing composable

## Directory Structure and File List

### Primary Files to Modify
```
frontend/src/pages/authors/[author].vue
├── Line 166: Add import statement for useAlerts composable
├── Line 190: Extract formatDate from useAlerts composable  
├── Line 154: Template usage (no changes needed)
└── Lines 283-301: Remove custom formatDate function
```

### Reference Files (No Modifications)
```
frontend/src/composables/useAlerts.ts
├── Line 67-69: formatDate function implementation
└── Line 169: Export formatDate in return object

frontend/src/components/Molecules/AlertTable.vue
├── Line 154: Reference implementation using useAlerts
└── Line 89: Template usage of formatDate

frontend/src/pages/[...slug].vue
├── Line 73: Import useAlerts composable
└── Line 82-91: Composable usage pattern
```

### Testing Files (Potential Updates)
```
frontend/tests/unit/components/
└── (May need updates if date formatting tests exist)

frontend/tests/unit/composables/
└── (Existing useAlerts tests should cover functionality)
```

## Architecture Design

### Current Architecture
```
Author Page ([author].vue)
├── Custom formatDate function (lines 283-301)
│   ├── Input: dateString (ISO format)
│   ├── Logic: Relative time calculation
│   └── Output: "Today", "X days ago", or toLocaleDateString()
└── Template usage (line 154)
    └── {{ formatDate(issue.lastDetectedAt) }}
```

### Target Architecture
```
Author Page ([author].vue)
├── useAlerts Composable Import
│   ├── Import: { useAlerts } from '~/composables/useAlerts'
│   ├── Usage: const { formatDate } = useAlerts(ref(null), ref(null))
│   └── Dependency: moment.js (already available)
└── Template usage (line 154) - unchanged
    └── {{ formatDate(issue.lastDetectedAt) }}

useAlerts Composable
├── formatDate function (line 67-69)
│   ├── Input: dateString (ISO format)
│   ├── Logic: moment(dateStr).format('YYYY-MM-DD HH:mm:ss')
│   └── Output: "2024-01-15 14:30:25" format
└── Shared across multiple components
    ├── AlertTable.vue (line 154)
    ├── Other pages using useAlerts
    └── Author page (after implementation)
```

### Dependency Flow
```
Author Page → useAlerts Composable → moment.js → Formatted Date String
```

## Data Model

### Input Data Structure
```typescript
interface Issue {
  id: number;
  owner: string;
  repo: string;
  checkType: string;
  title: string;
  description?: string;
  severity: string;
  issueUrl?: string;
  lastDetectedAt: string; // ISO 8601 format: "2024-01-15T14:30:25.000Z"
}
```

### Date Formatting Transformation
```typescript
// Current Implementation (to be removed)
const formatDate = (dateString: string): string => {
  // Input: "2024-01-15T14:30:25.000Z"
  // Output: "Today" | "1 day ago" | "2 weeks ago" | "1/15/2024"
}

// Target Implementation (from useAlerts)
const formatDate = (dateStr: string): string => {
  // Input: "2024-01-15T14:30:25.000Z"
  // Output: "2024-01-15 14:30:25"
  return moment(dateStr).format('YYYY-MM-DD HH:mm:ss')
}
```

### Template Data Binding
```vue
<!-- No changes needed in template -->
<Column field="lastDetectedAt" header="Last Detected" :sortable="true" class="min-w-32">
  <template #body="{ data: issue }">
    <span class="text-sm text-gray-600">
      {{ formatDate(issue.lastDetectedAt) }}
    </span>
  </template>
</Column>
```

## Implementation Tasks

### Task 1.1: Import useAlerts Composable
**Description**: Add the necessary import statement to access the useAlerts composable in the author page component.

**Technical Details**:
- **File**: `frontend/src/pages/authors/[author].vue`
- **Location**: Around line 166, in the script setup section
- **Change Type**: Addition
- **Code**:
  ```typescript
  import { useAlerts } from '~/composables/useAlerts';
  ```

**Acceptance Criteria**:
- Import statement added correctly
- No TypeScript compilation errors
- Import follows existing project conventions

**Estimated Time**: 5 minutes

### Task 1.2: Extract formatDate from useAlerts Composable
**Description**: Initialize the useAlerts composable and extract the formatDate function for use in the component.

**Technical Details**:
- **File**: `frontend/src/pages/authors/[author].vue`
- **Location**: Around line 190, after other composable initializations
- **Change Type**: Addition
- **Code**:
  ```typescript
  // Extract formatDate from useAlerts composable
  const { formatDate } = useAlerts(ref(null), ref(null));
  ```

**Dependencies**:
- Task 1.1 must be completed first
- `ref` import must be available (already imported)

**Acceptance Criteria**:
- Composable initialized correctly with null refs (as per AlertTable pattern)
- formatDate function extracted and available
- No runtime errors during component initialization

**Estimated Time**: 10 minutes

### Task 1.3: Remove Custom formatDate Function
**Description**: Delete the existing custom formatDate function that provides relative time formatting.

**Technical Details**:
- **File**: `frontend/src/pages/authors/[author].vue`
- **Location**: Lines 283-301
- **Change Type**: Deletion
- **Code to Remove**:
  ```typescript
  const formatDate = (dateString: string): string => {
    if (!dateString) return '-';
    
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      
      if (diffDays === 0) return 'Today';
      if (diffDays === 1) return '1 day ago';
      if (diffDays < 7) return `${diffDays} days ago`;
      if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
      
      return date.toLocaleDateString();
    } catch {
      return '-';
    }
  };
  ```

**Dependencies**:
- Task 1.2 must be completed first to ensure replacement function is available

**Acceptance Criteria**:
- Custom formatDate function completely removed
- No compilation errors after removal
- Template still functions correctly with new formatDate

**Estimated Time**: 5 minutes

### Task 2.1: Local Testing and Validation
**Description**: Test the implementation locally to ensure proper functionality and date format consistency.

**Technical Details**:
- **Environment**: Local development server
- **Test Scope**: Author page functionality
- **Validation Points**:
  - Date format matches `YYYY-MM-DD HH:mm:ss` pattern
  - No JavaScript errors in browser console
  - Page loads and displays correctly
  - Sorting by "Last Detected" column works properly

**Test Cases**:
1. **Basic Functionality**: Navigate to author page and verify dates display
2. **Date Format**: Confirm all dates show as `YYYY-MM-DD HH:mm:ss`
3. **Edge Cases**: Test with various date values (recent, old, null)
4. **Sorting**: Test column sorting functionality
5. **Responsive**: Test on different screen sizes

**Acceptance Criteria**:
- All dates display in consistent `YYYY-MM-DD HH:mm:ss` format
- No console errors or warnings
- All existing functionality preserved
- Page performance unchanged

**Estimated Time**: 30 minutes

### Task 2.2: Cross-Page Consistency Verification
**Description**: Verify that date formatting is now consistent across all pages in the application.

**Technical Details**:
- **Test Pages**:
  - Main dashboard (`/`)
  - Repository detail pages (`/owner/repo`)
  - Author page (`/authors/[author]`)
- **Comparison Points**:
  - Date format consistency
  - Visual alignment
  - Sorting behavior

**Test Process**:
1. Navigate to main dashboard and note date formats
2. Navigate to repository detail page and compare
3. Navigate to author page and verify consistency
4. Take screenshots for visual comparison
5. Test sorting on each page

**Acceptance Criteria**:
- Identical date format across all pages
- Consistent visual presentation
- Uniform sorting behavior
- No discrepancies in date display

**Estimated Time**: 20 minutes

### Task 2.3: Code Quality and Documentation
**Description**: Ensure code changes follow project standards and update any necessary documentation.

**Technical Details**:
- **Code Review**: Self-review changes for quality
- **Linting**: Run ESLint and fix any issues
- **TypeScript**: Ensure type safety maintained
- **Documentation**: Update inline comments if needed

**Quality Checks**:
1. **ESLint**: Run `npm run lint` and fix issues
2. **TypeScript**: Verify no type errors
3. **Code Style**: Follow existing patterns and conventions
4. **Performance**: Ensure no memory leaks or performance issues
5. **Comments**: Update or remove outdated comments

**Acceptance Criteria**:
- All linting rules pass
- No TypeScript compilation errors
- Code follows project conventions
- No performance degradation
- Clean, maintainable code

**Estimated Time**: 15 minutes

## Implementation Timeline

### Phase 1: Core Implementation (20 minutes)
- **Task 1.1**: Import useAlerts Composable (5 min)
- **Task 1.2**: Extract formatDate function (10 min)
- **Task 1.3**: Remove custom formatDate function (5 min)

### Phase 2: Testing and Validation (50 minutes)
- **Task 2.1**: Local testing and validation (30 min)
- **Task 2.2**: Cross-page consistency verification (20 min)

### Phase 3: Quality Assurance (15 minutes)
- **Task 2.3**: Code quality and documentation (15 min)

### Total Estimated Time: 1 hour 25 minutes

## Risk Assessment and Mitigation

### High Risk: Breaking Existing Functionality
- **Probability**: Low
- **Impact**: High
- **Mitigation**: Thorough local testing before commit
- **Contingency**: Easy rollback due to isolated changes

### Medium Risk: Date Format Inconsistencies
- **Probability**: Low
- **Impact**: Medium
- **Mitigation**: Use exact same composable as other components
- **Contingency**: Quick fix by adjusting format string

### Low Risk: Performance Impact
- **Probability**: Very Low
- **Impact**: Low
- **Mitigation**: Leverage existing optimized composable
- **Contingency**: Profile and optimize if needed

## Success Metrics

### Functional Metrics
- ✅ All dates display in `YYYY-MM-DD HH:mm:ss` format
- ✅ No regression in existing functionality
- ✅ Consistent behavior across all pages

### Technical Metrics
- ✅ Zero compilation errors
- ✅ Zero runtime errors
- ✅ Code passes all linting rules
- ✅ Reduced code duplication

### User Experience Metrics
- ✅ Improved consistency enhances professionalism
- ✅ More precise timestamp information
- ✅ Predictable date format across application

---

**Generated on**: 2025-09-20  
**Plan Version**: 1.0  
**Estimated Total Time**: 1 hour 25 minutes  
**Author**: AI Development Assistant
