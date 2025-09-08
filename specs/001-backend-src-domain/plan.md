# Implementation Plan: checkIssues.ts Refactoring

**Branch**: `001-backend-src-domain` | **Date**: 2025-09-08 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-backend-src-domain/spec.md`

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
Refactoring the checkIssues.ts utility file (746 lines) to improve maintainability by modularizing issue-checking logic into domain-specific modules (Branch, Security, Issue) while maintaining 100% backward compatibility with existing external interfaces.

## Technical Context
**Language/Version**: TypeScript 5.x / Node.js 18+  
**Primary Dependencies**: @octokit/rest, @ai-sdk/openai, ai  
**Storage**: N/A (GitHub API as data source)  
**Testing**: Jest with comprehensive mocking  
**Target Platform**: Node.js server environment
**Project Type**: web (backend service)  
**Performance Goals**: Maintain current API call efficiency  
**Constraints**: Preserve exact public API, pass all existing tests  
**Scale/Scope**: 746 LOC → ~150 LOC per module (5-6 modules)

## Constitution Check
*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Simplicity**:
- Projects: 1 (backend refactoring only)
- Using framework directly? Yes (direct @octokit/rest usage)
- Single data model? Yes (maintaining existing interfaces)
- Avoiding patterns? Yes (simple module extraction)

**Architecture**:
- EVERY feature as library? Yes (modular structure)
- Libraries listed:
  - checkIssues/core: Main orchestration
  - checkIssues/github: GitHub API integration
  - checkIssues/projects: Project field extraction
  - checkIssues/parsers: Text parsing utilities
  - checkIssues/llm: AI-powered analysis
  - checkIssues/validators: Business rule checks
- CLI per library: Existing CLI maintained via main export
- Library docs: JSDoc comments for each module

**Testing (NON-NEGOTIABLE)**:
- RED-GREEN-Refactor cycle enforced? Yes (existing tests must pass)
- Git commits show tests before implementation? Yes
- Order: Contract→Integration→E2E→Unit strictly followed? Yes
- Real dependencies used? Mocks appropriate for GitHub API
- Integration tests for: new libraries, contract changes, shared schemas? Yes
- FORBIDDEN: Implementation before test, skipping RED phase ✓

**Observability**:
- Structured logging included? Maintaining existing logging
- Frontend logs → backend? N/A (backend only)
- Error context sufficient? Yes (preserving error handling)

**Versioning**:
- Version number assigned? N/A (internal refactoring)
- BUILD increments on every change? N/A
- Breaking changes handled? Zero breaking changes allowed

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

**Structure Decision**: Option 2 (Web application - backend module refactoring)

## Phase 0: Outline & Research ✅
1. **Analyzed existing codebase**:
   - 746 lines of code in single file
   - 7 distinct check categories identified
   - 1 public API function to preserve
   - 2 exported interfaces to maintain

2. **Researched module structure**:
   - Identified 6 logical module boundaries
   - Validated no circular dependencies
   - Confirmed performance implications minimal

3. **Consolidated findings** in `research.md`:
   - Decision: 6-module architecture
   - Rationale: Natural separation of concerns
   - Alternatives: 3-module (too coarse), 10-module (too fine)

**Output**: research.md ✅ COMPLETED

## Phase 1: Design & Contracts ✅
*Prerequisites: research.md complete ✅*

1. **Extracted entities** → `data-model.md` ✅:
   - Core interfaces (IssueAlertCandidate, CheckIssuesResult)
   - Internal structures (GitHubIssue, ProjectFieldValue, etc.)
   - Module dependency graph documented

2. **Generated module contracts** → `/contracts/module-contracts.ts` ✅:
   - Public API preservation contract
   - Inter-module interface definitions
   - Factory pattern for dependency injection

3. **Contract validation approach** defined:
   - Existing tests serve as contract tests
   - New module tests will validate internal contracts
   - Tests will be written before implementation (TDD)

4. **Test scenarios extracted** → `quickstart.md` ✅:
   - Backward compatibility validation steps
   - Performance comparison methodology
   - Module independence verification

5. **Updated agent file** ✅:
   - Ran `scripts/update-agent-context.sh claude`
   - CLAUDE.md created with feature context
   - Ready for AI-assisted implementation

**Output**: data-model.md ✅, /contracts/module-contracts.ts ✅, quickstart.md ✅, CLAUDE.md ✅

## Phase 2: Task Planning Approach ✅
*This section describes what the /tasks command will do - ready for execution*

**Task Generation Strategy**:
- Load `/templates/tasks-template.md` as base
- Generate tasks from Phase 1 artifacts:
  - Create module structure (6 tasks)
  - Extract and test each module (12 tasks)
  - Integration testing (3 tasks)
  - Validation and cleanup (3 tasks)

**Ordering Strategy**:
- TDD order: Tests before implementation
- Module extraction order:
  1. Types module (shared interfaces)
  2. Parsers module (no dependencies)
  3. GitHub module (API client)
  4. Projects module (depends on GitHub)
  5. LLM module (depends on Parsers)
  6. Validators module (depends on all)
  7. Core orchestrator (wires everything)

**Estimated Output**: ~24 numbered, ordered tasks in tasks.md

**Ready for /tasks command execution**

## Phase 3+: Future Implementation
*These phases are beyond the scope of the /plan command*

**Phase 3**: Task execution (/tasks command creates tasks.md)  
**Phase 4**: Implementation (execute tasks.md following constitutional principles)  
**Phase 5**: Validation (run tests, execute quickstart.md, performance validation)

## Complexity Tracking
*Fill ONLY if Constitution Check has violations that must be justified*

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |


## Progress Tracking
*This checklist is updated during execution flow*

**Phase Status**:
- [x] Phase 0: Research complete (/plan command)
- [x] Phase 1: Design complete (/plan command)
- [x] Phase 2: Task planning complete (/plan command - approach defined)
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