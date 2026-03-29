/**
 * Main orchestrator for checkPullRequests functionality
 * Coordinates all modules while maintaining the original public API
 */
import {
  CheckPullRequestsResult,
  CheckPullRequestsOptions,
  PullRequestAlertCandidate,
  GitHubPullRequest,
} from './types';
import { fetchOpenPullRequests, fetchPullRequestsForScheduledCheck } from './github';
import { validatePRQuality, validatePrIssueLinked } from './validators';

/**
 * Main function to check pull requests for various problems
 * This maintains the exact same interface as other check functions
 */
export async function checkPullRequests(
  owner: string,
  repo: string,
  onProgress?: (processed: number, total: number) => void,
  options?: CheckPullRequestsOptions
): Promise<CheckPullRequestsResult> {
  const alerts: PullRequestAlertCandidate[] = [];
  const isScheduledRun = options?.isScheduledRun === true;

  try {
    const pullRequests: GitHubPullRequest[] = isScheduledRun
      ? await fetchPullRequestsForScheduledCheck(owner, repo)
      : await fetchOpenPullRequests(owner, repo);

    console.log(
      `  Found ${pullRequests.length} pull requests to process in ${owner}/${repo}` +
        (isScheduledRun ? ' (scheduled: open + recent closed)' : '')
    );

    for (let i = 0; i < pullRequests.length; i++) {
      const pr = pullRequests[i];

      console.log(`  Processing PR #${pr.number} (${i + 1}/${pullRequests.length})`);

      if (onProgress) {
        onProgress(i + 1, pullRequests.length);
      }

      const prAlerts = await validatePRQuality(pr, owner, repo);
      alerts.push(...prAlerts);

      if (isScheduledRun) {
        const linkAlerts = await validatePrIssueLinked(pr, owner, repo);
        alerts.push(...linkAlerts);
      }
    }

    console.log(`  Found ${alerts.length} PR alerts for ${owner}/${repo}`);
  } catch (error) {
    console.error(`❌ Error checking pull requests for ${owner}/${repo}:`, error);
  }

  return { owner, repo, alerts };
}
