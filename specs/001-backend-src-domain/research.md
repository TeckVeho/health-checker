# Research: checkIssues.ts Refactoring

**Date**: 2025-09-08  
**Feature**: Modularization of checkIssues.ts

## Executive Summary
Analysis of the existing 746-line checkIssues.ts file reveals opportunities for modularization into 6 focused modules while maintaining 100% backward compatibility. The refactoring will improve maintainability without changing any external interfaces.

## Current State Analysis

### File Metrics
- **Current size**: 746 lines of code
- **Functions**: 7 (1 exported public API, 6 internal helpers)
- **Responsibilities**: 7 distinct check categories
- **Test coverage**: 1161 lines of comprehensive tests

### Public API Surface
The following interfaces MUST be preserved:
1. `IssueAlertCandidate` interface (lines 20-32)
2. `CheckIssuesResult` interface (lines 34-38)  
3. `checkIssues(owner: string, repo: string): Promise<CheckIssuesResult>` function

## Architectural Decisions

### Decision 1: Module Structure
**Choice**: 6-module architecture
**Rationale**: Natural separation of concerns based on functionality
**Alternatives considered**:
- 3-module (too coarse, doesn't improve maintainability enough)
- 10-module (too fine-grained, increases complexity)

### Decision 2: Interface Preservation
**Choice**: Keep all existing interfaces in a shared types module
**Rationale**: Ensures 100% backward compatibility
**Alternatives considered**:
- Duplicate interfaces (violates DRY)
- Interface versioning (unnecessary for internal refactoring)

### Decision 3: Testing Strategy
**Choice**: Keep existing tests intact, add module-level tests
**Rationale**: Proves backward compatibility while improving coverage
**Alternatives considered**:
- Rewrite tests (risky, may miss edge cases)
- Test only at integration level (insufficient granularity)

## Module Breakdown

### 1. Core Module (`checkIssues/index.ts`)
**Purpose**: Main orchestration and public API
**Size estimate**: ~100 lines
**Responsibilities**:
- Export public interfaces
- Implement main `checkIssues` function
- Coordinate module calls

### 2. GitHub Module (`checkIssues/github.ts`)
**Purpose**: GitHub API interactions
**Size estimate**: ~150 lines
**Responsibilities**:
- Octokit client management
- Issue fetching
- GraphQL queries

### 3. Projects Module (`checkIssues/projects.ts`)
**Purpose**: GitHub Projects V2 integration
**Size estimate**: ~180 lines
**Responsibilities**:
- Project field value extraction
- Project membership checks
- GraphQL query handling

### 4. Parsers Module (`checkIssues/parsers.ts`)
**Purpose**: Text extraction utilities
**Size estimate**: ~80 lines
**Responsibilities**:
- Story point extraction
- End date parsing
- Pattern matching

### 5. LLM Module (`checkIssues/llm.ts`)
**Purpose**: AI-powered content analysis
**Size estimate**: ~150 lines
**Responsibilities**:
- Template detection
- Clarity analysis
- Fallback heuristics

### 6. Validators Module (`checkIssues/validators.ts`)
**Purpose**: Business rule validation
**Size estimate**: ~90 lines
**Responsibilities**:
- Assignment checks
- Story point validation
- Date validation

## Implementation Approach

### Phase Ordering
1. Create module structure and types
2. Extract GitHub integration
3. Extract project-related logic
4. Extract parsing utilities
5. Extract LLM analysis
6. Extract validation rules
7. Wire up orchestration in core

### Risk Mitigation
- **Risk**: Breaking external contracts
- **Mitigation**: Run full test suite after each extraction

- **Risk**: Performance degradation
- **Mitigation**: Maintain single API call patterns

- **Risk**: Module coupling
- **Mitigation**: Clear interfaces between modules

## Dependencies Analysis

### External Dependencies (Unchanged)
- `@octokit/rest`: GitHub API client
- `@ai-sdk/openai`: OpenAI integration
- `ai`: AI text generation utilities

### Internal Dependencies
- Config modules remain unchanged
- No new dependencies introduced

## Performance Considerations

### API Call Efficiency
- **Current**: Pre-loads project data, filters by date
- **After refactoring**: Same patterns maintained
- **Impact**: Zero performance change

### Module Loading
- **Current**: Single file load
- **After refactoring**: 6 module loads
- **Impact**: Negligible (TypeScript compilation handles this)

## Testing Requirements

### Existing Tests
- Must pass without modification
- 1161 lines of tests validate behavior
- Comprehensive mocking already in place

### New Tests
- Module-level unit tests for each extracted module
- Integration tests for module interactions
- Performance benchmarks to ensure no degradation

## Success Criteria

1. ✅ All existing tests pass without modification
2. ✅ Public API remains unchanged
3. ✅ Each module under 200 lines
4. ✅ Clear separation of concerns
5. ✅ Improved code organization metrics
6. ✅ No performance degradation

## Next Steps

1. Generate data model documentation
2. Create module contracts
3. Prepare quickstart guide
4. Generate task list for implementation

---

**All technical questions resolved. Ready for Phase 1: Design & Contracts**