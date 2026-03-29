/**
 * GitHub API operations for pull request data
 */
import { Octokit } from '@octokit/rest';
import { subDays } from 'date-fns';
import { GitHubPullRequest } from './types';

const githubToken = process.env.GITHUB_API_KEY;
if (!githubToken) throw new Error('GITHUB_API_KEY is required');

const octokit = new Octokit({
  auth: githubToken,
});

function mapRestPullRequest(pr: {
  number: number;
  title: string;
  body: string | null;
  user: { login?: string | null } | null;
  head: { ref: string };
  html_url: string;
  created_at: string;
  updated_at: string;
}): GitHubPullRequest {
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
}

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

    const pullRequests: GitHubPullRequest[] = response.data.map(mapRestPullRequest);

    console.log(`  Retrieved ${pullRequests.length} open pull requests`);
    return pullRequests;
  } catch (error) {
    console.error(`❌ Failed to fetch pull requests for ${owner}/${repo}:`, error);
    throw error;
  }
}

/**
 * Closed PRs whose created_at is within the last `days` days (for scheduled checks).
 */
export async function fetchRecentlyClosedPullRequestsCreatedWithin(
  owner: string,
  repo: string,
  days: number
): Promise<GitHubPullRequest[]> {
  const cutoff = subDays(new Date(), days);
  const cutoffMs = cutoff.getTime();
  const result: GitHubPullRequest[] = [];
  let page = 1;
  const perPage = 100;

  console.log(`  Fetching closed pull requests (created within ${days}d) for ${owner}/${repo}...`);

  try {
    while (true) {
      const response = await octokit.pulls.list({
        owner,
        repo,
        state: 'closed',
        sort: 'created',
        direction: 'desc',
        per_page: perPage,
        page,
      });

      if (response.data.length === 0) {
        break;
      }

      let stopPagination = false;
      for (const pr of response.data) {
        const createdMs = new Date(pr.created_at).getTime();
        if (createdMs < cutoffMs) {
          stopPagination = true;
          break;
        }
        result.push(mapRestPullRequest(pr));
      }

      if (stopPagination || response.data.length < perPage) {
        break;
      }
      page++;
    }

    console.log(`  Retrieved ${result.length} recently created closed pull requests`);
    return result;
  } catch (error) {
    console.error(`❌ Failed to fetch closed pull requests for ${owner}/${repo}:`, error);
    throw error;
  }
}

/**
 * Open PRs plus closed PRs created within the last 7 days (scheduled / cron checks).
 */
export async function fetchPullRequestsForScheduledCheck(owner: string, repo: string): Promise<GitHubPullRequest[]> {
  const [open, closedRecent] = await Promise.all([
    fetchOpenPullRequests(owner, repo),
    fetchRecentlyClosedPullRequestsCreatedWithin(owner, repo, 7),
  ]);

  const byNumber = new Map<number, GitHubPullRequest>();
  for (const pr of open) {
    byNumber.set(pr.number, pr);
  }
  for (const pr of closedRecent) {
    if (!byNumber.has(pr.number)) {
      byNumber.set(pr.number, pr);
    }
  }

  const merged = Array.from(byNumber.values());
  console.log(`  Scheduled PR check: ${merged.length} total (open + recently created closed)`);
  return merged;
}

/**
 * Count GitHub "closing issues" references (Linked issues / development references) for a PR.
 */
export async function getClosingIssuesReferenceCount(owner: string, repo: string, prNumber: number): Promise<number> {
  const response = await octokit.graphql<{
    repository: {
      pullRequest: {
        closingIssuesReferences: { totalCount: number };
      } | null;
    } | null;
  }>(
    `
    query GetClosingIssuesRefCount($owner: String!, $repo: String!, $prNumber: Int!) {
      repository(owner: $owner, name: $repo) {
        pullRequest(number: $prNumber) {
          closingIssuesReferences(first: 1) {
            totalCount
          }
        }
      }
    }
    `,
    { owner, repo, prNumber }
  );

  const pr = response.repository?.pullRequest;
  if (!pr) {
    return 0;
  }
  return pr.closingIssuesReferences?.totalCount ?? 0;
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
    return mapRestPullRequest(pr);
  } catch (error) {
    console.error(`❌ Failed to fetch PR #${prNumber} for ${owner}/${repo}:`, error);
    return null;
  }
}
