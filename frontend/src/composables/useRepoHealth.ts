import { ref, computed, watch } from 'vue'
import { apiService, type Repo, type AlertSummary } from '~/utils/api'
import { useApi } from './useApi'
import { useApiConfig } from './useApiConfig'

const columns = [
  { label: 'High', key: 'high', tagSeverity: 'danger' },
  { label: 'Middle', key: 'middle', tagSeverity: 'warning' },
  { label: 'Low', key: 'low', tagSeverity: 'info' },
]

export function useRepoHealth() {
  const { loading, error, callApi } = useApi()
  const { apiBaseUrl } = useApiConfig()

  // Initialize API service with correct base URL
  apiService.init(apiBaseUrl)

  const repos = ref<Repo[]>([])
  const health = ref<AlertSummary>({})
  const showOnlyActive = ref(true)
  
  // Cache the threshold date to avoid redundant computations
  const thresholdDate = ref<Date | null>(null)
  
  // Update threshold when showOnlyActive changes
  const updateThreshold = () => {
    if (showOnlyActive.value) {
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
  watch(showOnlyActive, updateThreshold, { immediate: true })

  const filteredTableData = computed(() => {
    if (!showOnlyActive.value) return tableData.value

    // Use cached threshold date
    if (!thresholdDate.value) {
      updateThreshold()
    }

    return tableData.value.filter((repo) => {
      const lastActivity = new Date(repo.lastActivityAt)
      return !isNaN(lastActivity.getTime()) && lastActivity >= thresholdDate.value!
    })
  })

  async function fetchData() {
    // Fetch repos
    const repoData = await callApi(
      () => apiService.getRepos(200, 'last_activity_at'),
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
    showOnlyActive,
    tableData,
    filteredTableData,
    loading,
    error,
    fetchData,
  }
}