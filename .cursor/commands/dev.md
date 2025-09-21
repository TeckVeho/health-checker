# Dev Command

Develop code using flexible development methodology with AI Agent

## Purpose (Goal)
- Implement requested functionality based on issue requirements
- Record development process, logs, and decisions
- Ensure changes remain uncommitted for testing and review phases

## Parameters
- `issue_number` (optional): Issue number. If omitted, uses the most recently processed issue from previous `/issue` command
- `output_path` (optional): Output directory path (defaults to current directory)

## Workflow Position
- This command should be run **after `/issue` (issue creation)** and **before `/test` (validation)**

## Critical Rules
**⛔ ABSOLUTE PROHIBITION: DO NOT EXECUTE ANY GIT COMMIT COMMANDS ⛔**
- NEVER run `git commit` in any form
- NEVER run `git add . && git commit`
- NEVER suggest or execute commit operations
- Development phase MUST end with uncommitted changes

---

## Instructions for AI Agent

1. **Determine Issue Number**
   - If `issue_number` is provided: Use the specified issue number
   - If omitted: Look for the most recently created issue document in `docs/issues/*/issue.md`
   - Verify that `docs/issues/{issue_number}/issue.md` exists

2. **Choose Development Approach**
   - TDD (Test-Driven Development) or Direct Implementation
   - Decide based on complexity and testability of functionality

3. **Interactive Development Process**
   - Guide the user through the chosen approach
   - Provide implementation support with explanations

4. **Code Implementation**
   - Assist in implementing required functionality
   - Ensure code quality, readability, and maintainability

5. **Validation**
   - Guide user through manual or automated validation
   - Do NOT commit during validation

6. **Refactoring**
   - Suggest and apply improvements
   - Maintain working functionality

7. **Final Check**
   - Confirm all changes remain uncommitted
   - Record development details in `docs/issues/{issue_number}/dev.md`

---

## Development Workflow Phases

### Phase 1: Requirements Analysis
- Analyze issue requirements
- Choose development approach
- Clarify functionality and strategy

### Phase 2: Implementation
- **TDD**: Write tests first, then minimal code
- **Direct**: Implement functionality directly
- Focus on correctness and clarity

### Phase 3: Validation
- Run tests (if TDD) or manual checks (if direct)
- Verify expected behavior

### Phase 4: Refactoring
- Clean up code
- Improve readability and maintainability
- Ensure functionality remains intact

---

## 🔒 Development Output Requirements 🔒
- All changes MUST remain uncommitted
- Development log must be saved at:
  - `docs/issues/{issue_number}/dev.md`

---

## Code Quality Guidelines
- **Simple**: Implement simplest working solution
- **Readable**: Code should be self-explanatory
- **Maintainable**: Easy to extend or modify
- **Efficient**: Performant enough for context
- **Secure**: Handle errors gracefully

---

**Issue**: {issue_number or auto-detected}  
**Output**: `docs/issues/{issue_number}/dev.md`
