/**
 * Business rule validation logic for pull requests
 */
import { GitHubPullRequest, PullRequestAlertCandidate } from './types';
import { analyzePRWithLLM } from './llm';
import { prHasLinkedIssuePerPolicy } from './github';

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
    issueUrl: pr.htmlUrl,
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

/** 作成者 login に `dependabot` を含む（大小無視） */
export function isDependabotAuthor(pr: GitHubPullRequest): boolean {
  return pr.user.login.toLowerCase().includes('dependabot');
}

/** pr_issue_not_linked から除外する Dependabot 系 PR（タイトル・作者） */
function shouldSkipPrIssueNotLinkedForDependabot(pr: GitHubPullRequest): boolean {
  if (pr.title.toLowerCase().includes('dependabot')) {
    return true;
  }
  return isDependabotAuthor(pr);
}

/**
 * オープンかつ Dependabot 作成の PR を 1 PR あたり 1 アラートにする（定期・手動の両方）
 */
export function validateDependabotOpenPr(
  pr: GitHubPullRequest,
  owner: string,
  repo: string
): PullRequestAlertCandidate[] {
  if (pr.state !== 'open') {
    return [];
  }
  if (!isDependabotAuthor(pr)) {
    return [];
  }
  return [
    createAlert(
      pr,
      owner,
      repo,
      'dependabot_open_pr',
      `Open Dependabot PR pending merge/review PR#${pr.number}`,
      'low'
    ),
  ];
}

/**
 * PR に Linked issues（closing references）が1件も無い場合にアラート
 */
export async function validatePrIssueLinked(
  pr: GitHubPullRequest,
  owner: string,
  repo: string
): Promise<PullRequestAlertCandidate[]> {
  const alerts: PullRequestAlertCandidate[] = [];
  if (shouldSkipPrIssueNotLinkedForDependabot(pr)) {
    return alerts;
  }
  try {
    const satisfiesPolicy = await prHasLinkedIssuePerPolicy(owner, repo, pr.number, pr.body);
    if (!satisfiesPolicy) {
      alerts.push(
        createAlert(
          pr,
          owner,
          repo,
          'pr_issue_not_linked',
          `PR has no linked issues (same criteria as PR policy workflow: GraphQL links or closing keywords in body) PR#${pr.number}`,
          'middle'
        )
      );
    }
  } catch (error) {
    console.error(`❌ Error checking linked issues for PR #${pr.number}:`, error);
  }
  return alerts;
}
