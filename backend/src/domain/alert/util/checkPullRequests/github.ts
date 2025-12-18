/**
 * GitHub API operations for pull request data
 */
import { Octokit } from '@octokit/rest';
import { GitHubPullRequest } from './types';

const githubToken = process.env.GITHUB_API_KEY;
if (!githubToken) throw new Error('GITHUB_API_KEY is required');

const octokit = new Octokit({
  auth: githubToken,
});

/**
 * Fetch all open pull requests for a repository
 */
export async function fetchOpenPullRequests(owner: string, repo: string): Promise<GitHubPullRequest[]> {
  console.log(`  Fetching open pull requests for ${owner}/${repo}...`);

  try {
    const response = await octokit.pulls.list({
      owner,
      repo,
      state: 'open',
      sort: 'created',
      direction: 'desc',
      per_page: 100, // GitHub API limit
    });

    const pullRequests: GitHubPullRequest[] = response.data.map(pr => ({
      number: pr.number,
      title: pr.title,
      body: pr.body,
      user: {
        login: pr.user?.login || 'unknown',
      },
      head: {
        ref: pr.head.ref,
      },
      html_url: pr.html_url,
      created_at: pr.created_at,
      updated_at: pr.updated_at,
    }));

    console.log(`  Retrieved ${pullRequests.length} open pull requests`);
    return pullRequests;
  } catch (error) {
    console.error(`❌ Failed to fetch pull requests for ${owner}/${repo}:`, error);
    throw error;
  }
}

/**
 * Get detailed information about a specific pull request
 */
export async function getPullRequestDetails(owner: string, repo: string, prNumber: number): Promise<GitHubPullRequest | null> {
  try {
    const response = await octokit.pulls.get({
      owner,
      repo,
      pull_number: prNumber,
    });

    const pr = response.data;
    return {
      number: pr.number,
      title: pr.title,
      body: pr.body,
      user: {
        login: pr.user?.login || 'unknown',
      },
      head: {
        ref: pr.head.ref,
      },
      html_url: pr.html_url,
      created_at: pr.created_at,
      updated_at: pr.updated_at,
    };
  } catch (error) {
    console.error(`❌ Failed to fetch PR #${prNumber} for ${owner}/${repo}:`, error);
    return null;
  }
}


