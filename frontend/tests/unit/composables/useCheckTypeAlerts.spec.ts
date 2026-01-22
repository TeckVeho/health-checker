import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useCheckTypeAlerts } from '@/composables/useCheckTypeAlerts'

// Mock all the composables to avoid Nuxt runtime dependencies
vi.mock('@/composables/useSharedState', () => ({
  useSharedState: vi.fn()
}))

vi.mock('@/composables/useCheckTypeSortState', () => ({
  useCheckTypeSortState: vi.fn()
}))

vi.mock('@/composables/useFilterState', () => ({
  useFilterState: vi.fn()
}))

// Mock the constants
vi.mock('@/constants/table', () => ({
  CHECK_TYPE_COLUMNS: [
    { label: 'Date', key: 'date', tagSeverity: 'warning' },
    { label: 'SP', key: 'sp', tagSeverity: 'warning' },
    { label: 'Assign', key: 'assign', tagSeverity: 'warning' },
    { label: 'Body', key: 'body', tagSeverity: 'warning' },
    { label: 'Project', key: 'project', tagSeverity: 'warning' },
    { label: 'Branch', key: 'branch', tagSeverity: 'danger' },
    { label: 'Security', key: 'security', tagSeverity: 'danger' },
    { label: 'PR', key: 'pr', tagSeverity: 'info' },
    { label: 'Test', key: 'test', tagSeverity: 'info' },
  ],
  CHECK_TYPE_MAPPING: {
    date: [
      'issue_missing_end_date',
      'issue_expired_end_date'
    ],
    sp: [
      'issue_missing_sp',
      'issue_large_sp'
    ],
    assign: [
      'issue_unassigned'
    ],
    body: [
      'issue_template_only',
      'issue_unclear_instruction',
      'issue_format_violation'
    ],
    project: [
      'issue_not_in_project'
    ],
    branch: [
      'default_branch_violation',
      'branch_name_violation',
      'branch_protect_rule_violation'
    ],
    security: [
      'exposed_secret_key',
      'security_risk'
    ],
    pr: [
      'pull_request_format_violation'
    ],
    test: [
      'no_unit_test_ci',
      'performance_issue',
      'release_labeling_workflow_missing'
    ]
  }
}))

