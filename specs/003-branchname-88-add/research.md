# Research & Analysis: Display Alerts Grouped by Issue Author

**Feature**: Group health check alerts by issue author  
**Date**: 2025-09-10  
**Phase**: 0 - Research

## Executive Summary

Research confirms the health-checker codebase is well-positioned to add author-based grouping functionality. The existing architecture supports extending the alert schema with author information and creating new view options in the frontend dashboard.

## Key Findings

### 1. Data Model Extension Approach

**Decision**: Extend existing AlertAttributes interface with author field  
**Rationale**: 
- AlertSchema already exists at `backend/src/domain/alert/alertSchema.ts`
- Current schema has comprehensive fields but lacks author information
- Sequelize model supports easy schema evolution with migrations

**Alternatives Considered**:
- Separate Author table with foreign key - rejected due to unnecessary complexity for this use case
- Storing author in metadata JSON field - rejected as it would prevent efficient querying

### 2. GitHub API Integration for Author Data

**Decision**: Leverage existing Octokit client to fetch issue author data  
**Rationale**:
- GitHub integration already implemented in `backend/src/domain/alert/util/checkIssues/github.ts`
- Octokit client configured with authentication
- Issue fetching already retrieves full issue objects including author

**Implementation Details**:
- Issue objects from GitHub API include `user` field with author information
- Can extract `user.login` (username) and `user.avatar_url` if needed
- No additional API calls needed - author data comes with issue fetch

### 3. Frontend Display Strategy

**Decision**: Add new tab in existing dashboard with author-grouped view  
**Rationale**:
- Dashboard already has tabbed interface (Severity view, CheckType view)
- PrimeVue DataTable supports grouping functionality
- Consistent with existing UI patterns

**Alternatives Considered**:
- Separate page for author view - rejected to maintain single dashboard experience
- Filter overlay - rejected as it doesn't provide the same analytical value

### 4. Sorting and Filtering Approach

**Decision**: Default sort by total alert count (descending), with option to sort alphabetically  
**Rationale**:
- Users primarily want to identify authors with most issues
- Alphabetical sorting useful for finding specific authors
- Matches existing pattern of sortable columns in AlertTable

**Handling Edge Cases**:
- Issues without authors: Group under "Unknown Author" category
- Deleted GitHub users: Display as "[Deleted User]" with original username if cached
- Bot accounts: Display with bot indicator icon

### 5. Performance Considerations

**Decision**: Implement server-side aggregation with caching  
**Rationale**:
- Frontend already expects aggregated data from backend
- Can leverage existing alert caching mechanisms
- Avoid performance issues with large datasets

**Scale Targets**:
- Support up to 1000 authors efficiently
- Aggregate up to 10,000 alerts
- Response time under 500ms for grouped view

### 6. Testing Strategy

**Decision**: Follow existing test patterns with unit and integration tests  
**Rationale**:
- Jest/Vitest setup already configured
- Existing test patterns for alert service and UI components
- Can reuse test utilities and mocks

**Test Coverage**:
- Unit tests for author extraction logic
- Integration tests for grouped API endpoint
- Frontend component tests for author view
- E2E test for complete user flow

## Technical Context Resolution

Based on research, all NEEDS CLARIFICATION items from spec are resolved:

| Spec Item | Resolution |
|-----------|------------|
| Sort order | Default by alert count (desc), optional alphabetical |
| Missing authors | Group as "Unknown Author" |
| UI placement | New tab in existing dashboard |
| Performance targets | 1000 authors, 10k alerts, <500ms response |

## Dependencies and Integration Points

### Existing Components to Modify
1. **AlertAttributes** interface - add author field
2. **Alert Sequelize model** - add author column with migration
3. **checkIssues.ts** - extract and store author during issue processing
4. **AlertService** - add getAlertsByAuthor method
5. **Alert API routes** - add grouped-by-author endpoint
6. **Dashboard index.vue** - add Author tab
7. **New component** - AuthorGroupedTable.vue

### No New External Dependencies Required
- Octokit already provides author data
- PrimeVue DataTable supports grouping
- Sequelize handles schema migration

## Risk Analysis

**Low Risk**:
- Schema extension is backward compatible
- Author data readily available from GitHub API
- UI framework supports required functionality

**Mitigations**:
- Add author field as nullable initially
- Backfill existing alerts in batches
- Implement feature flag for gradual rollout

## Recommendations

1. **Phase rollout**: Start with read-only author display, then add filtering
2. **Cache strategy**: Cache author aggregations for 5 minutes
3. **Analytics**: Track usage of new view to validate feature value
4. **Future enhancement**: Consider author profiles with contribution history

## Conclusion

The feature is technically feasible with minimal risk. The existing architecture supports the required changes without major refactoring. All clarification points from the specification have been resolved through research.