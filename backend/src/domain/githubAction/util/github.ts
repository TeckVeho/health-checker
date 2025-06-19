import { Octokit } from '@octokit/rest';

const githubToken = process.env.GITHUB_API_KEY;
if (!githubToken) throw new Error('GITHUB_API_KEY is required');

const octokit = new Octokit({
  auth: githubToken,
});

export interface PullRequestReview {
  decision: 'approve' | 'request_changes' | 'comment';
  reason: string;
}

export interface GitHubPullRequest {
  title: string;
  body: string | null;
  number: number;
}

export interface GitHubIssue {
  title: string;
  body: string | null;
  number: number;
}

export interface GitHubFileDiff {
  filename: string;
  patch: string | undefined;
}

export class GitHubUtility {
  static async getLinkedIssueNumber(owner: string, repo: string, prNumber: number): Promise<number | null> {
    console.log(`[DEBUG] Fetching linked issues for PR #${prNumber}`);

    try {
      const response = await octokit.graphql<{
        repository: {
          pullRequest: {
            closingIssuesReferences: {
              nodes: { number: number }[];
            };
          };
        };
      }>(
        `
        query GetLinkedIssues($owner: String!, $repo: String!, $prNumber: Int!) {
          repository(owner: $owner, name: $repo) {
            pullRequest(number: $prNumber) {
              closingIssuesReferences(first: 1) {
                nodes {
                  number
                }
              }
            }
          }
        }
        `,
        { owner, repo, prNumber }
      );

      const linkedIssues = response.repository.pullRequest.closingIssuesReferences.nodes;

      if (linkedIssues.length > 0) {
        const issueNumber = linkedIssues[0].number;
        console.log(`[INFO] Found linked issue via GraphQL API: #${issueNumber}`);
        return issueNumber;
      }

      console.log('[INFO] No linked issues found via GraphQL API');
      return null;
    } catch (error) {
      console.error(`[ERROR] Failed to fetch linked issues: ${(error as Error).message}`);
      return null;
    }
  }

  static async getPullRequest(owner: string, repo: string, prNumber: number): Promise<GitHubPullRequest> {
    const { data } = await octokit.pulls.get({ owner, repo, pull_number: prNumber }); // eslint-disable-line @typescript-eslint/naming-convention
    return {
      title: data.title,
      body: data.body,
      number: data.number,
    };
  }

  static async getIssue(owner: string, repo: string, issueNumber: number): Promise<GitHubIssue> {
    const { data } = await octokit.issues.get({
      owner,
      repo,
      issue_number: issueNumber, // eslint-disable-line @typescript-eslint/naming-convention
    });

    return {
      title: data.title || '',
      body: data.body ?? null,
      number: data.number,
    };
  }

  static async listFiles(owner: string, repo: string, prNumber: number): Promise<GitHubFileDiff[]> {
    const { data } = await octokit.pulls.listFiles({ owner, repo, pull_number: prNumber }); // eslint-disable-line @typescript-eslint/naming-convention
    return data.map((file) => ({
      filename: file.filename,
      patch: file.patch,
    }));
  }

  static async submitReview(owner: string, repo: string, prNumber: number, review: PullRequestReview): Promise<void> {
    try {
      const { decision, reason } = review;
      const event = decision === 'approve' ? 'APPROVE' : decision === 'request_changes' ? 'REQUEST_CHANGES' : 'COMMENT';

      
      const bodyWithHeader = `### This is an automated review by the Health Checker system.\n\n${reason}`;

      await octokit.pulls.createReview({
        owner,
        repo,
        pull_number: prNumber, // eslint-disable-line @typescript-eslint/naming-convention
        event,
        body: bodyWithHeader,
      });

      console.log(`[INFO] Successfully submitted ${decision} review for PR #${prNumber}`);
      console.log(`${reason}`);
    } catch (error) {
      console.error(`[ERROR] Failed to submit review: ${(error as Error).message}`);
      throw error;
    }
  }
}
