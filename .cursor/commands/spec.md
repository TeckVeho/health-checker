# Spec Command

Generate specification document for issue with AI Agent

## Parameters
- `issue_number` (optional): GitHub issue number. If omitted, uses the most recently processed issue from previous `/issue` command

## Instructions

Generate a detailed specification document for the specified issue through interactive AI Agent collaboration.

**Instructions for AI Agent:**

**⛔ ABSOLUTE PROHIBITION: DO NOT EXECUTE ANY GIT COMMIT COMMANDS ⛔**
- NEVER run `git commit` in any form
- NEVER run `git add . && git commit`
- NEVER suggest or execute commit operations
- Specification phase MUST end with uncommitted changes

1. **Determine Issue Number**: 
   - If `issue_number` is provided: Use the specified issue number
   - If `issue_number` is omitted: Look for the most recently created issue document in `docs/issues/*/issue.md` to determine the issue number
   - Check for existing `docs/issues/{issue_number}/issue.md` file to ensure issue data is available
2. **Fetch Issue Information**: Use optimized issue data retrieval (cached local file first, GitHub CLI fallback)
3. **Interactive Analysis**: Analyze the issue content and discuss requirements with the user
4. **Generate Specification**: Create a comprehensive specification document using the integrated template structure
5. **Save Document**: Save the specification to {output_path} (default: docs/issues/{issue_number}/spec.md) (WITHOUT committing)

**🚨 CRITICAL: NEVER COMMIT CHANGES DURING SPECIFICATION PHASE 🚨**

**STRICT RULE**: Do NOT use `git commit`, `git add && git commit`, or any commit commands during specification phase.
- All changes MUST remain uncommitted
- Changes will be committed later in the `/pr` phase
- This ensures proper workflow separation and testing before committing
- Violating this rule breaks the development workflow

**Specification Document Structure:**
```markdown
# Issue #{issue_number}: {title}

## Overview
{overview_description}

## Purpose
{purpose_and_goals}

## Functional Requirements
{detailed_functional_requirements}

## Specification

### Features
{functionality_description}

### System Requirements

#### Required External Tools
{required_tools_and_dependencies}

#### Operating Environment
{environment_specifications}

#### Quality Requirements
{quality_and_performance_requirements}

## Success Criteria

### Functional Criteria
{functional_success_criteria}

### Non-Functional Criteria
{non_functional_success_criteria}

## References
{related_links_and_resources}
```

**Auto-Detection Process:**
- Search `docs/issues/*/issue.md` files for the most recently modified file
- Extract issue number from the directory structure
- Verify the issue exists and is accessible via GitHub CLI

**Content Generation Process:**
- Determine issue number (from parameter or most recent `/issue` command)
- Retrieve issue data using optimized caching strategy:
  - First: Try cached `docs/issues/{issue_number}/issue.md` file
  - Fallback: GitHub CLI if cached file not available
- Analyze issue requirements and generate appropriate content for each section
- Generate structured specification in English
- Create output directory if needed
- Save to specified file path

**Performance Optimization:**
- **Cache Strategy**: Reuse existing issue.md files to avoid repeated GitHub API calls
- **Fallback Support**: Automatic GitHub API fallback if cached data unavailable
- **Speed Improvement**: 1-2 seconds faster execution by eliminating redundant API calls

**Issue**: {issue_number or auto-detected}
**Output**: {output_path}
