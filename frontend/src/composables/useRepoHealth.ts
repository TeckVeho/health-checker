import { ref, computed, watch } from 'vue'
import { apiService, type Repo, type AlertSummary } from '~/utils/api'
import { useApi } from './useApi'
import { useApiConfig } from './useApiConfig'
import { useSortState } from './useSortState'
import { useFilterState } from './useFilterState'

const columns = [
  { label: 'High', key: 'high', tagSeverity: 'danger' },
  { label: 'Middle', key: 'middle', tagSeverity: 'warning' },
  { label: 'Low', key: 'low', tagSeverity: 'info' },
]

export function useRepoHealth() {
  const { loading, error, callApi } = useApi()
  const { apiBaseUrl } = useApiConfig()
  const { sortState, updateSortState } = useSortState()
  const { filterState, updateShowOnlyActive, toggleShowOnlyActive } = useFilterState()

  // Initialize API service with correct base URL
  apiService.init(apiBaseUrl)

  const repos = ref<Repo[]>([])
  const health = ref<AlertSummary>({})
  
  // Cache the threshold date to avoid redundant computations
  const thresholdDate = ref<Date | null>(null)
  
  // Update threshold when showOnlyActive changes
  const updateThreshold = () => {
    if (filterState.value.showOnlyActive) {
      const threshold = new Date()
      threshold.setDate(threshold.getDate() - 14)
      thresholdDate.value = threshold
    } else {
      thresholdDate.value = null
    }
  }

  const tableData = computed(() =>
    repos.value.map((repo) => {
      const fullName = `${repo.owner}/${repo.name}`
      const healthData = health.value[fullName] || {}

      const row = { ...repo }
      let total = 0
      for (const col of columns) {
        const val = (healthData as any)[col.key] ?? 0
        row[col.key] = val
        total += val
      }
      row.totalViolations = total
      return row
    })
  )

  // Watch for changes in showOnlyActive to update threshold
  watch(() => filterState.value.showOnlyActive, updateThreshold, { immediate: true })

  const filteredTableData = computed(() => {
    if (!filterState.value.showOnlyActive) return tableData.value

    // Use cached threshold date
    if (!thresholdDate.value) {
      updateThreshold()
    }

    return tableData.value.filter((repo) => {
      const lastActivity = new Date(repo.lastActivityAt)
      return !isNaN(lastActivity.getTime()) && lastActivity >= thresholdDate.value!
    })
  })

  // Sort the filtered data based on the current sort state
  const sortedTableData = computed(() => {
    const data = filteredTableData.value
    const { field, order } = sortState.value

    return [...data].sort((a, b) => {
      let aValue = a[field]
      let bValue = b[field]

      // Handle special cases
      if (field === 'lastActivityAt') {
        aValue = new Date(aValue || 0).getTime()
        bValue = new Date(bValue || 0).getTime()
      } else if (field === 'name') {
        aValue = aValue?.toLowerCase() || ''
        bValue = bValue?.toLowerCase() || ''
      } else if (field === 'owner') {
        aValue = aValue?.toLowerCase() || ''
        bValue = bValue?.toLowerCase() || ''
      } else if (field === 'totalViolations' || field === 'high' || field === 'middle' || field === 'low') {
        aValue = Number(aValue) || 0
        bValue = Number(bValue) || 0
      } else {
        aValue = String(aValue || '').toLowerCase()
        bValue = String(bValue || '').toLowerCase()
      }

      if (order === 'asc') {
        return aValue > bValue ? 1 : aValue < bValue ? -1 : 0
      } else {
        return aValue < bValue ? 1 : aValue > bValue ? -1 : 0
      }
    })
  })

  // Map frontend field names to backend field names
  const mapFieldToBackend = (field: string): string => {
    const fieldMap: Record<string, string> = {
      'lastActivityAt': 'last_activity_at',
      'name': 'name',
      'owner': 'owner',
      'description': 'description',
      'createdAt': 'created_at',
      // For computed fields like totalViolations, high, middle, low, we don't send to backend
      // These will be sorted on the frontend only
    }
    return fieldMap[field] || 'last_activity_at' // default fallback
  }

  async function fetchData() {
    // Only send backend-sortable fields to the API
    const currentField = sortState.value.field
    const backendField = mapFieldToBackend(currentField)
    
    const repoData = await callApi(
      () => apiService.getRepos(200, backendField),
      { errorMessage: 'Failed to fetch repositories' }
    )
    
    if (repoData) {
      repos.value = repoData

      // Fetch alert summary
      const summaryData = await callApi(
        () => apiService.getAlertSummary(
          repos.value.map((r) => ({ owner: r.owner, repo: r.name }))
        ),
        { errorMessage: 'Failed to fetch alert summary' }
      )
      
      if (summaryData) {
        health.value = summaryData
      }
    }
  }

  return {
    columns,
    repos,
    health,
    showOnlyActive: computed(() => filterState.value.showOnlyActive),
    tableData,
    filteredTableData,
    sortedTableData,
    loading,
    error,
    fetchData,
    sortState,
    updateSortState,
    updateShowOnlyActive,
    toggleShowOnlyActive,
  }
}