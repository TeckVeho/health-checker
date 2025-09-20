# Implementation Plan: Display Health Check Alerts Grouped by Issue Author

**Branch**: `003-branchname-88-add` | **Date**: 2025-09-10 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/003-branchname-88-add/spec.md`

## Execution Flow (/plan command scope)
```
1. Load feature spec from Input path
   → If not found: ERROR "No feature spec at {path}"
2. Fill Technical Context (scan for NEEDS CLARIFICATION)
   → Detect Project Type from context (web=frontend+backend, mobile=app+api)
   → Set Structure Decision based on project type
3. Evaluate Constitution Check section below
   → If violations exist: Document in Complexity Tracking
   → If no justification possible: ERROR "Simplify approach first"
   → Update Progress Tracking: Initial Constitution Check
4. Execute Phase 0 → research.md
   → If NEEDS CLARIFICATION remain: ERROR "Resolve unknowns"
5. Execute Phase 1 → contracts, data-model.md, quickstart.md, agent-specific template file (e.g., `CLAUDE.md` for Claude Code, `.github/copilot-instructions.md` for GitHub Copilot, or `GEMINI.md` for Gemini CLI).
6. Re-evaluate Constitution Check section
   → If new violations: Refactor design, return to Phase 1
   → Update Progress Tracking: Post-Design Constitution Check
