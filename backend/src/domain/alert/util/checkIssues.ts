import { Octokit } from '@octokit/rest';

const githubToken = process.env.GITHUB_API_KEY;
if (!githubToken) throw new Error('GITHUB_API_KEY is required');

const octokit = new Octokit({ auth: githubToken });

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
  issueNumber: number;
  issueUrl: string;
}

export interface CheckIssuesResult {
  owner: string;
  repo: string;
  alerts: IssueAlertCandidate[];
}

export async function checkIssues(owner: string, repo: string): Promise<CheckIssuesResult> {
  const alerts: IssueAlertCandidate[] = [];
  const filePath = '';
  const lineNumber = -1;
  const codeSnippet = '';
  const branch = '';

  try {
    // Get all open issues with pagination
    const issues = await octokit.paginate(octokit.issues.listForRepo, {
      owner,
      repo,
      state: 'open',
      per_page: 100,
    });

    console.log(`📋 Found ${issues.length} open issues for ${owner}/${repo}`);

    // Cache project data to avoid multiple API calls
    const projectCache = new Map<number, boolean>();
    
    // Pre-load all project data once for performance optimization
    console.log('📊 Pre-loading project data...');
    const allProjectIssues = await getAllProjectIssues(owner, repo);
    console.log(`📊 Found ${allProjectIssues.size} issues in projects`);
    
    for (let i = 0; i < issues.length; i++) {
      const issue = issues[i];
      console.log(`🔍 Processing issue #${issue.number} (${i + 1}/${issues.length})`);
      
      // Check Story Point (SP)
      const storyPoints = extractStoryPoints(issue.body || '');
      
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
          issueNumber: issue.number,
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
          issueNumber: issue.number,
          issueUrl: issue.html_url,
        });
      }

      // Check End Date
      const endDate = extractEndDate(issue.body || '');
      
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
          issueNumber: issue.number,
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
          issueNumber: issue.number,
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
          issueNumber: issue.number,
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

// Function to get all issues in projects with pagination
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

    // Query to get items of a project V2
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
                  }
                }
              }
            }
          }
        }
      }
    `;

    // Step 1: Get all projects V2 with pagination
    let projectsAfter = null;
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
        
        let itemsAfter = null;
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

          // Collect issue numbers from items
          for (const item of items) {
            if (item.content && item.content.number) {
              allIssues.add(item.content.number);
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

    console.log(`📊 Found ${allIssues.size} issues in projects V2 (with pagination)`);

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


