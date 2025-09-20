# Dev Command

Develop code using flexible development methodology with AI Agent

## Parameters

- `issue_number` (optional): Issue number. If omitted, uses the most recently processed issue from previous `/issue` command
- `output_path` (optional): Output directory path (defaults to current directory)

## Instructions

Develop code using flexible development methodology through interactive AI Agent collaboration.

**Instructions for AI Agent:**

1. **Determine Issue Number**: 
   - If `issue_number` is provided: Use the specified issue number
   - If `issue_number` is omitted: Look for the most recently created issue document in `docs/issues/*/issue.md` to determine the issue number
   - Check for existing `docs/issues/{issue_number}/issue.md` file to ensure issue data is available
2. **Choose Development Approach**: Determine if TDD or Direct Implementation is appropriate based on integrated development methodology
3. **Interactive Development Process**: Guide the user through the chosen approach
4. **Code Implementation**: Assist with implementation based on the chosen approach
5. **Validation**: Guide through testing and validation
6. **Refactoring**: Help improve code quality while maintaining functionality

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

**Auto-Detection Process:**
- Search `docs/issues/*/issue.md` files for the most recently modified file
- Extract issue number from the directory structure
- Verify the issue exists and is accessible

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
