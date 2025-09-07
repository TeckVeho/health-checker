// Table column definitions
export const SEVERITY_COLUMNS = [
  { label: 'High', key: 'high', tagSeverity: 'danger' },
  { label: 'Middle', key: 'middle', tagSeverity: 'warning' },
  { label: 'Low', key: 'low', tagSeverity: 'info' },
] as const

// Check Type Columns based on checkTypeLabels
export const CHECK_TYPE_COLUMNS = [
  // Issue category - grouped issue-related alert types
  { label: 'Issue', key: 'issue', tagSeverity: 'warning' },
  
  // Branch category - branch-related violations
  { label: 'Branch', key: 'branch', tagSeverity: 'danger' },
  
  // Security category - security-related issues
  { label: 'Security', key: 'security', tagSeverity: 'danger' },
  
  // Test/Performance category - testing and performance issues
  { label: 'Test/Performance', key: 'test_performance', tagSeverity: 'info' },
] as const

// Individual check types for detailed mapping
export const CHECK_TYPE_MAPPING = {
  // Issue category
  issue: [
    'issue_unclear_instruction',
    'issue_template_only', 
    'issue_missing_end_date',
    'issue_expired_end_date',
    'issue_missing_sp',
    'issue_large_sp',
    'issue_not_in_project',
    'issue_format_violation',
    'issue_unassigned'
  ],
  
  // Branch category
  branch: [
    'default_branch_violation',
    'branch_name_violation',
    'branch_protect_rule_violation'
  ],
  
  // Security category
  security: [
    'exposed_secret_key',
    'security_risk'
  ],
  
  // Test/Performance category
  test_performance: [
    'no_unit_test_ci',
    'performance_issue',
    'pull_request_format_violation'
  ]
} as const

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