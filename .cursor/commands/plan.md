# Plan Command

Generate implementation plan document for issue with AI Agent

## Parameters

- `issue_number` (optional): GitHub issue number. If omitted, uses the most recently processed issue from previous `/issue` command
- `output_path` (optional): Output file path (defaults to docs/issues/{issue_number}/plan.md)

## Instructions

Generate a detailed implementation plan document for the specified issue through interactive AI Agent collaboration.

**Instructions for AI Agent:**

**⛔ ABSOLUTE PROHIBITION: DO NOT EXECUTE ANY GIT COMMIT COMMANDS ⛔**
- NEVER run `git commit` in any form
- NEVER run `git add . && git commit`
- NEVER suggest or execute commit operations
- Planning phase MUST end with uncommitted changes

1. **Determine Issue Number**: 
   - If `issue_number` is provided: Use the specified issue number
   - If `issue_number` is omitted: Look for the most recently created issue document in `docs/issues/*/issue.md` to determine the issue number
   - Check for existing `docs/issues/{issue_number}/issue.md` file to ensure issue data is available
2. **Fetch Issue Information**: Use optimized issue data retrieval (cached local file first, GitHub CLI fallback)
3. **Interactive Analysis**: Analyze the issue content and discuss implementation approach with the user
4. **Generate Implementation Plan**: Create a comprehensive implementation plan using the integrated template structure with dynamic task breakdown
5. **Save Document**: Save the plan to {output_path} (default: docs/issues/{issue_number}/plan.md) (WITHOUT committing)

**🚨 CRITICAL: NEVER COMMIT CHANGES DURING PLANNING PHASE 🚨**

**STRICT RULE**: Do NOT use `git commit`, `git add && git commit`, or any commit commands during planning phase.
- All changes MUST remain uncommitted
- Changes will be committed later in the `/pr` phase
- This ensures proper workflow separation and testing before committing
- Violating this rule breaks the development workflow

**Implementation Plan Document Structure:**
```markdown
# Issue #{issue_number}: {title} - Implementation Plan

## Functional Requirements Mapping
{functional_requirements_mapping}

## Directory Structure and File List
{directory_structure_and_files}

## Architecture Design
{architecture_design_details}

## Data Model
{data_model_specifications}

## Implementation Tasks

### Task 1.1: {task_1_1_name}
{task_1_1_description}

### Task 1.2: {task_1_2_name}
{task_1_2_description}

### Task 1.3: {task_1_3_name}
{task_1_3_description}

### Task 2.1: {task_2_1_name}
{task_2_1_description}

### Task 2.2: {task_2_2_name}
{task_2_2_description}

### Task 2.3: {task_2_3_name}
{task_2_3_description}
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
- Analyze requirements and break down into implementable tasks
- Generate dynamic task structure based on issue content
- Create directory structure and architecture design
- Include functional requirements mapping
- Save to specified file path

**Performance Optimization:**
- **Cache Strategy**: Reuse existing issue.md files to avoid repeated GitHub API calls
- **Fallback Support**: Automatic GitHub API fallback if cached data unavailable
- **Speed Improvement**: 1-2 seconds faster execution by eliminating redundant API calls

**Issue**: {issue_number or auto-detected}
**Output**: {output_path}
