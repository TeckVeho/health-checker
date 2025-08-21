import { Octokit } from '@octokit/rest';
import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';

const githubToken = process.env.GITHUB_API_KEY;
if (!githubToken && process.env.NODE_ENV !== 'test') throw new Error('GITHUB_API_KEY is required');

// OpenAI API key will be automatically read from OPENAI_API_KEY environment variable

const octokit = new Octokit({ auth: githubToken || 'test-token' });

/**
 * Created-at lower bound (inclusive)
 * Target: Issues created on or after 2025-08-17T00:00:00Z
 */
const CREATED_SINCE_ISO = '2025-08-17T00:00:00Z';
const CREATED_SINCE = new Date(CREATED_SINCE_ISO);

export interface IssueAlertCandidate {
  owner: string;
  repo: string;
  checkType: string;
  title: string;
  description: string;
  severity: string;
  filePath: string;
  lineNumber: number;
  codeSnippet: string;
  branch: string;
  issueUrl: string;
}

export interface CheckIssuesResult {
  owner: string;
  repo: string;
  alerts: IssueAlertCandidate[];
}

// Interface for project item field values
interface ProjectItemFieldValue {
  sp?: number;
  endDate?: Date;
}

export async function checkIssues(owner: string, repo: string): Promise<CheckIssuesResult> {
  const alerts: IssueAlertCandidate[] = [];
  const filePath = '';
  const lineNumber = -1;
  const codeSnippet = '';
  const branch = '';

  // Note: This function only processes actual GitHub Issues, not Pull Requests.
  // GitHub's issues.listForRepo API returns both issues and PRs, so we filter out PRs
  // to ensure we only generate alerts for genuine issues.

  try {
    // Get all open issues with pagination
    const allItems = await octokit.paginate(octokit.issues.listForRepo, {
      owner,
      repo,
      state: 'open',
      per_page: 100,
    });

    // Filter out pull requests - only keep actual issues
    const issuesOnly = allItems.filter((item: any) => !item.pull_request);

    // Filter by created_at >= 2025-08-17T00:00:00Z
    const issues = issuesOnly.filter((item: any) => {
      const createdAtStr: string | undefined = item.created_at;
      if (!createdAtStr) return false;
      const createdAt = new Date(createdAtStr);
      return createdAt >= CREATED_SINCE;
    });

    console.log(`📋 Found ${allItems.length} open items (issues + PRs) for ${owner}/${repo}`);
    console.log(`📋 Filtered to ${issuesOnly.length} actual issues (excluded ${allItems.length - issuesOnly.length} PRs)`);
    console.log(`📅 After created_at filter (>= ${CREATED_SINCE_ISO}): ${issues.length} issues remain`);

    // Pre-load all project data once for performance optimization
    console.log('📊 Pre-loading project data (createdAt-filtered)...');
    const allProjectIssues = await getAllProjectIssues(owner, repo);
    console.log(`📊 Found ${allProjectIssues.size} issues in projects (createdAt-filtered)`);

    // Pre-load project field values for filtered issues only
    console.log('📊 Pre-loading project field values for filtered issues...');
    const projectFieldValues = await getAllProjectFieldValues(
      owner,
      repo,
      issues.map((issue: any) => issue.number)
    );
    console.log(`📊 Loaded field values for ${projectFieldValues.size} issues`);

    for (let i = 0; i < issues.length; i++) {
      const issue: any = issues[i];

      // Double-check: ensure this is actually an issue, not a PR
      if (issue.pull_request) {
        console.log(`⚠️ Skipping PR #${issue.number} - this should not happen after filtering`);
        continue;
      }

      console.log(`🔍 Processing issue #${issue.number} (${i + 1}/${issues.length})`);

      // Get field values from projects (priority) and body (fallback)
      const projectValues = projectFieldValues.get(issue.number) || {};
      const bodyStoryPoints = extractStoryPoints(issue.body || '');
      const bodyEndDate = extractEndDate(issue.body || '');

      // Use project values if available, otherwise fallback to body
      const storyPoints = projectValues.sp !== undefined ? projectValues.sp : bodyStoryPoints;
      const endDate = projectValues.endDate !== undefined ? projectValues.endDate : bodyEndDate;

      // Check Story Point (SP)
      if (storyPoints === null) {
        // Issue missing Story Point
        alerts.push({
          owner,
          repo,
          checkType: 'issue_missing_sp',
          title: `issue:${issue.number}`,
          description: `Issue #${issue.number} has no Story Point assigned.`,
          severity: 'low',
          filePath,
          lineNumber,
          codeSnippet,
          branch,
          issueUrl: issue.html_url,
        });
      } else if (storyPoints > 8) {
        // SP greater than 8 (possibly overestimated)
        alerts.push({
          owner,
          repo,
          checkType: 'issue_large_sp',
          title: `issue:${issue.number}`,
          description: `Issue #${issue.number} has Story Point ${storyPoints} which is greater than 8 (possibly overestimated).`,
          severity: 'low',
          filePath,
          lineNumber,
          codeSnippet,
          branch,
          issueUrl: issue.html_url,
        });
      }

      // Check End Date
      if (endDate === null) {
        // Issue missing End Date
        alerts.push({
          owner,
          repo,
          checkType: 'issue_missing_end_date',
          title: `issue:${issue.number}`,
          description: `Issue #${issue.number} has no End Date assigned.`,
          severity: 'low',
          filePath,
          lineNumber,
          codeSnippet,
          branch,
          issueUrl: issue.html_url,
        });
      } else if (endDate < new Date(Date.now() - 24 * 60 * 60 * 1000)) {
        // End Date expired (before yesterday)
        alerts.push({
          owner,
          repo,
          checkType: 'issue_expired_end_date',
          title: `issue:${issue.number}`,
          description: `Issue #${issue.number} has expired End Date: ${endDate.toISOString().split('T')[0]}.`,
          severity: 'middle',
          filePath,
          lineNumber,
          codeSnippet,
          branch,
          issueUrl: issue.html_url,
        });
      }

      // Check Project (using pre-loaded data)
      const isInProject = allProjectIssues.has(issue.number);

      if (!isInProject) {
        // Issue not linked to GitHub Project
        alerts.push({
          owner,
          repo,
          checkType: 'issue_not_in_project',
          title: `issue:${issue.number}`,
          description: `Issue #${issue.number} is not linked to any GitHub Project.`,
          severity: 'middle',
          filePath,
          lineNumber,
          codeSnippet,
          branch,
          issueUrl: issue.html_url,
        });
      }

      // Check for template-only issue body
      const templateOnlyResult = await detectTemplateOnlyIssue(issue.title, issue.body || '');
      if (templateOnlyResult.result) {
        alerts.push({
          owner,
          repo,
          checkType: 'issue_template_only',
          title: `issue:${issue.number}`,
          description: `Issue #${issue.number} appears to have template-only content in the body. ${templateOnlyResult.reason}`,
          severity: 'high',
          filePath,
          lineNumber,
          codeSnippet,
          branch,
          issueUrl: issue.html_url,
        });
      }

      // Check for unclear instructions
      const unclearInstructionsResult = await detectUnclearInstructions(issue.title, issue.body || '');
      if (unclearInstructionsResult.result) {
        alerts.push({
          owner,
          repo,
          checkType: 'issue_unclear_instruction',
          title: `issue:${issue.number}`,
          description: `Issue #${issue.number} lacks clear instructions on what needs to be done. ${unclearInstructionsResult.reason}`,
          severity: 'middle',
          filePath,
          lineNumber,
          codeSnippet,
          branch,
          issueUrl: issue.html_url,
        });
      }
    }

    console.log(`🚨 Found ${alerts.length} issue alerts for ${owner}/${repo}`);
  } catch (error) {
    console.error(`❌ Error checking issues for ${owner}/${repo}:`, error);
  }

  return { owner, repo, alerts };
}

