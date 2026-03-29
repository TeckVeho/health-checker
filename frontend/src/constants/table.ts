// Table column definitions
export const SEVERITY_COLUMNS = [
  { label: 'High', key: 'high', tagSeverity: 'danger' },
  { label: 'Middle', key: 'middle', tagSeverity: 'warning' },
  { label: 'Low', key: 'low', tagSeverity: 'info' },
] as const;

// Check Type Columns based on checkTypeLabels
export const CHECK_TYPE_COLUMNS = [
  // Issue Date category - date-related issues
  { label: 'Date', key: 'date', tagSeverity: 'warning' },

  // Issue SP category - story point related issues
  { label: 'SP', key: 'sp', tagSeverity: 'warning' },

  // Issue Assign category - assignment related issues
  { label: 'Assign', key: 'assign', tagSeverity: 'warning' },

  // Issue Body category - content quality related issues
  { label: 'Body', key: 'body', tagSeverity: 'warning' },

  // Issue Project category - project membership related issues
  { label: 'Project', key: 'project', tagSeverity: 'warning' },

  // Branch category - branch-related violations
  { label: 'Branch', key: 'branch', tagSeverity: 'danger' },

  // Security category - security-related issues
  { label: 'Security', key: 'security', tagSeverity: 'danger' },

  // PR category - pull request related issues
  { label: 'PR', key: 'pr', tagSeverity: 'info' },

  // PR ↔ issue link (scheduled check only)
  { label: 'Not Linked PR', key: 'notLinkedPr', tagSeverity: 'info' },

  // Test/Performance category - testing and performance issues
  { label: 'Test', key: 'test', tagSeverity: 'info' },
] as const;

// Individual check types for detailed mapping
export const CHECK_TYPE_MAPPING = {
  // Issue Date category
  date: [
    'issue_missing_end_date',
    'issue_expired_end_date',
  ],

  // Issue SP category
  sp: [
    'issue_missing_sp',
    'issue_large_sp',
  ],

  // Issue Assign category
  assign: [
    'issue_unassigned',
  ],

  // Issue Body category
  body: [
    'issue_template_only',
    'issue_unclear_instruction',
    'issue_format_violation',
  ],

  // Issue Project category
  project: [
    'issue_not_in_project',
  ],

  // Branch category
  branch: [
    'default_branch_violation',
    'branch_name_violation',
    'branch_protect_rule_violation',
    'branch_approval_rule_violation',
  ],

  // Security category
  security: ['exposed_secret_key', 'security_risk', 'package_vulnerability'],

  // PR category
  pr: [
    'pull_request_format_violation',
    'pr_missing_evidence',
    'pr_unclear_changes',
    'pr_review_workflow_missing',
  ],

  notLinkedPr: ['pr_issue_not_linked'],

  // Test/Performance category
  test: [
    'no_unit_test_ci',
    'performance_issue',
    'release_labeling_workflow_missing',
  ],
} as const;

// Field mapping for backend sorting
export const FIELD_MAPPING = {
  lastActivityAt: 'last_activity_at',
  name: 'name',
  owner: 'owner',
  description: 'description',
  createdAt: 'created_at',
} as const;

// Numeric fields for sorting
export const NUMERIC_FIELDS = [
  'totalViolations',
  'high',
  'middle',
  'low',
] as const;

// Date fields for sorting
export const DATE_FIELDS = ['lastActivityAt', 'createdAt'] as const;

// String fields for sorting
export const STRING_FIELDS = ['name', 'owner', 'description'] as const;

// Default sort configuration
export const DEFAULT_SORT = {
  field: 'totalViolations',
  order: 'desc' as const,
};

// Filter threshold (days)
export const FILTER_THRESHOLD_DAYS = 14;

// Table configuration
export const TABLE_CONFIG = {
  defaultLimit: 200,
  sortField: 'last_activity_at',
  retryAttempts: 3,
  retryDelay: 1000,
} as const;
