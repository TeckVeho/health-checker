import { Octokit } from '@octokit/rest';
import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';
import { OPENAI_CONFIG } from '../../../config/openai';

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

    console.log(`  Found ${allItems.length} open items (issues + PRs) for ${owner}/${repo}`);
    console.log(`  Filtered to ${issuesOnly.length} actual issues (excluded ${allItems.length - issuesOnly.length} PRs)`);
    console.log(`  After created_at filter (>= ${CREATED_SINCE_ISO}): ${issues.length} issues remain`);

    // Pre-load all project data once for performance optimization
    console.log('  Pre-loading project data (createdAt-filtered)...');
    const allProjectIssues = await getAllProjectIssues(owner, repo);
    console.log(`  Found ${allProjectIssues.size} issues in projects (createdAt-filtered)`);

    // Pre-load project field values for filtered issues only
    console.log('  Pre-loading project field values for filtered issues...');
    const projectFieldValues = await getAllProjectFieldValues(
      owner,
      repo,
      issues.map((issue: any) => issue.number)
    );
    console.log(`  Loaded field values for ${projectFieldValues.size} issues`);

    for (let i = 0; i < issues.length; i++) {
      const issue: any = issues[i];

      // Double-check: ensure this is actually an issue, not a PR
      if (issue.pull_request) {
        console.log(`?? Skipping PR #${issue.number} - this should not happen after filtering`);
        continue;
      }

      console.log(`  Processing issue #${issue.number} (${i + 1}/${issues.length})`);

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

      // === Only one LLM call: treat "template-only" as part of "unclear" ===
      const clarity = await detectUnclearInstructions(issue.title, issue.body || '');
      if (clarity.result) {
        alerts.push({
          owner,
          repo,
          checkType: 'issue_unclear_instruction',
          title: `issue:${issue.number}`,
          description: `Issue #${issue.number} lacks clear, actionable instructions. ${clarity.reason}`,
          severity: 'middle',
          filePath,
          lineNumber,
          codeSnippet,
          branch,
          issueUrl: issue.html_url,
        });
      }
    }

    console.log(`  Found ${alerts.length} issue alerts for ${owner}/${repo}`);
  } catch (error) {
    console.error(`? Error checking issues for ${owner}/${repo}:`, error);
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
    console.log('  Loading project field values using GraphQL (restricted to filtered issues)...');

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
      console.log(`  Processing ${projects.length} projects V2 for field values...`);

      // Step 2: For each project V2, get all items with field values
      for (const project of projects) {
        console.log(`  Project V2 ${project.title}: loading items with field values...`);

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
          console.log(`  Project V2 ${project.title}: ${items.length} items with field values`);

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

    console.log(`  Found field values for ${fieldValues.size} issues from projects V2`);
  } catch (error) {
    console.error(`? Error loading project field values for ${owner}/${repo}:`, error);
    console.log('?? Project field value check will be skipped due to API limitations');
  }

  return fieldValues;
}

