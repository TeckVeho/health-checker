// Table column definitions
export const SEVERITY_COLUMNS = [
  { label: 'High', key: 'high', tagSeverity: 'danger' },
  { label: 'Middle', key: 'middle', tagSeverity: 'warning' },
  { label: 'Low', key: 'low', tagSeverity: 'info' },
] as const

// Check Type Columns based on checkTypeLabels
export const CHECK_TYPE_COLUMNS = [
  { label: 'Default Branch Violation', key: 'default_branch_violation', tagSeverity: 'danger' },
  { label: 'Branch Name Violation', key: 'branch_name_violation', tagSeverity: 'warning' },
  { label: 'Branch Protect Rule Violation', key: 'branch_protect_rule_violation', tagSeverity: 'danger' },
  { label: 'Exposed Secret Key', key: 'exposed_secret_key', tagSeverity: 'danger' },
  { label: 'Issue Format Violation', key: 'issue_format_violation', tagSeverity: 'warning' },
  { label: 'Pull Request Format Violation', key: 'pull_request_format_violation', tagSeverity: 'warning' },
  { label: 'No Unit Test CI', key: 'no_unit_test_ci', tagSeverity: 'info' },
  { label: 'Security Risk', key: 'security_risk', tagSeverity: 'danger' },
  { label: 'Performance Issue', key: 'performance_issue', tagSeverity: 'warning' },
] as const

// Field mapping for backend sorting
export const FIELD_MAPPING = {
  'lastActivityAt': 'last_activity_at',
  'name': 'name',
  'owner': 'owner',
  'description': 'description',
  'createdAt': 'created_at',
} as const

// Numeric fields for sorting
export const NUMERIC_FIELDS = [
  'totalViolations',
  'high',
  'middle',
  'low'
] as const

// Date fields for sorting
export const DATE_FIELDS = [
  'lastActivityAt',
  'createdAt'
] as const

// String fields for sorting
export const STRING_FIELDS = [
  'name',
  'owner',
  'description'
] as const

// Default sort configuration
export const DEFAULT_SORT = {
  field: 'lastActivityAt',
  order: 'desc' as const
}

// Filter threshold (days)
export const FILTER_THRESHOLD_DAYS = 14

// Table configuration
export const TABLE_CONFIG = {
  defaultLimit: 200,
  sortField: 'last_activity_at',
  retryAttempts: 3,
  retryDelay: 1000,
} as const 