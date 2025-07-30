import { computed, watch } from 'vue'
import { useCheckTypeSortState } from './useCheckTypeSortState'
import { useFilterState } from './useFilterState'
import { useSharedState } from './useSharedState'
import { CHECK_TYPE_COLUMNS } from '../constants/table'

export function useCheckTypeAlerts() {
  const { sortState, updateSortState } = useCheckTypeSortState()
  const { filterState, updateShowOnlyActive, toggleShowOnlyActive } = useFilterState()
  const sharedState = useSharedState()

  // Update threshold when showOnlyActive changes
  const updateThreshold = () => {
    sharedState.updateThreshold(filterState.value.showOnlyActive)
  }

  // Watch for changes in showOnlyActive to update threshold
  watch(() => filterState.value.showOnlyActive, updateThreshold, { immediate: true })

  const tableData = computed(() => {
    // Show all repositories, not just those with alerts
    return sharedState.repos.value.map((repo) => {
      const fullName = `${repo.owner}/${repo.name}`
      const summaryData = sharedState.alertSummaryByCheckType.value[fullName] || {}

      const row = { ...repo }
      let total = 0
      
      // Map check type data to columns
      CHECK_TYPE_COLUMNS.forEach((col) => {
        (row as any)[col.key] = summaryData[col.key] || 0
        total += (row as any)[col.key] || 0
      })
      
      // Calculate total
      row.totalViolations = total
      return row
    })
  })

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

  const sortedTableData = computed(() => {
    const data = [...filteredTableData.value]
    const { field, order } = sortState.value

    if (!field) return data

    data.sort((a, b) => {
      let aVal = a[field]
      let bVal = b[field]

      // Handle date sorting
      if (field === 'lastActivityAt' || field === 'createdAt') {
        aVal = aVal ? new Date(aVal).getTime() : 0
        bVal = bVal ? new Date(bVal).getTime() : 0
      }

      // Handle numeric sorting for violation counts
      if (['totalViolations', ...CHECK_TYPE_COLUMNS.map(col => col.key)].includes(field)) {
        aVal = Number(aVal) || 0
        bVal = Number(bVal) || 0
      }

      // Handle string sorting
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        aVal = aVal.toLowerCase()
        bVal = bVal.toLowerCase()
      }

      if (aVal < bVal) return order === 'asc' ? -1 : 1
      if (aVal > bVal) return order === 'asc' ? 1 : -1
      return 0
    })

    return data
  })



  async function fetchData() {
    const currentField = sortState.value.field
    const backendField = sharedState.mapFieldToBackend(currentField)
    
    await sharedState.fetchRepos(backendField)
    await sharedState.fetchAlertSummaryByCheckType()
  }

  return {
    columns: CHECK_TYPE_COLUMNS,
    repos: sharedState.repos,
    reposWithAlerts: sharedState.repos, // Changed to show all repos
    alertSummary: sharedState.alertSummaryByCheckType,
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