// Function to get all issues in projects with pagination (createdAt filtered)
async function getAllProjectIssues(owner: string, repo: string): Promise<Set<number>> {
  const allIssues = new Set<number>();

  try {
    console.log('  Loading projects V2 using GraphQL with pagination...');

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
      console.log(`  Processing ${projects.length} projects V2...`);

      // Step 2: For each project V2, get all items
      for (const project of projects) {
        console.log(`  Project V2 ${project.title}: loading items...`);

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
          console.log(`  Project V2 ${project.title}: ${items.length} items`);

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
      `  Found ${allIssues.size} issues in projects V2 (createdAt >= ${CREATED_SINCE_ISO}, with pagination)`
    );
  } catch (error) {
    console.error(`? Error loading project V2 issues for ${owner}/${repo}:`, error);
    console.log('?? Project check will be skipped due to API limitations');
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
    /Deadline[:\s]*(\d{4}-\d2}-\d{2})/i, // note: original had variants; keep primary patterns
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

/**
 * Single-LLM check:
 * Detects whether an issue lacks clear, actionable instructions.
 * "Template-only" is treated as a subset of "unclear", so no separate check is needed.
 */
async function detectUnclearInstructions(title: string, body: string): Promise<{ result: boolean; reason: string }> {
  if (!body || body.trim().length === 0) {
    return {
      result: true,
      reason: 'The issue body is empty (template-only), so the instructions are unclear.',
    };
  }

  try {
    const prompt = `
You are analyzing a GitHub Issue body to decide if it lacks clear, actionable instructions ("unclear").

Treat "template-only" as a subset of "unclear". In other words, if the body is empty, only placeholders, or untouched template text, mark it as unclear.

Issue Title: ${title}
Issue Body: ${body}

Mark it as UNCLEAR (result=true) if ANY of the following:
- Empty or whitespace-only
- Only placeholder text (e.g., "Please describe here", "[Task 1]"), or untouched template sections
- Lacks specific, actionable steps or a minimum clear next action
- Vague or ambiguous description; expected outcome is unclear
- Not enough context to understand what needs to be done

Mark it as CLEAR (result=false) if ANY of the following signals suggest minimum actionable clarity, even if the body is short:
- Contains a concrete directive (e.g., "relax validation", "fix strict check", "add missing field")
- References a specific file, code area, link, or resource (#123, \`.ts\` file, or URL)
- Has a simple checklist or bullet list that outlines steps
- Includes Purpose/Spec/概要/詳細/タスク style sections with at least one meaningful line that indicates what to do

Respond ONLY in this JSON format:
{
  "result": false,
  "reason": "Short, concrete justification describing why it is clear or unclear."
}
`.trim();

    console.log('=== Prompt sent to AI (unclear only) ===');
    console.log(prompt);

    const result = await generateText({
      model: openai(OPENAI_CONFIG.MODEL),
      prompt,
    });

    const content = result.text?.trim();
    console.log('=== Raw AI response (unclear only) ===');
    console.log(content);

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
    // Fallback to heuristic-based detection that *includes* template-only cases
    const fallbackResult = fallbackUnclearInstructionsDetection(body);
    return {
      result: fallbackResult,
      reason: fallbackResult
        ? 'Heuristic: Body is template-like or lacks minimum actionable clarity.'
        : 'Heuristic: Body shows minimum actionable clarity (directive/link/section/list).',
    };
  }
}

/**
 * Fallback heuristic for "unclear" that also absorbs "template-only".
 * Returns true if unclear; false if clear.
 */
function fallbackUnclearInstructionsDetection(body: string): boolean {
  const normalized = body.trim().toLowerCase();

  // Immediate template-only indicators (subset of unclear)
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
    'rewrite the summary of the tasks',
    'record the notes and requirements related to the order of merging',
    'provide the logs',
    'include screenshots showing changes or fixes',
  ];
  if (normalized.length === 0) return true;
  if (templatePhrases.some((p) => normalized.includes(p))) return true;

  // Signals of clarity (any makes it clear)
  const hasList = /^[-*]\s+/m.test(body); // bullet points
  const hasLink = /\bhttps?:\/\//i.test(body);
  const hasFileRef = /\b\w+\.(ts|js|tsx|jsx|md|yml|yaml|json)\b/i.test(body) || /#\d+/.test(body);
  const hasSection = /##\s*(purpose|spec|概要|詳細|タスク|task|steps|チェック|参考|memo|メモ|description)/i.test(body);
  const actionVerbs = [
    'fix','relax','update','add','remove','refactor','rewrite','implement',
    'enable','disable','set','change','migrate','bump','link','document'
  ];
  const hasActionVerb = actionVerbs.some((v) => normalized.includes(v));

  if (hasList || hasLink || hasFileRef || hasSection || hasActionVerb) {
    // Considered clear enough even if short
    return false;
  }

  // Vague vs technical signal
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
  ];
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
    'unit test',
    'jest',
  ];

  const vagueCount = vaguePhrases.filter((phrase) => normalized.includes(phrase)).length;
  const technicalCount = technicalTerms.filter((term) => normalized.includes(term)).length;

  // Extremely short with no clarity signals → unclear
  if (normalized.length < 80) return true;

  // Vague language + lack of technical/context → unclear (more lenient threshold)
  if (vagueCount > 0 && technicalCount < 2 && normalized.length < 200) return true;

  // Default: assume clear enough
  return false;
}
