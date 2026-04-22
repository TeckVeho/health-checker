/**
 * GitHub API operations for pull request data
 */
import { Octokit } from '@octokit/rest';
import type { RestEndpointMethodTypes } from '@octokit/rest';
import { subDays } from 'date-fns';
import { GitHubPullRequest } from './types';

const githubToken = process.env.GITHUB_API_KEY;
if (!githubToken) throw new Error('GITHUB_API_KEY is required');

const octokit = new Octokit({
  auth: githubToken,
});

type RestPullFromApi =
  | RestEndpointMethodTypes['pulls']['list']['response']['data'][number]
  | RestEndpointMethodTypes['pulls']['get']['response']['data'];

function mapRestPullRequest(pr: RestPullFromApi): GitHubPullRequest {
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
    htmlUrl: pr.html_url,
    createdAt: pr.created_at,
    updatedAt: pr.updated_at,
    state: pr.state === 'closed' ? 'closed' : 'open',
  };
}

/**
 * Fetch all open pull requests for a repository
 */
export async function fetchOpenPullRequests(owner: string, repo: string): Promise<GitHubPullRequest[]> {
  console.log(`  Fetching open pull requests for ${owner}/${repo}...`);

  try {
    /* eslint-disable @typescript-eslint/naming-convention -- GitHub REST query/body keys (per_page) */
    const response = await octokit.pulls.list({
      owner,
      repo,
      state: 'open',
      sort: 'created',
      direction: 'desc',
      per_page: 100, // GitHub API limit
    });
    /* eslint-enable @typescript-eslint/naming-convention */

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
      /* eslint-disable @typescript-eslint/naming-convention -- GitHub REST query keys */
      const response = await octokit.pulls.list({
        owner,
        repo,
        state: 'closed',
        sort: 'created',
        direction: 'desc',
        per_page: perPage,
        page,
      });
      /* eslint-enable @typescript-eslint/naming-convention */

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
 * GitHub のクローズキーワードを本文から抽出する（.github/workflows/pr-policy-check.yml と同じ正規表現）。
 * GraphQL の closingIssuesReferences はクロスリポジトリを返さない場合があるため、ワークフローと同様に本文も見る。
 *
 * @see https://docs.github.com/en/issues/tracking-your-work-with-issues/linking-a-pull-request-to-an-issue
 */
export function parseClosingReferencesFromBody(text: string, owner: string, repo: string): Set<string> {
  const refs = new Set<string>();
  const keyword = '(?:close[sd]?|fix(?:e[sd])?|resolve[sd]?)';

  const crossRepo = new RegExp(`\\b${keyword}\\s+([\\w.-]+\\/[\\w.-]+)#(\\d+)\\b`, 'gi');
  let match: RegExpExecArray | null;
  while ((match = crossRepo.exec(text)) !== null) {
    refs.add(`${match[1]}#${match[2]}`);
  }

  const issueUrl = new RegExp(
    `\\b${keyword}\\s+https?://github\\.com/([\\w.-]+/[\\w.-]+)/(?:issues|pull)/(\\d+)\\b`,
    'gi'
  );
  while ((match = issueUrl.exec(text)) !== null) {
    refs.add(`${match[1]}#${match[2]}`);
  }

  const sameRepoHash = new RegExp(`\\b${keyword}\\s+#(\\d+)\\b`, 'gi');
  while ((match = sameRepoHash.exec(text)) !== null) {
    refs.add(`${owner}/${repo}#${match[1]}`);
  }

  const sameRepoGh = new RegExp(`\\b${keyword}\\s+GH-(\\d+)\\b`, 'gi');
  while ((match = sameRepoGh.exec(text)) !== null) {
    refs.add(`${owner}/${repo}#${match[1]}`);
  }

  return refs;
}

/* GraphQL 標準フィールド __typename — naming-convention 対象外 */
/* eslint-disable @typescript-eslint/naming-convention */
type PullRequestIssueLinkQueryResult = {
  repository: {
    pullRequest: {
      closingIssuesReferences: { nodes: Array<{ number?: number } | null> | null } | null;
      timelineItems: {
        nodes: Array<{
          __typename?: string;
          subject?: { __typename?: string; number?: number };
        } | null> | null;
      } | null;
    } | null;
  } | null;
};
/* eslint-enable @typescript-eslint/naming-convention */

/**
 * PR ポリシー（pr-policy-check.yml）と同条件で、リンク済み issue 相当とみなせるか。
 * - closingIssuesReferences（キーワードリンク）
 * - timeline CONNECTED_EVENT（サイドバー手動リンク）
 * - 上記が無くても本文にクローズキーワード＋ issue 参照があれば可
 */
export async function prHasLinkedIssuePerPolicy(
  owner: string,
  repo: string,
  prNumber: number,
  body: string | null
): Promise<boolean> {
  const normalizedBody = (body ?? '').replace(/\r\n/g, '\n').trim();
  if (parseClosingReferencesFromBody(normalizedBody, owner, repo).size > 0) {
    return true;
  }

  const response = await octokit.graphql<PullRequestIssueLinkQueryResult>(
    `
    query PrIssueLinkPolicy($owner: String!, $repo: String!, $prNumber: Int!) {
      repository(owner: $owner, name: $repo) {
        pullRequest(number: $prNumber) {
          closingIssuesReferences(first: 20) {
            nodes {
              number
            }
          }
          timelineItems(first: 100, itemTypes: [CONNECTED_EVENT]) {
            nodes {
              __typename
              ... on ConnectedEvent {
                subject {
                  __typename
                  ... on Issue {
                    number
                  }
                }
              }
            }
          }
        }
      }
    }
    `,
    { owner, repo, prNumber }
  );

  const prNode = response.repository?.pullRequest;
  if (!prNode) {
    return false;
  }

  const linkedIssueNumbers = new Set<number>();
  for (const issue of prNode.closingIssuesReferences?.nodes ?? []) {
    if (issue?.number != null) {
      linkedIssueNumbers.add(issue.number);
    }
  }
  for (const node of prNode.timelineItems?.nodes ?? []) {
    if (
      node?.__typename === 'ConnectedEvent' &&
      node.subject?.__typename === 'Issue' &&
      node.subject.number != null
    ) {
      linkedIssueNumbers.add(node.subject.number);
    }
  }

  return linkedIssueNumbers.size > 0;
}

/**
 * Get detailed information about a specific pull request
 */
export async function getPullRequestDetails(owner: string, repo: string, prNumber: number): Promise<GitHubPullRequest | null> {
  try {
    /* eslint-disable @typescript-eslint/naming-convention -- GitHub REST path/body keys */
    const response = await octokit.pulls.get({
      owner,
      repo,
      pull_number: prNumber,
    });
    /* eslint-enable @typescript-eslint/naming-convention */

    const pr = response.data;
    return mapRestPullRequest(pr);
  } catch (error) {
    console.error(`❌ Failed to fetch PR #${prNumber} for ${owner}/${repo}:`, error);
    return null;
  }
}
