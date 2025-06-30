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
  default_branch_violation: 'Default Branch Violation',
  branch_name_violation: 'Branch Name Violation',
  branch_protect_rule_violation: 'Branch Protect Rule Violation',
  exposed_secret_key: 'Exposed Secret Key',
  issue_format_violation: 'Issue Format Violation',
  pull_request_format_violation: 'Pull Request Format Violation',
  no_unit_test_ci: 'No Unit Test CI',
  security_risk: 'Security Risk',
  performance_issue: 'Performance Issue',
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