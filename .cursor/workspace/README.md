# Cursor Workspace

This directory is designated for temporary verification files, test data, and intermediate files created during development workflows.

## Directory Structure

```
.cursor/workspace/
├── {issue_number}/
│   ├── verification/
│   │   ├── test-scripts/     # Test execution scripts
│   │   ├── data-files/       # Raw test data and debug files
│   │   ├── temp-files/       # Temporary analysis files
│   │   └── debug-output/     # Debug logs and output files
│   └── final-reports/        # Final reports (moved to docs/issues/{issue_number}/evidence/)
```

## File Creation Rules

### ✅ Allowed in `.cursor/workspace/`:
- Test execution scripts
- Verification data files
- Temporary analysis files
- Debug output files
- Validation scripts
- Raw test results
- Intermediate processing files
- Any other non-production files

### ❌ Prohibited in other locations:
- `docs/issues/{issue_number}/evidence/` (except for final reports)
- Project root directory
- `backend/` or `frontend/` directories
- Any other project directories

## Workflow

1. **Create files**: All verification and temporary files go in `.cursor/workspace/{issue_number}/`
2. **Process data**: Use intermediate files for analysis and processing
3. **Generate reports**: Create final, polished reports
4. **Move final reports**: Only move final reports to `docs/issues/{issue_number}/evidence/`
5. **Clean up**: Remove temporary files after completion

## Benefits

- **Clean project structure**: Keeps main directories organized
- **Clear separation**: Distinguishes between temporary and final files
- **Easy cleanup**: Simple to remove temporary files
- **Better workflow**: Standardized file organization across all commands