7. Plan Phase 2 → Describe task generation approach (DO NOT create tasks.md)
8. STOP - Ready for /tasks command
```

**IMPORTANT**: The /plan command STOPS at step 7. Phases 2-4 are executed by other commands:
- Phase 2: /tasks command creates tasks.md
- Phase 3-4: Implementation execution (manual or via tools)

## Summary
Implement functionality to display health check alerts grouped by issue author, enabling repository managers to identify patterns in issue creation and understand responsibility distribution. The solution extends the existing alert schema with author information fetched from GitHub API and adds a new tabbed view in the dashboard for author-based aggregation.

## Technical Context
**Language/Version**: TypeScript 5.x / Node.js 18+  
**Primary Dependencies**: Backend: Express, Sequelize, Octokit | Frontend: Nuxt 3, Vue 3, PrimeVue  
**Storage**: MySQL/PostgreSQL via Sequelize ORM  
**Testing**: Backend: Jest with ts-jest | Frontend: Vitest  
**Target Platform**: Web application (Linux server deployment)
**Project Type**: web (frontend + backend architecture)  
**Performance Goals**: <500ms aggregation query, support 1000 authors  
**Constraints**: Must maintain backward compatibility, no breaking changes to existing APIs  
**Scale/Scope**: Handle 10,000 alerts across 1,000 authors efficiently

## Constitution Check
*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Simplicity**:
- Projects: 2 (backend, frontend)
- Using framework directly? Yes - Express and Nuxt used directly
- Single data model? Yes - AlertAttributes extended, no separate DTOs
- Avoiding patterns? Yes - using existing service layer, no new patterns

**Architecture**:
- EVERY feature as library? Feature extends existing alert module
- Libraries listed: alert-author (author data extraction and aggregation)
- CLI per library: N/A - web API feature
- Library docs: API documentation via Swagger/OpenAPI

**Testing (NON-NEGOTIABLE)**:
- RED-GREEN-Refactor cycle enforced? Yes - tests written first
- Git commits show tests before implementation? Yes
- Order: Contract→Integration→E2E→Unit strictly followed? Yes
- Real dependencies used? Database for integration tests
- Integration tests for: API endpoints, schema changes, aggregation logic
- FORBIDDEN: Implementation before test, skipping RED phase

**Observability**:
- Structured logging included? Yes - existing logging framework
- Frontend logs → backend? Existing error reporting
- Error context sufficient? Yes - author fetch failures logged with context

**Versioning**:
- Version number assigned? 1.1.0 (minor feature addition)
- BUILD increments on every change? Yes via CI/CD
- Breaking changes handled? None - backward compatible addition

## Project Structure

### Documentation (this feature)
```
specs/[###-feature]/
├── plan.md              # This file (/plan command output)
├── research.md          # Phase 0 output (/plan command)
├── data-model.md        # Phase 1 output (/plan command)
├── quickstart.md        # Phase 1 output (/plan command)
├── contracts/           # Phase 1 output (/plan command)
└── tasks.md             # Phase 2 output (/tasks command - NOT created by /plan)
```

### Source Code (repository root)
```
# Option 1: Single project (DEFAULT)
src/
├── models/
├── services/
├── cli/
└── lib/

tests/
├── contract/
├── integration/
└── unit/

# Option 2: Web application (when "frontend" + "backend" detected)
backend/
├── src/
│   ├── models/
│   ├── services/
│   └── api/
└── tests/

frontend/
├── src/
│   ├── components/
│   ├── pages/
│   └── services/
└── tests/

# Option 3: Mobile + API (when "iOS/Android" detected)
api/
└── [same as backend above]

ios/ or android/
└── [platform-specific structure]
```

**Structure Decision**: Option 2 - Web application (existing backend/frontend structure)

## Phase 0: Outline & Research
1. **Extract unknowns from Technical Context** above:
   - ✅ Sort order for authors - RESOLVED: by alert count (desc) default
   - ✅ Handling missing authors - RESOLVED: "Unknown Author" grouping
   - ✅ UI placement - RESOLVED: new tab in dashboard
   - ✅ Performance requirements - RESOLVED: <500ms, 1000 authors

2. **Research completed**:
   - Analyzed existing alert schema and database model
   - Reviewed GitHub API integration for author data availability
   - Examined frontend dashboard structure for integration points
   - Evaluated performance implications of aggregation queries

3. **Findings consolidated** in `research.md`:
   - Decision: Extend AlertAttributes with author field
   - Rationale: Minimal changes, backward compatible
   - Alternatives: Separate table rejected for complexity

**Output**: ✅ research.md complete with all clarifications resolved

## Phase 1: Design & Contracts
*Prerequisites: research.md complete*

1. **Entities extracted** → `data-model.md`:
   - ✅ Alert entity extended with author fields
   - ✅ AuthorAggregation view model defined
   - ✅ Validation rules and state transitions documented

2. **API contracts generated** → `/contracts/api-contract.yaml`:
   - ✅ GET /api/alerts/by-author - grouped aggregation
   - ✅ GET /api/alerts/authors/{author} - specific author alerts
   - ✅ POST /api/alerts/backfill-authors - data migration

3. **Contract tests planned** (for /tasks phase):
   - Test for by-author endpoint response schema
   - Test for author-specific endpoint
   - Test for backfill job initiation

4. **Test scenarios extracted** → `quickstart.md`:
   - ✅ Basic author grouping scenario
   - ✅ Sorting scenarios (count and alphabetical)
   - ✅ Unknown author handling
   - ✅ API validation steps

5. **Agent file update** (pending):
   - Will update CLAUDE.md with new feature context
   - Add author grouping to active technologies
   - Document new API endpoints

**Output**: ✅ data-model.md, ✅ /contracts/api-contract.yaml, ✅ quickstart.md

## Phase 2: Task Planning Approach
*This section describes what the /tasks command will do - DO NOT execute during /plan*

**Task Generation Strategy**:
- Load `/templates/tasks-template.md` as base
- Generate tasks from Phase 1 design docs:
  - Schema migration task for author fields
  - Contract test tasks for 3 API endpoints [P]
  - Author extraction logic in checkIssues
  - AlertService aggregation methods
  - API route implementations
  - Frontend Author tab component
  - Integration test tasks

**Ordering Strategy**:
1. Database schema migration (prerequisite)
2. Contract tests (TDD - must fail first) [P]
3. Backend implementation (model → service → API)
4. Frontend implementation (component → integration)
5. Integration and E2E tests
6. Performance validation

**Estimated Output**: 20-25 numbered, ordered tasks in tasks.md

**Task Categories**:
- Database: 1-2 tasks (migration, indexes)
- Testing: 8-10 tasks (contract, unit, integration)
- Backend: 5-6 tasks (model, service, API)
- Frontend: 3-4 tasks (component, view, integration)
- Validation: 2-3 tasks (quickstart, performance)

**IMPORTANT**: This phase is executed by the /tasks command, NOT by /plan

## Phase 3+: Future Implementation
*These phases are beyond the scope of the /plan command*

**Phase 3**: Task execution (/tasks command creates tasks.md)  
**Phase 4**: Implementation (execute tasks.md following constitutional principles)  
**Phase 5**: Validation (run tests, execute quickstart.md, performance validation)

## Complexity Tracking
*Fill ONLY if Constitution Check has violations that must be justified*

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| None | N/A | N/A |


## Progress Tracking
*This checklist is updated during execution flow*

**Phase Status**:
- [x] Phase 0: Research complete (/plan command)
- [x] Phase 1: Design complete (/plan command)
- [x] Phase 2: Task planning complete (/plan command - describe approach only)
- [ ] Phase 3: Tasks generated (/tasks command)
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:
- [x] Initial Constitution Check: PASS
- [x] Post-Design Constitution Check: PASS
- [x] All NEEDS CLARIFICATION resolved
- [x] Complexity deviations documented (none required)

---
*Based on Constitution v2.1.1 - See `/memory/constitution.md`*