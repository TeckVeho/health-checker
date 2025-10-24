/**
 * Main entry point for PR check functionality
 * This file provides a simple interface for checking pull requests
 */

import { checkPullRequests as checkPullRequestsInternal } from './checkPullRequests/index';
import { CheckPullRequestsResult } from './checkPullRequests/types';

/**
 * Main function to check pull requests for various problems
 * This maintains a simple interface similar to other check functions
 */
export async function checkPullRequests(
  owner: string,
  repo: string,
  onProgress?: (processed: number, total: number) => void
): Promise<CheckPullRequestsResult> {
  return await checkPullRequestsInternal(owner, repo, onProgress);
}

// Re-export types for backward compatibility
export type { CheckPullRequestsResult, PullRequestAlertCandidate } from './checkPullRequests/types';
