/**
 * GitHub API client and utilities for fetching issues and project data
 */
import { Octokit } from '@octokit/rest';
import { GitHubIssue, CREATED_SINCE } from './types';

// Initialize GitHub client
const githubToken = process.env.GITHUB_API_KEY;
if (!githubToken && process.env.NODE_ENV !== 'test') {
  throw new Error('GITHUB_API_KEY is required');
}

export const octokit = new Octokit({ auth: githubToken || 'test-token' });

/**
 * Fetch all open issues created after CREATED_SINCE, filtering out pull requests
 */
export async function fetchFilteredIssues(owner: string, repo: string): Promise<GitHubIssue[]> {
  // Get all open issues with pagination
  const allItems = await octokit.paginate(octokit.issues.listForRepo, {
    owner,
    repo,
    state: 'open',
    // eslint-disable-next-line @typescript-eslint/naming-convention
    per_page: 100,
  });

  // Filter out pull requests - only keep actual issues
  const issuesOnly = allItems.filter((item: any) => !item.pull_request);

  // Filter by created_at >= CREATED_SINCE
  const issues = issuesOnly.filter((item: any) => {
    const createdAtStr: string | undefined = item.created_at;
    if (!createdAtStr) return false;
    const createdAt = new Date(createdAtStr);
    return createdAt >= CREATED_SINCE;
  });

  console.log(`  Found ${allItems.length} open items (issues + PRs) for ${owner}/${repo}`);
  console.log(`  Filtered to ${issuesOnly.length} actual issues (excluded ${allItems.length - issuesOnly.length} PRs)`);
  console.log(`  After created_at filter: ${issues.length} issues remain`);

  return issues as GitHubIssue[];
}

/**
 * Execute a GraphQL query against the GitHub API
 */
export async function executeGraphQL<T>(query: string, variables: Record<string, any>): Promise<T> {
  return await octokit.graphql<T>(query, variables);
}