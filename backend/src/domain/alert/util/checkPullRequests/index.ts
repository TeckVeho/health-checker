/**
 * Main orchestrator for checkPullRequests functionality
 * Coordinates all modules while maintaining the original public API
 */
import { CheckPullRequestsResult, PullRequestAlertCandidate, GitHubPullRequest } from './types';
import { fetchOpenPullRequests } from './github';
import { validatePRQuality } from './validators';
import { analyzePRWithLLM } from './llm';

/**
 * Main function to check pull requests for various problems
 * This maintains the exact same interface as other check functions
 */
export async function checkPullRequests(
  owner: string,
  repo: string,
  onProgress?: (processed: number, total: number) => void
): Promise<CheckPullRequestsResult> {
  const alerts: PullRequestAlertCandidate[] = [];

  try {
    // Fetch open pull requests
    const pullRequests = await fetchOpenPullRequests(owner, repo);
    console.log(`  Found ${pullRequests.length} open pull requests in ${owner}/${repo}`);

    // Process each pull request
    for (let i = 0; i < pullRequests.length; i++) {
      const pr = pullRequests[i];

      console.log(`  Processing PR #${pr.number} (${i + 1}/${pullRequests.length})`);

      // Report progress to callback
      if (onProgress) {
        onProgress(i + 1, pullRequests.length);
      }

      // Run PR quality validations
      const prAlerts = await validatePRQuality(pr, owner, repo);
      alerts.push(...prAlerts);
    }

    console.log(`  Found ${alerts.length} PR alerts for ${owner}/${repo}`);
  } catch (error) {
    console.error(`❌ Error checking pull requests for ${owner}/${repo}:`, error);
  }

  return { owner, repo, alerts };
}
