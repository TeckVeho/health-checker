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
    { label: 'Default Branch Violation', key: 'default_branch_violation', tagSeverity: 'danger' },
    { label: 'Branch Name Violation', key: 'branch_name_violation', tagSeverity: 'warning' },
    { label: 'Branch Protect Rule Violation', key: 'branch_protect_rule_violation', tagSeverity: 'danger' },
    { label: 'Exposed Secret Key', key: 'exposed_secret_key', tagSeverity: 'danger' },
    { label: 'Issue Format Violation', key: 'issue_format_violation', tagSeverity: 'warning' },
    { label: 'Pull Request Format Violation', key: 'pull_request_format_violation', tagSeverity: 'warning' },
    { label: 'No Unit Test CI', key: 'no_unit_test_ci', tagSeverity: 'info' },
    { label: 'Security Risk', key: 'security_risk', tagSeverity: 'danger' },
    { label: 'Performance Issue', key: 'performance_issue', tagSeverity: 'warning' },
  ]
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
        'exposed_secret_key': 1
      }
    }

    mockSharedState.repos.value = mockRepos
    mockSharedState.alertSummaryByCheckType.value = mockAlertSummary

    const { tableData } = useCheckTypeAlerts()
    
    expect(tableData.value).toHaveLength(1)
    const row = tableData.value[0]
    expect(row.default_branch_violation).toBe(3)
    expect(row.branch_protect_rule_violation).toBe(5)
    expect(row.exposed_secret_key).toBe(1)
    expect(row.totalViolations).toBe(9) // 3 + 5 + 1
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
    expect(row.default_branch_violation).toBe(0)
    expect(row.totalViolations).toBe(0)
  })

  it('should call fetchAlertSummaryByCheckType when fetching data', async () => {
    const { fetchData } = useCheckTypeAlerts()
    
    await fetchData()
    
    expect(mockSharedState.fetchRepos).toHaveBeenCalled()
    expect(mockSharedState.fetchAlertSummaryByCheckType).toHaveBeenCalled()
  })
}) 