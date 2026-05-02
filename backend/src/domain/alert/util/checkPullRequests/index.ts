/**
 * Main orchestrator for checkPullRequests functionality
 * Coordinates all modules while maintaining the original public API
 */
import { isOpenAILlmEnabled, isOpenAIScheduledLlmBatchMode } from '../../../../config/openai';
import { buildChatCompletionBatchLine, runChatCompletionsBatch } from '../openaiBatchRunner';
import {
  CheckPullRequestsResult,
  CheckPullRequestsOptions,
  GitHubPullRequest,
  LLMAnalysisResult,
} from './types';
import { fetchOpenPullRequests, fetchPullRequestsForScheduledCheck } from './github';
import { validatePRQuality, validatePrIssueLinked, validateDependabotOpenPr } from './validators';
import { buildPRQualityUserPrompt, parsePRQualityFromAssistantText } from './llm';

function prQualityBatchId(owner: string, repo: string, prNumber: number): string {
  return `prq|${owner}|${repo}|${prNumber}`;
}

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
  const alerts: CheckPullRequestsResult['alerts'] = [];
  const isScheduledRun = options?.isScheduledRun === true;

  try {
    const pullRequests: GitHubPullRequest[] = isScheduledRun
      ? await fetchPullRequestsForScheduledCheck(owner, repo)
      : await fetchOpenPullRequests(owner, repo);

    console.log(
      `  Found ${pullRequests.length} pull requests to process in ${owner}/${repo}` +
        (isScheduledRun ? ' (scheduled: open + recent closed)' : '')
    );

    const useBatchLlm = isScheduledRun && isOpenAILlmEnabled() && isOpenAIScheduledLlmBatchMode();
    const prQualityByNumber = new Map<number, LLMAnalysisResult>();

    if (useBatchLlm) {
      const lines = [];
      for (const pr of pullRequests) {
        if (!pr.body?.trim()) {
          continue;
        }
        lines.push(
          buildChatCompletionBatchLine(
            prQualityBatchId(owner, repo, pr.number),
            buildPRQualityUserPrompt(pr.title, pr.body)
          )
        );
      }
      if (lines.length > 0) {
        console.log(`  OpenAI Batch (PR): ${lines.length} chat completions for ${owner}/${repo}`);
        const batchMap = await runChatCompletionsBatch(lines);
        for (const pr of pullRequests) {
          if (!pr.body?.trim()) {
            continue;
          }
          const text = batchMap.get(prQualityBatchId(owner, repo, pr.number));
          if (!text) {
            continue;
          }
          try {
            prQualityByNumber.set(pr.number, parsePRQualityFromAssistantText(text, pr.number));
          } catch {
            // validatePRQuality が同期 LLM にフォールバック
          }
        }
      }
    }

    for (let i = 0; i < pullRequests.length; i++) {
      const pr = pullRequests[i];

      console.log(`  Processing PR #${pr.number} (${i + 1}/${pullRequests.length})`);

      if (onProgress) {
        onProgress(i + 1, pullRequests.length);
      }

      const prAlerts = await validatePRQuality(pr, owner, repo, prQualityByNumber.get(pr.number));
      alerts.push(...prAlerts);

      alerts.push(...validateDependabotOpenPr(pr, owner, repo));

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
