# Dev Command

Develop code using flexible development methodology with AI Agent

## Parameters

- `issue_number` (optional): Issue number. If omitted, uses the most recently processed issue from previous `/issue` command
- `output_path` (optional): Output directory path (defaults to current directory)

## Instructions

Develop code using flexible development methodology through interactive AI Agent collaboration.

**Instructions for AI Agent:**

**⛔ ABSOLUTE PROHIBITION: DO NOT EXECUTE ANY GIT COMMIT COMMANDS ⛔**
- NEVER run `git commit` in any form
- NEVER run `git add . && git commit`
- NEVER suggest or execute commit operations
- Development phase MUST end with uncommitted changes

**📁 FILE CREATION RESTRICTIONS:**
- **ALL verification scripts, test data, and temporary files MUST be created in `.cursor/workspace/{issue_number}/` only**
- **PROHIBITED locations for verification files:**
  - `docs/issues/{issue_number}/evidence/` (except for final reports)
  - Project root directory
  - `backend/` or `frontend/` directories
  - Any other project directories
- **Only final, polished reports should be saved to `docs/issues/{issue_number}/evidence/`**
- **All intermediate files and raw data must remain in `.cursor/workspace/{issue_number}/`**

1. **Determine Issue Number**: 
   - If `issue_number` is provided: Use the specified issue number
   - If `issue_number` is omitted: Look for the most recently created issue document in `docs/issues/*/issue.md` to determine the issue number
   - Check for existing `docs/issues/{issue_number}/issue.md` file to ensure issue data is available
2. **Choose Development Approach**: Determine if TDD or Direct Implementation is appropriate based on integrated development methodology
3. **Interactive Development Process**: Guide the user through the chosen approach
4. **Code Implementation**: Assist with implementation based on the chosen approach
5. **Validation**: Guide through testing and validation (WITHOUT committing)
6. **Refactoring**: Help improve code quality while maintaining functionality (WITHOUT committing)
7. **Final Check**: Ensure all changes remain uncommitted before completing development phase

**🚨 CRITICAL: NEVER COMMIT CHANGES DURING DEVELOPMENT 🚨**

**STRICT RULE**: Do NOT use `git commit`, `git add && git commit`, or any commit commands during development phase.
- All changes MUST remain uncommitted
- Changes will be committed later in the `/test` and `/pr` phases
- This ensures proper testing before committing
- Violating this rule breaks the development workflow

**Development Approach Guidelines:**

### Test-Driven Development (TDD) - When Applicable
For code that benefits from testing (business logic, algorithms, APIs):
1. **Red**: Write a failing test
2. **Green**: Write minimal code to make the test pass
3. **Refactor**: Improve the code while keeping tests green

**Use TDD when:**
- Implementing business logic
- Creating algorithms or data processing
- Building APIs or services
- Complex functionality with multiple edge cases

### Direct Implementation - When Testing is Not Suitable
For configuration, commands, scripts, or simple implementations:
1. **Analyze**: Understand requirements
2. **Implement**: Write the implementation directly
3. **Validate**: Test manually or through integration
4. **Refactor**: Improve code quality

**Use Direct Implementation when:**
- Creating configuration files
- Implementing simple commands or scripts
- Setting up infrastructure or deployment
- Simple CRUD operations
- Frontend UI components (manual testing preferred)

**Development Workflow Phases:**

### Phase 1: Requirements Analysis
- **Objective**: Understand what needs to be implemented
- **Approach**: Analyze requirements and choose development approach
- **Focus**: Clarity on functionality and implementation strategy

### Phase 2: Implementation
- **TDD Approach**: Write tests first, then minimal code
- **Direct Approach**: Implement functionality directly
- **Focus**: Working solution over perfect code

### Phase 3: Validation
- **TDD Approach**: Run test suite and analyze results
- **Direct Approach**: Manual testing or integration testing
- **Focus**: Verify functionality works as expected

### Phase 4: Refactoring
- **Objective**: Improve code quality while maintaining functionality
- **Approach**: Clean up code, improve performance, enhance readability
- **Focus**: Code quality without breaking existing functionality

**🔒 DEVELOPMENT OUTPUT REQUIREMENTS 🔒**

**MANDATORY**: All changes MUST remain uncommitted after development completion
- **NO git commit commands** during `/dev` execution
- **NO git add && git commit** combinations
- **NO automatic commits** of any kind
- Changes will be properly committed in `/pr` command after testing
- This separation ensures code quality and proper testing workflow

**Workflow Sequence**: `/dev` (no commits) → `/test` (validation) → `/pr` (commit & PR creation)

**Auto-Detection Process:**
- Search `docs/issues/*/issue.md` files for the most recently modified file
- Extract issue number from the directory structure
- Verify the issue exists and is accessible

**Issue Data Retrieval Optimization:**
- **Cache Strategy**: Reuse existing issue.md files to avoid repeated GitHub API calls
- **Fallback Support**: Automatic GitHub API fallback if cached data unavailable
- **Speed Improvement**: 1-2 seconds faster execution by eliminating redundant API calls

**Code Quality Guidelines:**
- **Simple**: Write the simplest code that works
- **Readable**: Code should be self-documenting
- **Maintainable**: Code should be easy to modify
- **Efficient**: Code should perform well
- **Secure**: Code should handle errors gracefully

**Development Tools:**
- **Testing Frameworks**: Jest, Mocha, Vitest (JS/TS), pytest (Python), JUnit (Java)
- **Code Quality Tools**: ESLint, Prettier, SonarQube
- **Development Environment**: Cursor IDE with AI assistance, Git with feature branches

**Issue**: {issue_number or auto-detected}
**Output**: {output_path}
