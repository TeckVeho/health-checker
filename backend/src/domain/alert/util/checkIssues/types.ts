/**
 * Shared types for the checkIssues module
 */

// Public API interfaces - must maintain exact compatibility
export interface IssueAlertCandidate {
  owner: string;
  repo: string;
  checkType: string;
  title: string;
  description: string;
  severity: string;
  author?: string | null;
  filePath: string;
  lineNumber: number;
  codeSnippet: string;
  branch: string;
  issueUrl: string;
}

export interface CheckIssuesResult {
  owner: string;
  repo: string;
  alerts: IssueAlertCandidate[];
}

// Internal types for module communication
export interface GitHubIssue {
  id: number;
  // eslint-disable-next-line @typescript-eslint/naming-convention
  node_id: string;
  number: number;
  title: string;
  body: string | null;
  // eslint-disable-next-line @typescript-eslint/naming-convention
  html_url: string;
  // eslint-disable-next-line @typescript-eslint/naming-convention
  created_at: string;
  // eslint-disable-next-line @typescript-eslint/naming-convention
  updated_at: string;
  assignees: Array<{ login: string }>;
  labels: Array<{ name: string }>;
  state: 'open' | 'closed';
  assignee?: { login: string } | null;
  // eslint-disable-next-line @typescript-eslint/naming-convention
  pull_request?: any;
  user?: {
    login: string;
    name?: string | null;
    type: string;
  } | null;
}

export interface ProjectItemFieldValue {
  sp?: number;
  endDate?: Date;
}

export interface LLMAnalysisResult {
  result: boolean;
  reason: string;
}

// Constants
export const CREATED_SINCE_ISO = '2025-08-17T00:00:00Z';
export const CREATED_SINCE = new Date(CREATED_SINCE_ISO);