// Function to get all project field values for issues
async function getAllProjectFieldValues(
  owner: string,
  repo: string,
  issueNumbers: number[]
): Promise<Map<number, ProjectItemFieldValue>> {
  const fieldValues = new Map<number, ProjectItemFieldValue>();
  const issueSet = new Set(issueNumbers);

  try {
    console.log('📊 Loading project field values using GraphQL (restricted to filtered issues)...');

    // Query to get projects V2 with pagination
    const projectsQuery = `
      query($owner: String!, $repo: String!, $after: String) {
        repository(owner: $owner, name: $repo) {
          projectsV2(first: 10, after: $after) {
            pageInfo {
              hasNextPage
              endCursor
            }
            nodes {
              id
              number
              title
              fields(first: 100) {
                nodes {
                  ... on ProjectV2Field {
                    id
                    name
                    dataType
                  }
                }
              }
            }
          }
        }
      }
    `;

    // Query to get items of a project V2 with field values
    const itemsQuery = `
      query($projectId: ID!, $after: String) {
        node(id: $projectId) {
          ... on ProjectV2 {
            items(first: 100, after: $after) {
              pageInfo {
                hasNextPage
                endCursor
              }
              nodes {
                content {
                  ... on Issue {
                    number
                    createdAt
                  }
                }
                fieldValues(first: 100) {
                  nodes {
                    ... on ProjectV2ItemFieldTextValue {
                      field { ... on ProjectV2Field { name } }
                      text
                    }
                    ... on ProjectV2ItemFieldNumberValue {
                      field { ... on ProjectV2Field { name } }
                      number
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

    // Step 1: Get all projects V2 with pagination
    let projectsAfter: string | null = null;
    let hasMoreProjects = true;

    while (hasMoreProjects) {
      const projectsResponse: any = await octokit.graphql(projectsQuery, {
        owner,
        repo,
        after: projectsAfter,
      });

      const repository: any = projectsResponse.repository;
      if (!repository || !repository.projectsV2) {
        break;
      }

      const projects = repository.projectsV2.nodes || [];
      console.log(`📊 Processing ${projects.length} projects V2 for field values...`);

      // Step 2: For each project V2, get all items with field values
      for (const project of projects) {
        console.log(`📊 Project V2 ${project.title}: loading items with field values...`);

        let itemsAfter: string | null = null;
        let hasMoreItems = true;

        while (hasMoreItems) {
          const itemsResponse: any = await octokit.graphql(itemsQuery, {
            projectId: project.id,
            after: itemsAfter,
          });

          const projectNode: any = itemsResponse.node;
          if (!projectNode || !projectNode.items) {
            break;
          }

          const items = projectNode.items.nodes || [];
          console.log(`📊 Project V2 ${project.title}: ${items.length} items with field values`);

          // Process field values for each item (limit to target issue numbers and createdAt >= threshold)
          for (const item of items) {
            if (item.content && item.content.number) {
              const issueNumber: number = item.content.number;
              const createdAtStr: string | undefined = item.content.createdAt;
              const createdAt = createdAtStr ? new Date(createdAtStr) : null;

              // Only process if this issue is in the filtered set and meets date condition
              if (!issueSet.has(issueNumber)) continue;
              if (!createdAt || createdAt < CREATED_SINCE) continue;

              const itemFieldValues: ProjectItemFieldValue = {};

              // Process field values
              if (item.fieldValues && item.fieldValues.nodes) {
                for (const fieldValue of item.fieldValues.nodes) {
                  if (fieldValue.field && fieldValue.field.name) {
                    const fieldName = String(fieldValue.field.name).toLowerCase();

                    if (fieldName === 'sp' && fieldValue.number !== undefined) {
                      itemFieldValues.sp = fieldValue.number;
                    } else if (
                      (fieldName === 'end date' ||
                        fieldName === 'end_date' ||
                        fieldName === 'due date' ||
                        fieldName === 'deadline') &&
                      fieldValue.date
                    ) {
                      itemFieldValues.endDate = new Date(fieldValue.date);
                    } else if (fieldName === 'sp' && fieldValue.text) {
                      // Try to parse SP from text field
                      const spMatch = fieldValue.text.match(/(\d+)/);
                      if (spMatch) {
                        itemFieldValues.sp = parseInt(spMatch[1], 10);
                      }
                    }
                  }
                }
              }

              // Only add if we found values
              if (itemFieldValues.sp !== undefined || itemFieldValues.endDate !== undefined) {
                fieldValues.set(issueNumber, itemFieldValues);
              }
            }
          }

          // Update pagination for items
          hasMoreItems = projectNode.items.pageInfo.hasNextPage;
          itemsAfter = projectNode.items.pageInfo.endCursor;
        }
      }

      // Update pagination for projects
      hasMoreProjects = repository.projectsV2.pageInfo.hasNextPage;
      projectsAfter = repository.projectsV2.pageInfo.endCursor;
    }

    console.log(`📊 Found field values for ${fieldValues.size} issues from projects V2`);
  } catch (error) {
    console.error(`❌ Error loading project field values for ${owner}/${repo}:`, error);
    console.log('⚠️ Project field value check will be skipped due to API limitations');
  }

  return fieldValues;
}

// Function to get all issues in projects with pagination (createdAt filtered)
async function getAllProjectIssues(owner: string, repo: string): Promise<Set<number>> {
  const allIssues = new Set<number>();

  try {
    console.log('📊 Loading projects V2 using GraphQL with pagination...');

    // Query to get projects V2 with pagination
    const projectsQuery = `
      query($owner: String!, $repo: String!, $after: String) {
        repository(owner: $owner, name: $repo) {
          projectsV2(first: 10, after: $after) {
            pageInfo {
              hasNextPage
              endCursor
            }
            nodes {
              id
              number
              title
            }
          }
        }
      }
    `;

    // Query to get items of a project V2 (we also fetch issue.createdAt to filter client-side)
    const itemsQuery = `
      query($projectId: ID!, $after: String) {
        node(id: $projectId) {
          ... on ProjectV2 {
            items(first: 100, after: $after) {
              pageInfo {
                hasNextPage
                endCursor
              }
              nodes {
                content {
                  ... on Issue {
                    number
                    createdAt
                  }
                }
              }
            }
          }
        }
      }
    `;

    // Step 1: Get all projects V2 with pagination
    let projectsAfter: string | null = null;
    let hasMoreProjects = true;

    while (hasMoreProjects) {
      const projectsResponse: any = await octokit.graphql(projectsQuery, {
        owner,
        repo,
        after: projectsAfter,
      });

      const repository: any = projectsResponse.repository;
      if (!repository || !repository.projectsV2) {
        break;
      }

      const projects = repository.projectsV2.nodes || [];
      console.log(`📊 Processing ${projects.length} projects V2...`);

      // Step 2: For each project V2, get all items
      for (const project of projects) {
        console.log(`📊 Project V2 ${project.title}: loading items...`);

        let itemsAfter: string | null = null;
        let hasMoreItems = true;

        while (hasMoreItems) {
          const itemsResponse: any = await octokit.graphql(itemsQuery, {
            projectId: project.id,
            after: itemsAfter,
          });

          const projectNode: any = itemsResponse.node;
          if (!projectNode || !projectNode.items) {
            break;
          }

          const items = projectNode.items.nodes || [];
          console.log(`📊 Project V2 ${project.title}: ${items.length} items`);

          // Collect issue numbers from items (createdAt >= threshold)
          for (const item of items) {
            if (item.content && item.content.number) {
              const createdAtStr: string | undefined = item.content.createdAt;
              const createdAt = createdAtStr ? new Date(createdAtStr) : null;
              if (createdAt && createdAt >= CREATED_SINCE) {
                allIssues.add(item.content.number);
              }
            }
          }

          // Update pagination for items
          hasMoreItems = projectNode.items.pageInfo.hasNextPage;
          itemsAfter = projectNode.items.pageInfo.endCursor;
        }
      }

      // Update pagination for projects
      hasMoreProjects = repository.projectsV2.pageInfo.hasNextPage;
      projectsAfter = repository.projectsV2.pageInfo.endCursor;
    }

    console.log(
      `📊 Found ${allIssues.size} issues in projects V2 (createdAt >= ${CREATED_SINCE_ISO}, with pagination)`
    );
  } catch (error) {
    console.error(`❌ Error loading project V2 issues for ${owner}/${repo}:`, error);
    console.log('⚠️ Project check will be skipped due to API limitations');
  }

  return allIssues;
}

// Function to extract Story Point from issue content
function extractStoryPoints(body: string): number | null {
  // Search for common patterns for Story Point
  const patterns = [
    /SP[:\s]*(\d+)/i,
    /Story Point[:\s]*(\d+)/i,
    /Story Points[:\s]*(\d+)/i,
    /Points[:\s]*(\d+)/i,
    /Estimate[:\s]*(\d+)/i,
  ];

  for (const pattern of patterns) {
    const match = body.match(pattern);
    if (match) {
      return parseInt(match[1], 10);
    }
  }

  return null;
}

// Function to extract End Date from issue content
function extractEndDate(body: string): Date | null {
  // Search for common patterns for End Date
  const patterns = [
    /End Date[:\s]*(\d{4}-\d{2}-\d{2})/i,
    /Due Date[:\s]*(\d{4}-\d{2}-\d{2})/i,
    /Deadline[:\s]*(\d{4}-\d{2}-\d{2})/i,
    /Target Date[:\s]*(\d{4}-\d{2}-\d{2})/i,
    /(\d{4}-\d{2}-\d{2})/g, // Find all date format YYYY-MM-DD
  ];

  for (const pattern of patterns) {
    const match = body.match(pattern);
    if (match) {
      const date = new Date(match[1]);
      if (!isNaN(date.getTime())) {
        return date;
      }
    }
  }

  return null;
}

// Function to detect if issue body appears to be template-only using LLM
async function detectTemplateOnlyIssue(title: string, body: string): Promise<{ result: boolean; reason: string }> {
  if (!body || body.trim().length === 0) {
    return {
      result: true,
      reason: 'The issue body is empty, containing no meaningful content.',
    };
  }

  try {
    const prompt = `
Please analyze this GitHub issue and determine if the body appears to be left as a template or contains only placeholder instructions.

Issue Title: ${title}
Issue Body: ${body}

Consider the following criteria:
1. The body is empty or contains only whitespace
2. The body contains only placeholder text like "Please describe the issue here"
3. The body contains template instructions that haven't been replaced
4. The body is very short and lacks meaningful content
5. The body contains generic template sections that haven't been filled out

Respond in the following JSON format:
{
  "result": false,
  "reason": "The issue body contains meaningful, non-template content with specific details."
}

- "result": true if the issue body appears to be template-only, false if it contains meaningful content
- "reason": A concise explanation of why the issue appears to be template-only or contains meaningful content
`.trim();

    const result = await generateText({
      model: openai('gpt-4o-mini'),
      prompt,
    });

    const content = result.text?.trim();
    if (!content) {
      throw new Error('Empty LLM response');
    }

    const jsonMatch = content.match(/```(?:json)?([\s\S]*?)```/);
    const raw = jsonMatch?.[1]?.trim() || content;

    const parsed = JSON.parse(raw);

    if (typeof parsed.result === 'boolean' && typeof parsed.reason === 'string') {
      return parsed;
    } else {
      throw new Error('Missing or invalid fields in LLM response');
    }
  } catch (error) {
    console.error('Error in LLM template detection:', error);
    // Fallback to heuristic-based detection
    const fallbackResult = fallbackTemplateDetection(body);
    return {
      result: fallbackResult,
      reason: fallbackResult
        ? 'Heuristic detection: The issue body appears to contain only template content or placeholders.'
        : 'Heuristic detection: The issue body appears to contain meaningful content.',
    };
  }
}

// Fallback heuristic-based template detection
function fallbackTemplateDetection(body: string): boolean {
  const normalized = body.trim().toLowerCase();

  // Check for empty or very short content
  if (normalized.length < 50) {
    return true;
  }

  // Check for description section (similar to PRCheck logic)
  const descriptionSection = normalized.match(/##\s*description\s*([\s\S]*?)(##|$)/i);
  const descriptionContent = descriptionSection?.[1]?.trim() ?? '';
  if (descriptionContent.length >= 200) {
    return false;
  }
  const isDescriptionUntouched =
    descriptionContent === '' || descriptionContent.toLowerCase().includes('rewrite the summary of the tasks');

  // Check for common template placeholders (expanded list)
  const templatePhrases = [
    'please describe the issue here',
    'describe the problem',
    'what did you expect to happen',
    'what actually happened',
    'please provide',
    'fill in the details',
    'add your description here',
    'template content',
    'placeholder text',
    'rewrite the summary of the tasks performed for this issue and its goal',
    'record the notes and requirements related to the order of merging',
    'provide the logs of dodoai during the development process',
    'include screenshots showing changes or fixes',
  ];

  const containsPlaceholder = templatePhrases.some((phrase) => normalized.includes(phrase.toLowerCase()));
  return isDescriptionUntouched || containsPlaceholder;
}

// Function to detect if issue has unclear instructions using LLM
async function detectUnclearInstructions(title: string, body: string): Promise<{ result: boolean; reason: string }> {
  if (!body || body.trim().length === 0) {
    return {
      result: true,
      reason: 'The issue description is empty, providing no context or instructions.',
    };
  }

  try {
    const prompt = `
Please analyze this GitHub issue and determine if it lacks clear instructions on what needs to be done.

Issue Title: ${title}
Issue Body: ${body}

Consider the following criteria:
1. The issue lacks specific, actionable instructions
2. The description is vague or ambiguous
3. It's unclear what the expected outcome should be
4. The issue doesn't provide enough context for someone to understand what needs to be done
5. The instructions are too general or lack specificity

Respond in the following JSON format:
{
  "result": false,
  "reason": "The issue description does not specify actionable steps for resolution."
}

- "result": true if the issue has unclear instructions, false if it provides clear, actionable instructions
- "reason": A concise explanation of why the issue lacks clarity and a brief suggestion for improvement
`.trim();

    const result = await generateText({
      model: openai('gpt-4o-mini'),
      prompt,
    });

    const content = result.text?.trim();
    if (!content) {
      throw new Error('Empty LLM response');
    }

    const jsonMatch = content.match(/```(?:json)?([\s\S]*?)```/);
    const raw = jsonMatch?.[1]?.trim() || content;

    const parsed = JSON.parse(raw);

    if (typeof parsed.result === 'boolean' && typeof parsed.reason === 'string') {
      return parsed;
    } else {
      throw new Error('Missing or invalid fields in LLM response');
    }
  } catch (error) {
    console.error('Error in LLM unclear instructions detection:', error);
    // Fallback to heuristic-based detection
    const fallbackResult = fallbackUnclearInstructionsDetection(body);
    return {
      result: fallbackResult,
      reason: fallbackResult
        ? 'Heuristic detection: The issue description lacks sufficient detail and actionable information.'
        : 'Heuristic detection: The issue description appears to have sufficient detail.',
    };
  }
}

// Fallback heuristic-based unclear instructions detection
function fallbackUnclearInstructionsDetection(body: string): boolean {
  const normalized = body.trim().toLowerCase();

  // Check for very short content
  if (normalized.length < 100) {
    return true;
  }

  // Check for vague phrases
  const vaguePhrases = [
    'fix this',
    'something is wrong',
    "it doesn't work",
    "there's an issue",
    'problem with',
    'needs to be fixed',
    'broken',
    'not working',
    'help needed',
    'bug',
    'issue',
    'problem',
  ];

  // Check if the body lacks specific technical details
  const technicalTerms = [
    'error',
    'exception',
    'stack trace',
    'log',
    'console',
    'api',
    'endpoint',
    'database',
    'query',
    'function',
    'method',
    'class',
    'component',
    'file',
    'line',
    'code',
  ];

  const vagueCount = vaguePhrases.filter((phrase) => normalized.includes(phrase)).length;
  const technicalCount = technicalTerms.filter((term) => normalized.includes(term)).length;

  // If there are vague phrases but few technical details, it's likely unclear
  return vagueCount > 0 && technicalCount < 2 && normalized.length < 200;
}
