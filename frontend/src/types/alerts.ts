// Alert Types
export interface Alert {
  id: string
  checkType: string
  severity: 'high' | 'middle' | 'low'
  message: string
  title?: string
  description?: string
  filePath?: string
  lineNumber?: number
  branch?: string
  codeSnippet?: string
  notes?: string
  lastDetectedAt: string
  createdAt: string
  isIgnored: boolean
  systemResolved: boolean
  [key: string]: any
}

export interface AlertsResponse {
  alerts: Alert[]
}

// Check Type Labels
export const checkTypeLabels: Record<string, string> = {
  // Issue-related types
  issue_unclear_instruction: 'Issue Unclear Instruction',
  issue_template_only: 'Issue Template Only',
  issue_missing_end_date: 'Issue Missing End Date',
  issue_missing_sp: 'Issue Missing Story Point',
  issue_large_sp: 'Issue Large Story Point',
  issue_not_in_project: 'Issue Not In Project',
  issue_format_violation: 'Issue Format Violation',
  
  // Branch-related types
  default_branch_violation: 'Default Branch Violation',
  branch_name_violation: 'Branch Name Violation',
  branch_protect_rule_violation: 'Branch Protect Rule Violation',
  
  // Security-related types
  exposed_secret_key: 'Exposed Secret Key',
  security_risk: 'Security Risk',
  
  // Test/Performance-related types
  no_unit_test_ci: 'No Unit Test CI',
  performance_issue: 'Performance Issue',
  pull_request_format_violation: 'Pull Request Format Violation',
}

// Component Props Types
export interface AlertTableProps {
  alerts: Alert[]
  checkTypeLabels: Record<string, string>
  owner?: string
  repo?: string
}

export interface AlertsPageProps {
  owner?: string
  repo?: string
} 