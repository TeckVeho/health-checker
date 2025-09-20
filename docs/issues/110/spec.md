# Issue #110: feat: Fix author page last detected column to show specific datetime like other pages

## Overview

This specification addresses the inconsistency in date formatting between the author page and other pages in the Health Checker application. Currently, the author page displays "Today" for same-day dates in the "Last Detected" column, while other pages consistently show specific datetime in the format `YYYY-MM-DD HH:mm:ss`. This creates a poor user experience and inconsistent interface behavior.

## Purpose

The primary goal is to standardize the date display format across all pages in the Health Checker application, ensuring that the author page uses the same datetime formatting as other components, specifically the `AlertTable` component and other pages that utilize the `useAlerts` composable's `formatDate` function.

## Functional Requirements

### FR1: Date Format Standardization
- **Requirement**: The author page must display dates in the same format as other pages
- **Current State**: Custom `formatDate` function shows "Today", "1 day ago", etc.
- **Target State**: Use `useAlerts` composable's `formatDate` function that returns `YYYY-MM-DD HH:mm:ss`

### FR2: Consistent User Experience
- **Requirement**: All pages must provide consistent date information
- **Details**: Users should see exact timestamps regardless of which page they are viewing
- **Impact**: Improves data clarity and user trust in the system

### FR3: Code Maintainability
- **Requirement**: Remove duplicate date formatting logic
- **Details**: Eliminate custom `formatDate` function in author page (lines 283-301)
- **Benefit**: Centralized date formatting reduces maintenance overhead

## Specification

### Features

#### Current Implementation Analysis
The author page (`frontend/src/pages/authors/[author].vue`) contains:
- **Lines 283-301**: Custom `formatDate` function that returns relative time strings
- **Line 154**: Usage of custom `formatDate` in template
- **Logic**: Shows "Today", "X days ago", "X weeks ago", or fallback to `toLocaleDateString()`

#### Target Implementation
Replace the current implementation with:
- **Import**: `useAlerts` composable in the script setup section
- **Usage**: Extract `formatDate` from `useAlerts` composable
- **Template**: Use the standardized `formatDate` function
- **Removal**: Delete the custom `formatDate` function entirely

#### Technical Implementation Details

**File to Modify**: `frontend/src/pages/authors/[author].vue`

**Changes Required**:
1. **Import Addition** (around line 166):
   ```typescript
   import { useAlerts } from '~/composables/useAlerts';
   ```

2. **Composable Usage** (around line 190):
   ```typescript
   // Extract formatDate from useAlerts composable
   const { formatDate } = useAlerts(ref(null), ref(null));
   ```

3. **Function Removal** (lines 283-301):
   ```typescript
   // DELETE: Remove the entire custom formatDate function
   const formatDate = (dateString: string): string => { ... }
   ```

4. **Template Usage** (line 154): No changes needed - already using `formatDate`

### System Requirements

#### Required External Tools
- **Moment.js**: Already available in `useAlerts` composable for date formatting
- **Vue 3 Composition API**: For `ref()` usage in composable initialization
- **Existing Dependencies**: No additional packages required

#### Operating Environment
- **Frontend Framework**: Nuxt.js/Vue.js 3
- **TypeScript**: Full TypeScript support maintained
- **Browser Compatibility**: All modern browsers supporting the existing application

#### Quality Requirements

**Performance Requirements**:
- **Response Time**: No performance degradation expected
- **Memory Usage**: Slight improvement due to code deduplication
- **Bundle Size**: Marginal reduction by removing duplicate code

**Maintainability Requirements**:
- **Code Consistency**: Achieves consistent date formatting across all components
- **Testing**: Existing tests should continue to pass
- **Documentation**: No additional documentation required

**Compatibility Requirements**:
- **Backward Compatibility**: Full compatibility with existing data and API responses
- **Cross-browser Support**: Maintains current browser support level
- **Responsive Design**: No impact on responsive behavior

## Success Criteria

### Functional Criteria

#### FC1: Date Format Consistency
- **Validation**: All pages display dates in `YYYY-MM-DD HH:mm:ss` format
- **Test Method**: Visual verification across author page, main dashboard, and repository detail pages
- **Expected Result**: Identical date formatting on all pages

#### FC2: Code Deduplication
- **Validation**: Custom `formatDate` function removed from author page
- **Test Method**: Code review and search for duplicate date formatting logic
- **Expected Result**: Single source of truth for date formatting via `useAlerts` composable

#### FC3: Functionality Preservation
- **Validation**: All existing functionality remains intact
- **Test Method**: Comprehensive testing of author page features
- **Expected Result**: No regression in existing features

### Non-Functional Criteria

#### NFC1: Performance Maintenance
- **Validation**: Page load times remain unchanged or improve
- **Test Method**: Performance benchmarking before and after changes
- **Expected Result**: No performance degradation

#### NFC2: Code Quality
- **Validation**: Code follows existing patterns and conventions
- **Test Method**: Code review and linting checks
- **Expected Result**: Clean, maintainable code that follows project standards

#### NFC3: User Experience
- **Validation**: Improved consistency enhances user experience
- **Test Method**: User interface testing and feedback
- **Expected Result**: More predictable and professional date display

## Implementation Strategy

### Phase 1: Code Analysis and Preparation
1. Verify current `useAlerts` composable implementation
2. Identify all usages of date formatting in the author page
3. Plan the replacement strategy

### Phase 2: Implementation
1. Import `useAlerts` composable
2. Extract `formatDate` function from composable
3. Remove custom `formatDate` implementation
4. Test functionality locally

### Phase 3: Validation and Testing
1. Visual testing across different pages
2. Functional testing of author page
3. Cross-browser compatibility testing
4. Performance impact assessment

### Risk Mitigation

**Risk**: Breaking existing functionality
- **Mitigation**: Thorough testing before deployment
- **Contingency**: Easy rollback due to isolated changes

**Risk**: Date format inconsistencies
- **Mitigation**: Use exact same composable as other components
- **Verification**: Side-by-side comparison testing

## References

### Related Files
- `frontend/src/pages/authors/[author].vue` - Target file for modification
- `frontend/src/composables/useAlerts.ts` - Source of standardized `formatDate` function
- `frontend/src/components/Molecules/AlertTable.vue` - Reference implementation using `useAlerts`

### Related Issues
- GitHub Issue #110: https://github.com/TeckVeho/health-checker/issues/110

### Documentation
- Project README.md
- Component documentation in respective files
- TypeScript type definitions in `frontend/src/types/alerts.ts`

---

**Generated on**: 2025-09-20  
**Specification Version**: 1.0  
**Author**: AI Development Assistant
