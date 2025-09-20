# Issue #150: Add Total alert count display in Author-Based view

## Overview

This specification defines the enhancement to the Author-Based view in the health-checker application to display the total alert count for each author in a dedicated "Total" column. This new column will provide users with better visibility into each author's overall workload.

## Purpose

The primary goal is to improve user experience and data visibility by:
- Providing a quick overview of each author's total alert volume
- Enhancing decision-making capabilities for project managers and team leads
- Maintaining the existing UI layout while adding valuable information
- Supporting responsive design across different screen sizes

## Functional Requirements

### FR-1: Total Alert Count Display
The system SHALL display the total number of alerts for each author in the Author-Based view table.

### FR-2: Column Structure Requirements
The total alert count SHALL be displayed in a dedicated column with the header label "Total".

### FR-3: Formatting Standards
The total count SHALL be displayed as a badge component showing the numeric value only (e.g., "15", "7", "0").

### FR-4: Real-time Updates
The total alert count SHALL update automatically when alert data changes without requiring a page refresh.

### FR-5: Responsive Design
The total alert count display SHALL maintain readability and proper layout on both desktop and mobile devices.

## Specification

### Features

#### Primary Feature: Total Alert Count Column
- **Display Component**: Badge component showing total alert count
- **Data Source**: `AuthorAggregation.totalAlerts` field from existing API
- **Column Header**: "Total"
- **Column Position**: Between Author column and No SP column
- **Format**: Numeric badge display (e.g., Badge with value="15")

#### Secondary Features
- **Sortable Column**: Total alert count should remain sortable via existing functionality
- **Consistent Styling**: Follow existing badge styling patterns for visual consistency
- **Tooltip Support**: Optional tooltip showing breakdown of alert types on hover

### System Requirements

#### Required External Tools
- **Frontend Framework**: Nuxt 3 + Vue 3 (Composition API)
- **UI Component Library**: PrimeVue (DataTable, Badge, Column components)
- **Build Tools**: Vite, TypeScript
- **Testing Framework**: Vitest for unit tests

#### Operating Environment
- **Browser Compatibility**: Modern browsers supporting ES2020+
- **Responsive Breakpoints**: Mobile (320px+), Tablet (768px+), Desktop (1024px+)
- **Performance**: No additional API calls required (uses existing data)

#### Quality Requirements

##### Performance Requirements
- **Response Time**: Total count display should render with existing table data (< 100ms)
- **Memory Usage**: No significant increase in client-side memory consumption
- **Network Impact**: Zero additional network requests (uses cached data)

##### Usability Requirements
- **Readability**: Text contrast ratio must meet WCAG 2.1 AA standards
- **Accessibility**: Screen reader compatible with appropriate ARIA labels
- **Visual Consistency**: Follows existing design system color schemes and typography

##### Maintainability Requirements
- **Code Quality**: TypeScript strict mode compliance
- **Testing Coverage**: Minimum 80% unit test coverage for new components
- **Documentation**: Inline code comments for complex logic

## Success Criteria

### Functional Criteria

#### FC-1: Accurate Data Display
- [ ] Total alert count matches the sum of all alert types for each author
- [ ] Count updates correctly when filtering or sorting data
- [ ] Display handles edge cases (zero alerts, null values) gracefully

#### FC-2: UI Integration
- [ ] Total column appears between Author and No SP columns
- [ ] Column header displays "Total" label
- [ ] Visual styling is consistent with existing badge components
- [ ] Column sorting functionality is implemented for total alerts

#### FC-3: Cross-platform Compatibility
- [ ] Display renders correctly on Chrome, Firefox, Safari, Edge
- [ ] Mobile layout maintains readability without horizontal scrolling
- [ ] Text size scales appropriately for different screen densities

### Non-Functional Criteria

#### NFC-1: Performance Standards
- [ ] Page load time increase is less than 50ms
- [ ] Table rendering performance is not degraded
- [ ] Memory usage increase is less than 5%

#### NFC-2: Code Quality Standards
- [ ] All TypeScript compilation passes without warnings
- [ ] ESLint and Prettier configurations are satisfied
- [ ] Unit tests achieve minimum 80% coverage

#### NFC-3: Accessibility Compliance
- [ ] Screen readers can announce total count information
- [ ] Keyboard navigation remains functional
- [ ] Color contrast meets WCAG 2.1 AA requirements

## Technical Implementation Details

### Data Structure
```typescript
interface AuthorAggregation {
  author: string;
  displayName: string | null;
  totalAlerts: number; // <- This field will be used
  issueTypeCounts: {
    missingSp: number; // <- Current "(No SP)" source
    // ... other counts
  };
}
```

### Component Modifications
- **File**: `frontend/src/components/Molecules/AuthorGroupedTable.vue`
- **Column**: New "Total" column addition
- **Position**: Insert between Author column (line ~73) and No SP column (line ~76)
- **Template**: Badge component with totalAlerts value
- **Sorting**: Add sortable functionality for totalAlerts field

### Styling Approach
- Utilize existing PrimeVue Badge component for consistency
- Apply existing color scheme for severity indicators
- Ensure proper spacing with CSS Grid or Flexbox

## References

- [Issue #150 GitHub Link](https://github.com/TeckVeho/health-checker/issues/150)
- [PrimeVue DataTable Documentation](https://primefaces.org/primevue/datatable)
- [Vue 3 Composition API Documentation](https://vuejs.org/guide/extras/composition-api-faq.html)
- [WCAG 2.1 Accessibility Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

---

*This specification document was generated on 2025-09-21 for development planning purposes.*