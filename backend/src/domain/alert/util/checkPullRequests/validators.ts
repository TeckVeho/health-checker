/**
 * Business rule validation logic for pull requests
 */
import { GitHubPullRequest, PullRequestAlertCandidate, LLMAnalysisResult } from './types';
import { analyzePRWithLLM } from './llm';

/**
 * Create an alert candidate with common fields
 */
function createAlert(
  pr: GitHubPullRequest,
  owner: string,
  repo: string,
  checkType: string,
  description: string,
  severity: 'low' | 'middle' | 'high'
): PullRequestAlertCandidate {
  return {
    owner,
    repo,
    checkType,
    title: `pr:${pr.number}`,
    description,
    severity,
    author: pr.user.login,
    filePath: '',
    lineNumber: -1,
    codeSnippet: '',
    branch: pr.head.ref,
    issueUrl: pr.html_url,
  };
}

/**
 * Validate PR quality and generate alerts
 */
export async function validatePRQuality(
  pr: GitHubPullRequest,
  owner: string,
  repo: string
): Promise<PullRequestAlertCandidate[]> {
  const alerts: PullRequestAlertCandidate[] = [];

  // Skip if PR body is empty
  if (!pr.body || pr.body.trim().length === 0) {
    return alerts;
  }

  try {
    // Analyze PR with LLM
    const analysis = await analyzePRWithLLM(pr);

    // Check for unclear changes
    if (analysis.unclearChanges) {
      const alert = createAlert(
        pr,
        owner,
        repo,
        'pr_unclear_changes',
        `PR changes are unclear: ${analysis.unclearReason || 'The description of changes is ambiguous'} PR#${pr.number}`,
        'middle'
      );
      alerts.push(alert);
    }

    // Check for missing evidence
    if (analysis.missingEvidence) {
      const alert = createAlert(
        pr,
        owner,
        repo,
        'pr_missing_evidence',
        `PR is missing evidence: ${analysis.missingEvidenceReason || 'Screenshots, test logs, verification results, or other evidence are not included'} PR#${pr.number}`,
        'middle'
      );
      alerts.push(alert);
    }
  } catch (error) {
    console.error(`❌ Error analyzing PR #${pr.number}:`, error);
    // Continue processing other PRs even if one fails
  }

  return alerts;
}