describe('useCheckTypeAlerts', () => {
  const mockSharedState = {
    repos: { value: [] as any[] },
    alertSummaryByCheckType: { value: {} as Record<string, any> },
    loading: { value: false },
    error: { value: null },
    thresholdDate: { value: null },
    updateThreshold: vi.fn(),
    fetchRepos: vi.fn(),
    fetchAlertSummaryByCheckType: vi.fn(),
    mapFieldToBackend: vi.fn(),
  }

  const mockSortState = {
    sortState: { value: { field: null, order: 'asc' } },
    updateSortState: vi.fn(),
  }

  const mockFilterState = {
    filterState: { value: { showOnlyActive: false } },
    updateShowOnlyActive: vi.fn(),
    toggleShowOnlyActive: vi.fn(),
  }

  beforeEach(async () => {
    vi.clearAllMocks()
    
    // Mock the composable functions
    const { useSharedState } = await import('@/composables/useSharedState')
    const { useCheckTypeSortState } = await import('@/composables/useCheckTypeSortState')
    const { useFilterState } = await import('@/composables/useFilterState')
    
    ;(useSharedState as any).mockReturnValue(mockSharedState)
    ;(useCheckTypeSortState as any).mockReturnValue(mockSortState)
    ;(useFilterState as any).mockReturnValue(mockFilterState)
  })

  it('should return check type columns', () => {
    const { columns } = useCheckTypeAlerts()
    
    expect(columns).toBeDefined()
    expect(columns.length).toBeGreaterThan(0)
    expect(columns[0]).toHaveProperty('label')
    expect(columns[0]).toHaveProperty('key')
    expect(columns[0]).toHaveProperty('tagSeverity')
  })

  it('should map check type data to table rows', () => {
    const mockRepos = [
      { owner: 'testowner', name: 'testrepo', lastActivityAt: '2023-01-01' }
    ]
    const mockAlertSummary = {
      'testowner/testrepo': {
        'default_branch_violation': 3,
        'branch_protect_rule_violation': 5,
        'exposed_secret_key': 1,
        'issue_missing_sp': 2,
        'no_unit_test_ci': 1
      }
    }

    mockSharedState.repos.value = mockRepos
    mockSharedState.alertSummaryByCheckType.value = mockAlertSummary

    const { tableData } = useCheckTypeAlerts()
    
    expect(tableData.value).toHaveLength(1)
    const row = tableData.value[0]
    
    // Check grouped categories
    expect(row.sp).toBe(2) // issue_missing_sp
    expect(row.branch).toBe(8) // default_branch_violation + branch_protect_rule_violation
    expect(row.security).toBe(1) // exposed_secret_key
    expect(row.test).toBe(1) // no_unit_test_ci
    expect(row.totalViolations).toBe(12) // 2 + 8 + 1 + 1
  })

  it('should handle empty alert summary data', () => {
    const mockRepos = [
      { owner: 'testowner', name: 'testrepo', lastActivityAt: '2023-01-01' }
    ]

    mockSharedState.repos.value = mockRepos
    mockSharedState.alertSummaryByCheckType.value = {}

    const { tableData } = useCheckTypeAlerts()
    
    expect(tableData.value).toHaveLength(1)
    const row = tableData.value[0]
    expect(row.date).toBe(0)
    expect(row.sp).toBe(0)
    expect(row.assign).toBe(0)
    expect(row.body).toBe(0)
    expect(row.project).toBe(0)
    expect(row.branch).toBe(0)
    expect(row.security).toBe(0)
    expect(row.pr).toBe(0)
    expect(row.test).toBe(0)
    expect(row.totalViolations).toBe(0)
  })

  it('should handle all issue types in the new categories', () => {
    const mockRepos = [
      { owner: 'testowner', name: 'testrepo', lastActivityAt: '2023-01-01' }
    ]
    const mockAlertSummary = {
      'testowner/testrepo': {
        'issue_unclear_instruction': 1,
        'issue_template_only': 2,
        'issue_missing_end_date': 1,
        'issue_expired_end_date': 1,
        'issue_missing_sp': 3,
        'issue_large_sp': 1,
        'issue_unassigned': 1,
        'issue_not_in_project': 2,
        'issue_format_violation': 1
      }
    }

    mockSharedState.repos.value = mockRepos
    mockSharedState.alertSummaryByCheckType.value = mockAlertSummary

    const { tableData } = useCheckTypeAlerts()
    
    expect(tableData.value).toHaveLength(1)
    const row = tableData.value[0]
    
    // Check that issue types are grouped into the new categories
    expect(row.date).toBe(2) // issue_missing_end_date + issue_expired_end_date
    expect(row.sp).toBe(4) // issue_missing_sp + issue_large_sp
    expect(row.assign).toBe(1) // issue_unassigned
    expect(row.body).toBe(4) // issue_unclear_instruction + issue_template_only + issue_format_violation
    expect(row.project).toBe(2) // issue_not_in_project
    expect(row.branch).toBe(0)
    expect(row.security).toBe(0)
    expect(row.pr).toBe(0)
    expect(row.test).toBe(0)
    expect(row.totalViolations).toBe(13) // 2+4+1+4+2 = 13
  })

  it('should call fetchAlertSummaryByCheckType when fetching data', async () => {
    const { fetchData } = useCheckTypeAlerts()
    
    await fetchData()
    
    expect(mockSharedState.fetchRepos).toHaveBeenCalled()
    expect(mockSharedState.fetchAlertSummaryByCheckType).toHaveBeenCalled()
  })
}) 