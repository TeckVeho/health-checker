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

export interface LLMAnalysisResult {
  unclearChanges: boolean;
  missingEvidence: boolean;
  unclearReason?: string;
  missingEvidenceReason?: string;
}


