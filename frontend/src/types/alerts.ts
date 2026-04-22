// Alert Types
export interface Alert {
  id: string;
  checkType: string;
  severity: 'high' | 'middle' | 'low';
  message: string;
  title?: string;
  description?: string;
  filePath?: string;
  lineNumber?: number;
  branch?: string;
  codeSnippet?: string;
  notes?: string;
  lastDetectedAt: string;
  createdAt: string;
  isIgnored: boolean;
  systemResolved: boolean;
  [key: string]: unknown;
}

export interface AlertsResponse {
  alerts: Alert[];
}

// Pagination Types
export interface PaginationInfo {
  current: number;
  total: number;
  items: number;
  from: number;
  to: number;
  pageSize: number;
}

export interface PaginationState {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
}

// Tab State Types
export interface TabState {
  sortField?: string;
  sortOrder?: 'asc' | 'desc';
  filters?: Record<string, unknown>;
  currentPage?: number;
  pageSize?: number;
}

export interface AlertsTabState {
  activeTab: 'active' | 'resolved';
  tabStates: {
    active: TabState;
    resolved: TabState;
  };
}

// API Response Types
export interface PaginatedAlertsResponse {
  data: Alert[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// Check Type Labels
export const checkTypeLabels: Record<string, string> = {
  // Issue-related types
  issue_unclear_instruction: 'Issue Unclear Instruction',
  issue_template_only: 'Issue Template Only',
  issue_missing_end_date: 'Issue Missing End Date',
  issue_expired_end_date: 'Issue Expired End Date',
  issue_missing_sp: 'Issue Missing Story Point',
  issue_large_sp: 'Issue Large Story Point',
  issue_not_in_project: 'Issue Not In Project',
  issue_format_violation: 'Issue Format Violation',
  issue_unassigned: 'Issue Unassigned',

  // Branch-related types
  default_branch_violation: 'Default Branch Violation',
  branch_name_violation: 'Branch Name Violation',
  branch_protect_rule_violation: 'Branch Protect Rule Violation',
  branch_approval_rule_violation: 'Branch Approval Rule Violation',

  // Security-related types
  exposed_secret_key: 'Exposed Secret Key',
  security_risk: 'Security Risk',
  package_vulnerability: 'Package Vulnerability',

  // Test/Performance-related types
  no_unit_test_ci: 'No Unit Test CI',
  performance_issue: 'Performance Issue',
  pull_request_format_violation: 'Pull Request Format Violation',
  pr_review_workflow_missing: 'PR Review Workflow Missing',
  release_labeling_workflow_missing: 'Release Labeling Workflow Missing',

  // PR quality / linkage
  pr_issue_not_linked: 'PR Not Linked to Issue',
  pr_missing_evidence: 'PR Missing Evidence',
  pr_unclear_changes: 'PR Unclear Changes',
  dependabot_open_pr: 'Dependabot Open PR',
};

// Component Props Types
export interface AlertTableProps {
  alerts: Alert[];
  checkTypeLabels: Record<string, string>;
  owner?: string;
  repo?: string;
  loading?: boolean;
  emptyMessage?: string;
  customClass?: string;
  tableClass?: string;
  tableType?: string;
  // Pagination props
  pagination?: PaginationState;
  showPagination?: boolean;
  onPageChange?: (page: number) => void;
}

export interface AlertsPageProps {
  owner?: string;
  repo?: string;
}

export interface AlertsTabContentProps {
  owner: string;
  repo: string;
  checkTypeLabels: Record<string, string>;
}
