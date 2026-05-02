/**
 * Main orchestrator for checkIssues functionality
 * Coordinates all modules while maintaining the original public API
 */
import { isOpenAILlmEnabled, isOpenAIScheduledLlmBatchMode } from '../../../../config/openai';
import { buildChatCompletionBatchLine, runChatCompletionsBatch } from '../openaiBatchRunner';
import { CheckIssuesResult, IssueAlertCandidate, GitHubIssue } from './types';
import { fetchFilteredIssues } from './github';
import { getAllProjectFieldValues, getAllProjectIssues } from './projects';
import {
  detectTemplateOnlyIssue,
  detectUnclearInstructions,
  buildIssueTemplatePrompt,
  buildIssueClarityPrompt,
} from './llm';
import {
  validateAssignment,
  validateStoryPoints,
  validateEndDates,
  validateProjectMembership,
  validateContentQuality,
} from './validators';

// Re-export public types for backward compatibility
export type { IssueAlertCandidate, CheckIssuesResult } from './types';

export interface CheckIssuesOptions {
  /** 定期チェック時 true。有効なら LLM を OpenAI Batch API に寄せる（デフォルト）。 */
  isScheduledRun?: boolean;
}

function issueTemplateBatchId(owner: string, repo: string, issueNumber: number): string {
  return `iss_tpl|${owner}|${repo}|${issueNumber}`;
}

function issueClarityBatchId(owner: string, repo: string, issueNumber: number): string {
  return `iss_clr|${owner}|${repo}|${issueNumber}`;
}

/** 本の issue 走査と同じフィルタで Batch 用の行を積む対象となる issue を列挙 */
function collectProcessableIssuesForBatch(issues: GitHubIssue[]): GitHubIssue[] {
  const out: GitHubIssue[] = [];
  const skipLabels = ['parent', 'bug'];
  for (const issue of issues) {
    if (issue.pull_request) {
      continue;
    }
    const hasSkipLabel = (issue.labels ?? []).some((label) =>
      skipLabels.includes(String(label.name || '').toLowerCase())
    );
    if (hasSkipLabel) {
      continue;
    }
    const body = issue.body || '';
    if (!body.trim()) {
      continue;
    }
    out.push(issue);
  }
  return out;
}

/**
 * Main function to check issues for various problems
 * This maintains the exact same interface as the original implementation
 */
export async function checkIssues(
  owner: string,
  repo: string,
  onProgress?: (processed: number, total: number) => void,
  options?: CheckIssuesOptions
): Promise<CheckIssuesResult> {
  const alerts: IssueAlertCandidate[] = [];

  // Note: This function only processes actual GitHub Issues, not Pull Requests.
  // GitHub's issues.listForRepo API returns both issues and PRs, so we filter out PRs
  // to ensure we only generate alerts for genuine issues.

  try {
    // Fetch filtered issues
    const issues = await fetchFilteredIssues(owner, repo);

    // Pre-load all project data once for performance optimization
    console.log('  Pre-loading project data (createdAt-filtered)...');
    const allProjectIssues = await getAllProjectIssues(owner, repo);
    console.log(`  Found ${allProjectIssues.size} issues in projects (createdAt-filtered)`);

    // Pre-load project field values for filtered issues only
    console.log('  Pre-loading project field values for filtered issues...');
    const projectFieldValues = await getAllProjectFieldValues(
      owner,
      repo,
      issues.map((issue) => issue.number)
    );
    console.log(`  Loaded field values for ${projectFieldValues.size} issues`);

    const useBatchLlm =
      options?.isScheduledRun === true && isOpenAILlmEnabled() && isOpenAIScheduledLlmBatchMode();

    let batchResponses: Map<string, string> | undefined;
    if (useBatchLlm) {
      const forBatch = collectProcessableIssuesForBatch(issues);
      const batchLines = [];
      for (const issue of forBatch) {
        const body = issue.body || '';
        batchLines.push(
          buildChatCompletionBatchLine(
            issueTemplateBatchId(owner, repo, issue.number),
            buildIssueTemplatePrompt(issue.title, body)
          ),
          buildChatCompletionBatchLine(
            issueClarityBatchId(owner, repo, issue.number),
            buildIssueClarityPrompt(issue.title, body)
          )
        );
      }
      if (batchLines.length > 0) {
        console.log(`  OpenAI Batch (issues): ${batchLines.length} chat completions for ${owner}/${repo}`);
        batchResponses = await runChatCompletionsBatch(batchLines);
        console.log(`  OpenAI Batch (issues): received ${batchResponses.size} responses`);
      }
    }

    // Process each issue
    for (let i = 0; i < issues.length; i++) {
      const issue = issues[i];

      // Double-check: ensure this is actually an issue, not a PR
      if (issue.pull_request) {
        console.log(`?? Skipping PR #${issue.number} - this should not happen after filtering`);
        continue;
      }

      // Skip issues with specific labels (these issues don't have SP/deadlines or are out of scope)
      const skipLabels = ['parent', 'bug'];
      const hasSkipLabel = (issue.labels ?? []).some((label) =>
        skipLabels.includes(String(label.name || '').toLowerCase())
      );
      if (hasSkipLabel) {
        console.log(`  Skipping issue #${issue.number} - has skip label (${skipLabels.join(', ')})`);
        continue;
      }

      console.log(`  Processing issue #${issue.number} (${i + 1}/${issues.length})`);

      // Report progress to callback
      if (onProgress) {
        onProgress(i + 1, issues.length);
      }

      // Get project field values for this issue
      const projectValues = projectFieldValues.get(issue.number) || {};

      // Run all validations
      const assignmentAlert = validateAssignment(issue, owner, repo);
      if (assignmentAlert) alerts.push(assignmentAlert);

      const storyPointAlerts = validateStoryPoints(issue, owner, repo, projectValues);
      alerts.push(...storyPointAlerts);

      const endDateAlerts = validateEndDates(issue, owner, repo, projectValues);
      alerts.push(...endDateAlerts);

      const isInProject = allProjectIssues.has(issue.number);
      const projectAlert = validateProjectMembership(issue, owner, repo, isInProject);
      if (projectAlert) alerts.push(projectAlert);

      const body = issue.body || '';
      const hasBody = body.trim().length > 0;
      const tplKey = issueTemplateBatchId(owner, repo, issue.number);
      const clrKey = issueClarityBatchId(owner, repo, issue.number);

      const templateOpts =
        useBatchLlm && hasBody && batchResponses?.has(tplKey)
          ? { prefetchedAssistantText: batchResponses.get(tplKey)! }
          : undefined;

      const clarityOpts =
        useBatchLlm && hasBody && batchResponses?.has(clrKey)
          ? { prefetchedAssistantText: batchResponses.get(clrKey)! }
          : undefined;

      const templateDetection = await detectTemplateOnlyIssue(issue.title, body, templateOpts);
      const clarityDetection = await detectUnclearInstructions(issue.title, body, clarityOpts);

      const contentAlerts = validateContentQuality(
        issue,
        owner,
        repo,
        templateDetection,
        clarityDetection
      );
      alerts.push(...contentAlerts);
    }

    console.log(`  Found ${alerts.length} issue alerts for ${owner}/${repo}`);
  } catch (error) {
    console.error(`? Error checking issues for ${owner}/${repo}:`, error);
  }

  return { owner, repo, alerts };
}
