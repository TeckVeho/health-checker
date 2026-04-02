/**
 * Type definitions for PR check functionality
 */

export interface GitHubPullRequest {
  number: number;
  title: string;
  body: string | null;
  user: {
    login: string;
  };
  head: {
    ref: string;
  };
  html_url: string;
  created_at: string;
  updated_at: string;
  /** REST API `state` — required for open-only checks when mixing open + closed PR lists */
  state: 'open' | 'closed';
}

export interface PullRequestAlertCandidate {
  owner: string;
  repo: string;
  checkType: string;
  title: string;
  description: string;
  severity: 'low' | 'middle' | 'high';
  author: string;
  filePath: string;
  lineNumber: number;
  codeSnippet: string;
  branch: string;
  issueUrl: string;
}

export interface CheckPullRequestsResult {
  owner: string;
  repo: string;
  alerts: PullRequestAlertCandidate[];
}

/** Options for `checkPullRequests` */
export interface CheckPullRequestsOptions {
  /** When true, include recently closed PRs and run `pr_issue_not_linked` (scheduled/cron runs only). */
  isScheduledRun?: boolean;
}

export interface LLMAnalysisResult {
  unclearChanges: boolean;
  missingEvidence: boolean;
  unclearReason?: string;
  missingEvidenceReason?: string;
}


