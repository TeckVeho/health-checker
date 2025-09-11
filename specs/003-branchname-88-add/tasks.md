# Tasks: Display Health Check Alerts Grouped by Issue Author

**Input**: Design documents from `/specs/003-branchname-88-add/`
**Prerequisites**: plan.md (required), research.md, data-model.md, contracts/

## Execution Flow (main)
```
1. Load plan.md from feature directory
   → Tech stack: TypeScript, Express, Sequelize, Nuxt 3, PrimeVue
   → Structure: Web app (backend/frontend)
2. Load design documents:
   → data-model.md: Alert entity extension, AuthorAggregation view
   → contracts/api-contract.yaml: 3 API endpoints
   → research.md: Technical decisions
3. Generate tasks by category:
   → Setup: Database migration for author fields
   → Tests: Contract tests for 3 endpoints, integration tests
   → Core: Model updates, service methods, API routes
   → Frontend: Author tab component
   → Polish: Performance validation, documentation
4. Apply task rules:
   → Different files = mark [P] for parallel
   → Tests before implementation (TDD)
5. Number tasks sequentially (T001-T025)
6. Return: SUCCESS (tasks ready for execution)
```

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions

## Path Conventions
- **Backend**: `backend/src/`, `backend/tests/`
- **Frontend**: `frontend/src/`, `frontend/tests/`
- Using existing web app structure per plan.md

## Phase 3.1: Setup & Database
- [ ] T001 Create database migration to add author fields to alerts table in backend/migrations/[timestamp]-add-author-fields.js
- [ ] T002 Update AlertAttributes interface with author fields in backend/src/domain/alert/alertSchema.ts
- [ ] T003 Update Alert Sequelize model with author columns in backend/src/domain/alert/alertModel.ts
- [ ] T004 Add database indexes for author queries in backend/migrations/[timestamp]-add-author-indexes.js

## Phase 3.2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3
**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**
- [ ] T005 [P] Contract test GET /api/alerts/by-author in backend/tests/contract/test_alerts_by_author.test.ts
- [ ] T006 [P] Contract test GET /api/alerts/authors/{author} in backend/tests/contract/test_alerts_by_specific_author.test.ts
- [ ] T007 [P] Contract test POST /api/alerts/backfill-authors in backend/tests/contract/test_backfill_authors.test.ts
- [ ] T008 [P] Integration test for author data extraction from GitHub in backend/tests/integration/test_github_author_extraction.test.ts
- [ ] T009 [P] Integration test for author aggregation logic in backend/tests/integration/test_author_aggregation.test.ts
- [ ] T010 [P] Frontend component test for AuthorGroupedTable in frontend/tests/unit/components/AuthorGroupedTable.test.ts

## Phase 3.3: Core Backend Implementation (ONLY after tests are failing)
- [ ] T011 Add author extraction logic to checkIssues function in backend/src/domain/alert/util/checkIssues/checkIssues.ts
- [ ] T012 Implement getAlertsByAuthor aggregation method in backend/src/domain/alert/alertService.ts
- [ ] T013 Implement getAlertsBySpecificAuthor method in backend/src/domain/alert/alertService.ts
- [ ] T014 Implement backfillAuthors method in backend/src/domain/alert/alertService.ts
- [ ] T015 Add GET /api/alerts/by-author route in backend/src/api/alertRoutes.ts
- [ ] T016 Add GET /api/alerts/authors/:author route in backend/src/api/alertRoutes.ts
- [ ] T017 Add POST /api/alerts/backfill-authors route in backend/src/api/alertRoutes.ts
- [ ] T018 Implement caching for author aggregations in backend/src/domain/alert/util/cache.ts

## Phase 3.4: Frontend Implementation
- [ ] T019 Create AuthorGroupedTable.vue component in frontend/src/components/molecules/AuthorGroupedTable.vue
- [ ] T020 Add Author tab to dashboard in frontend/src/pages/index.vue
- [ ] T021 Create composable for fetching author-grouped alerts in frontend/src/composables/useAuthorAlerts.ts
- [ ] T022 Add sorting functionality for author view (by count and alphabetical) in AuthorGroupedTable.vue

## Phase 3.5: Polish & Validation
- [ ] T023 [P] Performance test for aggregation query (<500ms) in backend/tests/performance/test_author_aggregation_perf.test.ts
- [ ] T024 Run quickstart.md validation scenarios manually
- [ ] T025 Update API documentation with new endpoints in backend/docs/api.md

## Dependencies
- Database setup (T001-T004) must complete first
- Tests (T005-T010) before implementation (T011-T022)
- T011 (author extraction) blocks T012-T014 (service methods)
- T012-T014 (service methods) block T015-T017 (API routes)
- T019 (component) blocks T020 (dashboard integration)
- All implementation before polish (T023-T025)

## Parallel Execution Examples

### Batch 1: Contract & Integration Tests (after setup)
```bash
# Launch T005-T010 together (all different files):
Task agent: "Contract test GET /api/alerts/by-author in backend/tests/contract/test_alerts_by_author.test.ts"
Task agent: "Contract test GET /api/alerts/authors/{author} in backend/tests/contract/test_alerts_by_specific_author.test.ts"
Task agent: "Contract test POST /api/alerts/backfill-authors in backend/tests/contract/test_backfill_authors.test.ts"
Task agent: "Integration test for author data extraction in backend/tests/integration/test_github_author_extraction.test.ts"
Task agent: "Integration test for author aggregation in backend/tests/integration/test_author_aggregation.test.ts"
Task agent: "Frontend component test for AuthorGroupedTable in frontend/tests/unit/components/AuthorGroupedTable.test.ts"
```

### Batch 2: Service Methods (after T011)
```bash
# T012-T014 can run in parallel (same file but different methods):
# Note: Actually sequential since same file - run one at a time
```

### Batch 3: API Routes (after service methods)
```bash
# T015-T017 must be sequential (same file backend/src/api/alertRoutes.ts)
```

## Notes
- Author field is nullable to maintain backward compatibility
- "Unknown Author" grouping for alerts without author data
- Caching strategy: 5-minute TTL for aggregations
- Default sort: by total alerts (descending)
- Performance target: <500ms for 1000 authors

## Validation Checklist
*Verified during task generation*

- [x] All contracts have corresponding tests (T005-T007)
- [x] Alert entity extension has model tasks (T002-T003)
- [x] All tests come before implementation (T005-T010 before T011-T022)
- [x] Parallel tasks truly independent (different files)
- [x] Each task specifies exact file path
- [x] No [P] task modifies same file as another [P] task

## Success Criteria
- Author tab appears in dashboard
- Alerts grouped correctly by author
- Sorting works (by count and alphabetically)
- API endpoints return correct data structure
- Performance meets <500ms target
- Backward compatibility maintained