# Test Template - Comprehensive Testing Guidelines

## Test Execution Overview

The `/test` command provides comprehensive testing capabilities with evidence collection and reporting.

## Test Types and Frameworks

### Backend Testing (Node.js/TypeScript)
- **Unit Tests**: Jest framework
- **Integration Tests**: Jest with test database
- **Feature Tests**: Cucumber/Gherkin
- **Commands**: 
  - `npm run test:unit` - Unit tests
  - `npm run test:feature` - Feature tests
  - `npm test` - All tests

### Frontend Testing (Vue.js/Nuxt)
- **Unit Tests**: Vitest framework
- **Component Tests**: Vitest with Vue Test Utils
- **E2E Tests**: Playwright (if configured)
- **Commands**:
  - `npm run test` - Interactive test mode
  - `npm run test:run` - Run tests once
  - `npm run test:coverage` - Generate coverage report
  - `npm run test:ui` - Visual test interface

### Other Frameworks
- **Python**: `pytest`, `python -m unittest`
- **Java**: `mvn test`, `gradle test`
- **C#**: `dotnet test`
- **Go**: `go test`

## Test Execution Process

### Step 1: Project Analysis
- **Objective**: Identify test framework and structure
- **Process**: 
  - Scan for package.json, requirements.txt, pom.xml, etc.
  - Identify test directories (tests/, __tests__/, spec/)
  - Detect test configuration files (jest.config.js, vitest.config.ts, etc.)

### Step 2: Test Command Selection
- **Backend**: `npm run test:unit && npm run test:feature`
- **Frontend**: `npm run test:run && npm run test:coverage`
- **Full Project**: Run both backend and frontend tests
- **Custom**: Detect and run project-specific test commands

### Step 3: Test Execution
- **Environment**: Set appropriate NODE_ENV, test database, etc.
- **Output Capture**: Capture stdout, stderr, and exit codes
- **Timeout Handling**: Set appropriate timeouts for long-running tests
- **Error Handling**: Capture and report test failures

### Step 4: Evidence Collection
- **Test Results**: JSON format with pass/fail status
- **Coverage Reports**: HTML and JSON coverage files
- **Screenshots**: For E2E tests (if applicable)
- **Logs**: Console output and error logs
- **Artifacts**: Generated files, database dumps, etc.

## Evidence Collection

### Test Results (test-results.json)
```json
{
  "timestamp": "2025-01-XX",
  "project": "health-checker",
  "framework": "jest",
  "totalTests": 25,
  "passed": 23,
  "failed": 2,
  "skipped": 0,
  "duration": "2.5s",
  "coverage": {
    "statements": 85.2,
    "branches": 78.9,
    "functions": 92.1,
    "lines": 84.7
  },
  "failures": [
    {
      "test": "should validate user input",
      "file": "src/utils/validation.test.ts",
      "error": "Expected 'valid' but received 'invalid'"
    }
  ]
}
```

### Test Report (test-report.md)
```markdown
# Test Execution Report

## Summary
- **Date**: 2025-01-XX
- **Project**: health-checker
- **Framework**: Jest
- **Total Tests**: 25
- **Passed**: 23 (92%)
- **Failed**: 2 (8%)
- **Duration**: 2.5s

## Coverage
- **Statements**: 85.2%
- **Branches**: 78.9%
- **Functions**: 92.1%
- **Lines**: 84.7%

## Failed Tests
1. **should validate user input** (src/utils/validation.test.ts)
   - Error: Expected 'valid' but received 'invalid'

## Recommendations
- Fix validation logic in utils/validation.ts
- Add more edge case tests
- Improve branch coverage for error handling
```

### Evidence Files
- **Screenshots**: `docs/issues/{issue_number}/evidence/screenshots/` (for E2E tests)
- **Logs**: `docs/issues/{issue_number}/evidence/logs/test-execution.log`
- **Coverage**: `docs/issues/{issue_number}/evidence/coverage/` (HTML reports)
- **Artifacts**: `docs/issues/{issue_number}/evidence/artifacts/` (generated files)

## Output Directory Structure

```
docs/issues/{issue_number}/evidence/
├── test-results.json          # Machine-readable test results
├── test-report.md             # Human-readable test report
├── screenshots/               # E2E test screenshots
├── logs/                      # Test execution logs
├── coverage/                  # Coverage reports
├── artifacts/                 # Generated test artifacts
└── summary/
    ├── test-summary.txt       # Quick summary
    └── recommendations.md     # Improvement recommendations
```

**Evidence Storage Location**: All test evidence is saved to `docs/issues/{issue_number}/evidence/` directory structure.

## Test Commands by Project Type

### Node.js/TypeScript Projects
```bash
# Backend
npm run test:unit
npm run test:feature
npm run test:coverage

# Frontend
npm run test:run
npm run test:coverage
npm run test:ui
```

### Python Projects
```bash
pytest --cov=src --cov-report=html
python -m unittest discover
```

### Java Projects
```bash
mvn test
mvn jacoco:report
gradle test
gradle jacocoTestReport
```

### C# Projects
```bash
dotnet test
dotnet test --collect:"XPlat Code Coverage"
```

## Error Handling

### Test Failures
- **Capture**: Full error messages and stack traces
- **Categorize**: Unit test failures, integration failures, setup failures
- **Report**: Clear failure descriptions with file locations
- **Suggest**: Potential fixes and debugging steps

### Environment Issues
- **Dependencies**: Check for missing packages
- **Configuration**: Validate test configuration files
- **Database**: Ensure test database is available
- **Services**: Check for required external services

### Timeout Handling
- **Unit Tests**: 30 seconds per test
- **Integration Tests**: 2 minutes per test
- **E2E Tests**: 5 minutes per test
- **Full Suite**: 10 minutes maximum

## Quality Metrics

### Coverage Thresholds
- **Statements**: Minimum 80%
- **Branches**: Minimum 75%
- **Functions**: Minimum 85%
- **Lines**: Minimum 80%

### Performance Benchmarks
- **Unit Tests**: < 100ms per test
- **Integration Tests**: < 1s per test
- **E2E Tests**: < 10s per test
- **Full Suite**: < 5 minutes

### Success Criteria
- [ ] All tests pass
- [ ] Coverage meets thresholds
- [ ] No critical test failures
- [ ] Performance within benchmarks
- [ ] Evidence properly collected

## Integration with CI/CD

### GitHub Actions
```yaml
- name: Run Tests
  run: |
    npm run test:unit
    npm run test:coverage
    
- name: Upload Test Results
  uses: actions/upload-artifact@v3
  with:
    name: test-results
    path: test-output/
```

### Jenkins
```groovy
stage('Test') {
    steps {
        sh 'npm run test:run'
        publishHTML([
            allowMissing: false,
            alwaysLinkToLastBuild: true,
            keepAll: true,
            reportDir: 'test-output/evidence/coverage',
            reportFiles: 'index.html',
            reportName: 'Coverage Report'
        ])
    }
}
```

## Best Practices

### Test Organization
- **Structure**: Mirror source code structure
- **Naming**: Descriptive test names
- **Grouping**: Related tests in describe blocks
- **Isolation**: Tests should not depend on each other

### Evidence Management
- **Storage**: Version-controlled evidence directory at `docs/issues/{issue_number}/evidence/`
- **Retention**: Keep evidence for last 10 test runs
- **Cleanup**: Remove old evidence automatically
- **Backup**: Archive evidence for releases

### Reporting
- **Format**: Both JSON and Markdown formats
- **Detail**: Include failure details and stack traces
- **Trends**: Track test metrics over time
- **Alerts**: Notify on test failures or coverage drops
