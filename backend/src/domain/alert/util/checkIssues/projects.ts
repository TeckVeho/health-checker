/**
 * GitHub Projects V2 integration for fetching project field values and membership
 */
import { executeGraphQL } from './github';
import { ProjectItemFieldValue, CREATED_SINCE, CREATED_SINCE_ISO } from './types';
import { octokit } from './github';

/**
 * Get all project field values for the specified issues
 */
export async function getAllProjectFieldValues(
  owner: string,
  repo: string,
  issueNumbers: number[]
): Promise<Map<number, ProjectItemFieldValue>> {
  const fieldValues = new Map<number, ProjectItemFieldValue>();

  try {
    console.log('  Loading project field values using GraphQL for each issue...');

    // Query to get project items and field values for each issue
    const issueProjectQuery = `
      query($owner: String!, $repo: String!, $issueNumber: Int!) {
        repository(owner: $owner, name: $repo) {
          issue(number: $issueNumber) {
            projectItems(first: 10) {
              nodes {
                project {
                  ... on ProjectV2 {
                    id
                    title
                  }
                }
                fieldValues(first: 50) {
                  nodes {
                    ... on ProjectV2ItemFieldTextValue {
                      field { ... on ProjectV2Field { name } }
                      text
                    }
                    ... on ProjectV2ItemFieldNumberValue {
                      field { ... on ProjectV2Field { name } }
                      number
                    }
                    ... on ProjectV2ItemFieldSingleSelectValue {
                      field { ... on ProjectV2SingleSelectField { name } }
                      name
                      optionId
                    }
                    ... on ProjectV2ItemFieldDateValue {
                      field { ... on ProjectV2Field { name } }
                      date
                    }
                  }
                }
              }
            }
          }
        }
      }
    `;

    // Process each issue individually to get its project field values
    for (const issueNumber of issueNumbers) {
      try {
        const response: any = await executeGraphQL(issueProjectQuery, {
          owner,
          repo,
          issueNumber,
        });

        const projectItems = response?.repository?.issue?.projectItems?.nodes || [];
        
        if (projectItems.length > 0) {
          const itemFieldValues: ProjectItemFieldValue = {};
          
          // Process field values from the first project item (usually there's only one)
          for (const item of projectItems) {
            if (item.fieldValues && item.fieldValues.nodes) {
              for (const fieldValue of item.fieldValues.nodes) {
                if (fieldValue.field && fieldValue.field.name) {
                  const fieldName = String(fieldValue.field.name).toLowerCase();

                  // Handle SP field (can be Number, Text, or Single Select)
                  if (fieldName === 'sp' && itemFieldValues.sp === undefined) {
                    if (fieldValue.number !== undefined) {
                      // Number field
                      itemFieldValues.sp = fieldValue.number;
                    } else if (fieldValue.name !== undefined) {
                      // Single Select field - try to parse number from the option name
                      const spMatch = fieldValue.name.match(/(\d+)/);
                      if (spMatch) {
                        itemFieldValues.sp = parseInt(spMatch[1], 10);
                      }
                    } else if (fieldValue.text) {
                      // Text field - try to parse number from text
                      const spMatch = fieldValue.text.match(/(\d+)/);
                      if (spMatch) {
                        itemFieldValues.sp = parseInt(spMatch[1], 10);
                      }
                    }
                  } else if (
                    (fieldName === 'end date' ||
                      fieldName === 'end_date' ||
                      fieldName === 'due date' ||
                      fieldName === 'deadline') &&
                    fieldValue.date &&
                    itemFieldValues.endDate === undefined
                  ) {
                    itemFieldValues.endDate = new Date(fieldValue.date);
                  }
                }
              }
            }
          }
          
          // Only add if we found values
          if (itemFieldValues.sp !== undefined || itemFieldValues.endDate !== undefined) {
            fieldValues.set(issueNumber, itemFieldValues);
            console.log(`    Issue #${issueNumber}: SP=${itemFieldValues.sp}, EndDate=${itemFieldValues.endDate ? itemFieldValues.endDate.toISOString().split('T')[0] : 'none'}`);
          }
        }
      } catch {
        console.log(`    Error fetching project data for issue #${issueNumber}`);
      }
    }

    console.log(`  Found field values for ${fieldValues.size} issues from projects V2`);
  } catch (error) {
    console.error(`? Error loading project field values for ${owner}/${repo}:`, error);
    console.log('?? Project field value check will be skipped due to API limitations');
  }

  return fieldValues;
}

/**
 * Get all issues that are associated with projects (filtered by creation date)
 */
export async function getAllProjectIssues(owner: string, repo: string): Promise<Set<number>> {
  const allIssues = new Set<number>();

  try {
    console.log('  Checking project association for filtered issues...');
    
    // Get all open issues to check for project association
    const allItems = await octokit.paginate(octokit.issues.listForRepo, {
      owner,
      repo,
      state: 'open',
      // eslint-disable-next-line @typescript-eslint/naming-convention
      per_page: 100,
    });

    // Filter to actual issues (not PRs) and createdAt >= threshold
    const issuesOnly = allItems.filter((item: any) => !item.pull_request);
    const filteredIssues = issuesOnly.filter((item: any) => {
      const createdAtStr: string | undefined = item.created_at;
      if (!createdAtStr) return false;
      const createdAt = new Date(createdAtStr);
      return createdAt >= CREATED_SINCE;
    });

    // Query to check if an issue is in a project
    const issueProjectCheckQuery = `
      query($owner: String!, $repo: String!, $issueNumber: Int!) {
        repository(owner: $owner, name: $repo) {
          issue(number: $issueNumber) {
            projectItems(first: 1) {
              nodes {
                id
              }
            }
          }
        }
      }
    `;

    // Check each issue for project association
    for (const issue of filteredIssues) {
      try {
        const response: any = await executeGraphQL(issueProjectCheckQuery, {
          owner,
          repo,
          issueNumber: issue.number,
        });

        const projectItems = response?.repository?.issue?.projectItems?.nodes || [];
        if (projectItems.length > 0) {
          allIssues.add(issue.number);
        }
      } catch {
        // Silently skip if we can't check this issue
      }
    }

    console.log(
      `  Found ${allIssues.size} issues in projects (createdAt >= ${CREATED_SINCE_ISO})`
    );
  } catch (error) {
    console.error(`? Error loading project issues for ${owner}/${repo}:`, error);
    console.log('?? Project check will be skipped due to API limitations');
  }

  return allIssues;
}