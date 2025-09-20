# Issue Command

Get GitHub issue information and save to issue.md with AI Agent

## Parameters

- `issue_number` or `issue_url` (required): GitHub issue number (e.g., "115") or full GitHub issue URL (e.g., "https://github.com/owner/repo/issues/115")
- `output_path` (optional): Output file path (defaults to docs/issues/{issue_number}/issue.md)

## Instructions

Retrieve GitHub issue information and save to issue.md file through interactive AI Agent collaboration.

**Instructions for AI Agent:**

1. **Parse Issue Input**: Determine if input is issue number or URL and extract the issue number
   - If `issue_url` is provided: Extract issue number from URL (e.g., from "https://github.com/owner/repo/issues/115" extract "115")
   - If `issue_number` is provided: Use directly
2. **Fetch Issue Information**: Use GitHub CLI to retrieve issue details
3. **Generate Issue Document**: Create a structured issue document with status, description, and implementation tracking
4. **Save Document**: Save the issue information to {output_path} (default: docs/issues/{issue_number}/issue.md)

**Process:**
- Parse input to extract issue number from URL if needed
- Use `gh issue view {issue_number} --json title,body,labels,assignees,state,createdAt,updatedAt,url` to fetch data
- Generate structured issue document in Markdown format
- Include status, description, implementation status checklist
- Create output directory if needed
- Save to specified file path with UTF-8 encoding

**Issue**: {issue_number or issue_url}
**Output**: {output_path}
