import { computed, watch } from 'vue'
import { useSortState } from './useSortState'
import { useFilterState } from './useFilterState'
import { useSharedState } from './useSharedState'
import { SEVERITY_COLUMNS } from '../constants/table'

export function useRepoHealth() {
  const { sortState, updateSortState } = useSortState()
  const { filterState, updateShowOnlyActive, toggleShowOnlyActive } = useFilterState()
  const sharedState = useSharedState()

  // Update threshold when showOnlyActive changes
  const updateThreshold = () => {
    sharedState.updateThreshold(filterState.value.showOnlyActive)
  }

  const tableData = computed(() =>
    sharedState.repos.value.map((repo) => {
      const fullName = `${repo.owner}/${repo.name}`
      const healthData = sharedState.alertSummary.value[fullName] || {}

      const row = { ...repo }
      let total = 0
      for (const col of SEVERITY_COLUMNS) {
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
    if (!sharedState.thresholdDate.value) {
      updateThreshold()
    }

    return tableData.value.filter((repo) => {
      const lastActivity = new Date(repo.lastActivityAt)
      return !isNaN(lastActivity.getTime()) && lastActivity >= sharedState.thresholdDate.value!
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

  async function fetchData() {
    const currentField = sortState.value.field
    const backendField = sharedState.mapFieldToBackend(currentField)
    
    await sharedState.fetchRepos(backendField)
    await sharedState.fetchAlertSummary()
  }

  return {
    columns: SEVERITY_COLUMNS,
    repos: sharedState.repos,
    health: sharedState.alertSummary,
    showOnlyActive: computed(() => filterState.value.showOnlyActive),
    tableData,
    filteredTableData,
    sortedTableData,
    loading: sharedState.loading,
    error: sharedState.error,
    fetchData,
    sortState,
    updateSortState,
    updateShowOnlyActive,
    toggleShowOnlyActive,
  }
}