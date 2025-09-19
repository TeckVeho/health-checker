# Development Template - Flexible Development Workflow

## Development Approach Overview

The development process can follow different approaches based on the type of work:

### Test-Driven Development (TDD) - When Applicable
For code that benefits from testing (business logic, algorithms, APIs):
1. **Red**: Write a failing test
2. **Green**: Write minimal code to make the test pass
3. **Refactor**: Improve the code while keeping tests green

### Direct Implementation - When Testing is Not Suitable
For configuration, commands, scripts, or simple implementations:
1. **Analyze**: Understand requirements
2. **Implement**: Write the implementation directly
3. **Validate**: Test manually or through integration
4. **Refactor**: Improve code quality

## Development Workflow

### Approach Selection
First, determine the appropriate development approach:

**Use TDD when:**
- Implementing business logic
- Creating algorithms or data processing
- Building APIs or services
- Complex functionality with multiple edge cases

**Use Direct Implementation when:**
- Creating configuration files
- Implementing simple commands or scripts
- Setting up infrastructure or deployment
- Simple CRUD operations
- Frontend UI components (manual testing preferred)

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


## Interactive Development Process

### Step 1: Requirements Analysis
- Analyze the issue requirements
- Identify key functionality to implement
- Choose appropriate development approach (TDD or Direct)

### Step 2: Approach-Specific Implementation
**For TDD Approach:**
- Design test cases for each requirement
- Consider edge cases and error conditions
- Write test files and set up test framework
- Implement test cases

**For Direct Approach:**
- Plan implementation structure
- Identify dependencies and tools needed
- Design the solution architecture

### Step 3: Code Implementation
**For TDD Approach:**
- Write minimal code to pass tests
- Focus on functionality first
- Iterate through red-green cycles

**For Direct Approach:**
- Implement functionality directly
- Focus on working solution
- Test manually as you go

### Step 4: Validation
**For TDD Approach:**
- Run test suite
- Analyze test results
- Fix failing tests

**For Direct Approach:**
- Manual testing
- Integration testing
- User acceptance testing

### Step 5: Refactoring
- Improve code quality
- Optimize performance
- Enhance readability


## Test Categories

### Unit Tests
- Test individual functions/methods
- Mock external dependencies
- Focus on isolated functionality

### Integration Tests
- Test component interactions
- Use real dependencies where appropriate
- Focus on system behavior

### End-to-End Tests
- Test complete user workflows
- Use real data and environments
- Focus on user experience

## Code Quality Guidelines

### Test Quality
- **Clear**: Tests should be easy to understand
- **Independent**: Tests should not depend on each other
- **Repeatable**: Tests should produce consistent results
- **Fast**: Tests should run quickly
- **Specific**: Tests should test one thing at a time

### Implementation Quality
- **Simple**: Write the simplest code that works
- **Readable**: Code should be self-documenting
- **Maintainable**: Code should be easy to modify
- **Efficient**: Code should perform well
- **Secure**: Code should handle errors gracefully

## Development Tools

### Testing Frameworks
- **JavaScript/TypeScript**: Jest, Mocha, Vitest
- **Python**: pytest, unittest
- **Java**: JUnit, TestNG
- **C#**: NUnit, xUnit

### Code Quality Tools
- **Linting**: ESLint, Pylint, SonarQube
- **Formatting**: Prettier, Black, gofmt
- **Coverage**: Istanbul, Coverage.py, JaCoCo

### Development Environment
- **IDE**: Cursor IDE with AI assistance
- **Version Control**: Git with feature branches
- **CI/CD**: Automated testing and deployment

## Success Criteria

### Test Coverage
- [ ] Unit test coverage > 80%
- [ ] Integration test coverage > 70%
- [ ] Critical path test coverage > 90%

### Code Quality
- [ ] All linting rules pass
- [ ] Code follows style guidelines
- [ ] Performance requirements met
- [ ] Security vulnerabilities addressed


## Interactive Commands

### Test Commands
- `npm test` - Run test suite
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Generate coverage report

### Development Commands
- `npm run dev` - Start development server
- `npm run build` - Build production version
- `npm run lint` - Run linting

### Quality Commands
- `npm run format` - Format code
- `npm run type-check` - Type checking
- `npm run security` - Security audit
