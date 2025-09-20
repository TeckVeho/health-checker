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
    { label: 'Issue', key: 'issue', tagSeverity: 'warning' },
    { label: 'Branch', key: 'branch', tagSeverity: 'danger' },
    { label: 'Security', key: 'security', tagSeverity: 'danger' },
    { label: 'Test/Performance', key: 'test_performance', tagSeverity: 'info' },
  ],
  CHECK_TYPE_MAPPING: {
    issue: [
      'issue_unclear_instruction',
      'issue_template_only', 
      'issue_missing_end_date',
      'issue_missing_sp',
      'issue_large_sp',
      'issue_not_in_project',
      'issue_format_violation'
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
    test_performance: [
      'no_unit_test_ci',
      'performance_issue',
      'pull_request_format_violation'
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
    expect(row.issue).toBe(2) // issue_missing_sp
    expect(row.branch).toBe(8) // default_branch_violation + branch_protect_rule_violation
    expect(row.security).toBe(1) // exposed_secret_key
    expect(row.test_performance).toBe(1) // no_unit_test_ci
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
    expect(row.issue).toBe(0)
    expect(row.branch).toBe(0)
    expect(row.security).toBe(0)
    expect(row.test_performance).toBe(0)
    expect(row.totalViolations).toBe(0)
  })

  it('should handle all issue types in the Issue category', () => {
    const mockRepos = [
      { owner: 'testowner', name: 'testrepo', lastActivityAt: '2023-01-01' }
    ]
    const mockAlertSummary = {
      'testowner/testrepo': {
        'issue_unclear_instruction': 1,
        'issue_template_only': 2,
        'issue_missing_end_date': 1,
        'issue_missing_sp': 3,
        'issue_large_sp': 1,
        'issue_not_in_project': 2,
        'issue_format_violation': 1
      }
    }

    mockSharedState.repos.value = mockRepos
    mockSharedState.alertSummaryByCheckType.value = mockAlertSummary

    const { tableData } = useCheckTypeAlerts()
    
    expect(tableData.value).toHaveLength(1)
    const row = tableData.value[0]
    
    // All issue types should be grouped into the 'issue' category
    expect(row.issue).toBe(11) // 1+2+1+3+1+2+1 = 11
    expect(row.branch).toBe(0)
    expect(row.security).toBe(0)
    expect(row.test_performance).toBe(0)
    expect(row.totalViolations).toBe(11)
  })

  it('should call fetchAlertSummaryByCheckType when fetching data', async () => {
    const { fetchData } = useCheckTypeAlerts()
    
    await fetchData()
    
    expect(mockSharedState.fetchRepos).toHaveBeenCalled()
    expect(mockSharedState.fetchAlertSummaryByCheckType).toHaveBeenCalled()
  })
}) 