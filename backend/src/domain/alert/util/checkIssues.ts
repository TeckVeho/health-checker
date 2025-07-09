import { Octokit } from '@octokit/rest';
import type { RestEndpointMethodTypes } from '@octokit/rest';
import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';

const githubToken = process.env.GITHUB_API_KEY;
if (!githubToken) throw new Error('GITHUB_API_KEY is required');

// Initialize Octokit
const octokit = new Octokit({ auth: githubToken });

/**
 * Type definition for GitHub Issue
 */
type Issue = RestEndpointMethodTypes['issues']['listForRepo']['response']['data'][number];

/**
 * Fetch all open issues for the specified repository
 * and pass each one to the checkIssue function
 * @param owner - Repository owner (e.g., 'octocat')
 * @param repo - Repository name (e.g., 'hello-world')
 */
export async function checkIssues(owner: string, repo: string): Promise<void> {
  const issues: Issue[] = await octokit.paginate(octokit.issues.listForRepo, {
    owner,
    repo,
    state: 'open',
    per_page: 100, // eslint-disable-line @typescript-eslint/naming-convention
  });

  for (const issue of issues) {
    // Only process issues (not pull requests)
    if (!issue.pull_request) {
      await checkIssue(issue, owner, repo);
    }
  }
}

/**
 * Evaluate a single issue using AI and register an alert if needed
 * @param issue - The GitHub issue to evaluate
 * @param owner - Repository owner
 * @param repo - Repository name
 */
export async function checkIssue(issue: Issue, owner: string, repo: string): Promise<void> {
  
}
