# Tasks: checkIssues.ts Refactoring

**Input**: Design documents from `/specs/001-backend-src-domain/`
**Prerequisites**: plan.md (✅), research.md (✅), data-model.md (✅), contracts/ (✅)

## Execution Flow (main)
```
1. Load plan.md from feature directory
   → Tech stack: TypeScript, Jest, @octokit/rest, @ai-sdk/openai
   → Structure: backend/src/domain/alert/util/checkIssues/
2. Load design documents:
   → data-model.md: 6 modules identified
   → contracts/module-contracts.ts: Module interfaces defined
   → research.md: Refactoring approach validated
3. Generate tasks by category:
   → Setup: Create module directory structure
   → Tests: Update existing tests for modules
   → Core: Extract each module (types, parsers, github, projects, llm, validators)
   → Integration: Wire up orchestrator
   → Polish: Verify backward compatibility
4. Apply task rules:
   → Different modules = mark [P] for parallel
   → Same file = sequential (no [P])
   → Tests before implementation (TDD)
5. Number tasks sequentially (T001-T025)
6. Return: SUCCESS (tasks ready for execution)
```

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions

## Path Convention
- Maintaining existing structure: `backend/src/domain/alert/util/checkIssues/`
- Tests: `backend/tests/unit/domain/alert/checkIssues/`
- Original file: `backend/src/domain/alert/util/checkIssues.ts`

## Phase 3.1: Setup & Structure
- [ ] T001 Create module directory at backend/src/domain/alert/util/checkIssues/
- [ ] T002 Create backward compatibility index at backend/src/domain/alert/util/checkIssues.ts that re-exports from checkIssues/index.ts
- [ ] T003 Create test directory structure at backend/tests/unit/domain/alert/checkIssues/

## Phase 3.2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3
**CRITICAL: Create module test files that will verify extracted modules**
- [ ] T004 [P] Create types module test in backend/tests/unit/domain/alert/checkIssues/types.test.ts
- [ ] T005 [P] Create parsers module test in backend/tests/unit/domain/alert/checkIssues/parsers.test.ts
- [ ] T006 [P] Create github module test in backend/tests/unit/domain/alert/checkIssues/github.test.ts
- [ ] T007 [P] Create projects module test in backend/tests/unit/domain/alert/checkIssues/projects.test.ts
- [ ] T008 [P] Create llm module test in backend/tests/unit/domain/alert/checkIssues/llm.test.ts
- [ ] T009 [P] Create validators module test in backend/tests/unit/domain/alert/checkIssues/validators.test.ts
- [ ] T010 Verify existing tests still run: npm test -- backend/tests/unit/domain/alert/checkIssues.test.ts

## Phase 3.3: Core Module Extraction (ONLY after tests are ready)
**Extract modules from checkIssues.ts while maintaining functionality**

### Types Module (Foundation)
- [ ] T011 Extract interfaces to backend/src/domain/alert/util/checkIssues/types.ts (IssueAlertCandidate, CheckIssuesResult, internal types)

### Independent Modules
- [ ] T012 [P] Extract text parsing to backend/src/domain/alert/util/checkIssues/parsers.ts (extractStoryPoints, extractEndDate, detectTemplateMarkers)
- [ ] T013 [P] Extract GitHub client to backend/src/domain/alert/util/checkIssues/github.ts (Octokit setup, fetchIssues, graphql wrapper)

### Dependent Modules
- [ ] T014 Extract projects analyzer to backend/src/domain/alert/util/checkIssues/projects.ts (getAllProjectFieldValues, getAllProjectIssues - depends on github.ts)
- [ ] T015 Extract LLM analyzer to backend/src/domain/alert/util/checkIssues/llm.ts (detectTemplateOnlyIssue, detectUnclearInstructions - depends on parsers.ts)
- [ ] T016 Extract validators to backend/src/domain/alert/util/checkIssues/validators.ts (all validation logic - depends on types.ts)

### Core Orchestrator
- [ ] T017 Create main orchestrator in backend/src/domain/alert/util/checkIssues/index.ts (checkIssues function wiring all modules)

## Phase 3.4: Integration & Compatibility
- [ ] T018 Update backward compatibility wrapper at backend/src/domain/alert/util/checkIssues.ts to properly re-export from index.ts
- [ ] T019 Verify all existing imports work: grep -r "from.*checkIssues" backend/src/
- [ ] T020 Run existing test suite to ensure backward compatibility: npm test -- backend/tests/unit/domain/alert/checkIssues.test.ts
- [ ] T021 Run new module tests: npm test -- backend/tests/unit/domain/alert/checkIssues/

## Phase 3.5: Polish & Validation
- [ ] T022 Remove old monolithic code from original checkIssues.ts (keeping only re-exports)
- [ ] T023 Verify file sizes: each module should be under 200 lines
- [ ] T024 Run linting and type checking: npm run lint && npm run typecheck
- [ ] T025 Execute quickstart validation steps from quickstart.md

## Dependencies
- **Setup (T001-T003)** must complete first
- **Tests (T004-T010)** before any implementation
- **T011 (types)** blocks all other extractions
- **T012-T013** can run in parallel (independent)
- **T014** depends on T013 (github)
- **T015** depends on T012 (parsers)
- **T016** depends on T011 (types)
- **T017** depends on T011-T016 (all modules)
- **T018-T021** depend on T017
- **Polish (T022-T025)** after all integration

## Parallel Execution Examples

### After T011 completes, launch T012-T013:
```bash
# These can run simultaneously as they don't share dependencies
Task: "Extract text parsing to backend/src/domain/alert/util/checkIssues/parsers.ts"
Task: "Extract GitHub client to backend/src/domain/alert/util/checkIssues/github.ts"
```

### After setup, launch test creation T004-T009:
```bash
# All test files are independent
Task: "Create types module test in backend/tests/unit/domain/alert/checkIssues/types.test.ts"
Task: "Create parsers module test in backend/tests/unit/domain/alert/checkIssues/parsers.test.ts"
Task: "Create github module test in backend/tests/unit/domain/alert/checkIssues/github.test.ts"
Task: "Create projects module test in backend/tests/unit/domain/alert/checkIssues/projects.test.ts"
Task: "Create llm module test in backend/tests/unit/domain/alert/checkIssues/llm.test.ts"
Task: "Create validators module test in backend/tests/unit/domain/alert/checkIssues/validators.test.ts"
```

## Important Notes
- **Context**: Refactoring within backend/src/domain/alert/util/ - maintain this structure
- **Backward Compatibility**: Original import path must continue to work
- **Test-First**: Module tests should be created before extraction
- **Incremental**: Each extraction should maintain all existing functionality
- **Validation**: Run existing tests after each major extraction

## Task Validation Checklist
- [x] All modules from plan have extraction tasks
- [x] All tests come before implementation
- [x] Parallel tasks are truly independent
- [x] Each task specifies exact file path
- [x] No parallel tasks modify the same file
- [x] Backward compatibility maintained throughout

---

**Total Tasks**: 25
**Estimated Duration**: 4-6 hours
**Parallel Opportunities**: 8 tasks can run in parallel groups