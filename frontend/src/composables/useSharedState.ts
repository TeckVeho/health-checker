import { ref, computed, readonly } from 'vue'
import { apiService, type Repo, type AlertSummary } from '~/utils/api'
import { useApi } from './useApi'
import { useApiConfig } from './useApiConfig'
import { FIELD_MAPPING, TABLE_CONFIG, FILTER_THRESHOLD_DAYS } from '../constants/table'

// Shared state singleton
let sharedStateInstance: ReturnType<typeof createSharedState> | null = null

function createSharedState() {
  const { callApi } = useApi()
  const { apiBaseUrl } = useApiConfig()

  // Initialize API service with correct base URL
  apiService.init(apiBaseUrl)

  // Shared repositories data
  const repos = ref<Repo[]>([])
  const alertSummary = ref<AlertSummary>({})
  const alertSummaryByCheckType = ref<AlertSummary>({})
  
  // Loading states
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Cache the threshold date to avoid redundant computations
  const thresholdDate = ref<Date | null>(null)

  // Computed properties
  const reposWithAlerts = computed(() => {
    return repos.value.filter((repo) => {
      const fullName = `${repo.owner}/${repo.name}`
      const summaryData = alertSummary.value[fullName]
      return summaryData && Object.keys(summaryData).length > 0
    })
  })

  // Update threshold when showOnlyActive changes
  const updateThreshold = (showOnlyActive: boolean) => {
    if (showOnlyActive) {
      const threshold = new Date()
      threshold.setDate(threshold.getDate() - FILTER_THRESHOLD_DAYS)
      thresholdDate.value = threshold
    } else {
      thresholdDate.value = null
    }
  }

  // Map frontend field names to backend field names
  const mapFieldToBackend = (field: string): string => {
    return FIELD_MAPPING[field as keyof typeof FIELD_MAPPING] || 'last_activity_at'
  }

  // Fetch repositories data
  const fetchRepos = async (sortField: string = TABLE_CONFIG.sortField): Promise<void> => {
    if (loading.value) return // Prevent duplicate calls

    try {
      loading.value = true
      error.value = null

      const backendField = mapFieldToBackend(sortField)
      
      const repoData = await callApi(
        () => apiService.getRepos(TABLE_CONFIG.defaultLimit, backendField),
        { errorMessage: 'Failed to fetch repositories' }
      )
      
      if (repoData) {
        repos.value = repoData
      }
    } catch (err) {
      console.error('Error fetching repos:', err)
      error.value = 'Failed to fetch repositories'
    } finally {
      loading.value = false
    }
  }

  // Fetch alert summary data
  const fetchAlertSummary = async (): Promise<void> => {
    if (repos.value.length === 0) return

    try {
      const summaryData = await callApi(
        () => apiService.getAlertSummary(
          repos.value.map((r) => ({ owner: r.owner, repo: r.name }))
        ),
        { errorMessage: 'Failed to fetch alert summary' }
      )
      
      if (summaryData) {
        alertSummary.value = summaryData
      }
    } catch (err) {
      console.error('Error fetching alert summary:', err)
      error.value = 'Failed to fetch alert summary'
    }
  }

  // Fetch alert summary by check type data
  const fetchAlertSummaryByCheckType = async (): Promise<void> => {
    if (repos.value.length === 0) return

    try {
      const summaryData = await callApi(
        () => apiService.getAlertSummaryByCheckType(
          repos.value.map((r) => ({ owner: r.owner, repo: r.name }))
        ),
        { errorMessage: 'Failed to fetch alert summary by check type' }
      )
      
      if (summaryData) {
        alertSummaryByCheckType.value = summaryData
      }
    } catch (err) {
      console.error('Error fetching alert summary by check type:', err)
      error.value = 'Failed to fetch alert summary by check type'
    }
  }

  // Initialize data (called once)
  const initializeData = async (sortField: string = TABLE_CONFIG.sortField): Promise<void> => {
    await fetchRepos(sortField)
    await fetchAlertSummary()
    await fetchAlertSummaryByCheckType()
  }

  return {
    // State
    repos: readonly(repos),
    alertSummary: readonly(alertSummary),
    alertSummaryByCheckType: readonly(alertSummaryByCheckType),
    loading: readonly(loading),
    error: readonly(error),
    thresholdDate: readonly(thresholdDate),

    // Computed
    reposWithAlerts,

    // Actions
    updateThreshold,
    fetchRepos,
    fetchAlertSummary,
    fetchAlertSummaryByCheckType,
    initializeData,
    mapFieldToBackend,
  }
}

export function useSharedState() {
  if (!sharedStateInstance) {
    sharedStateInstance = createSharedState()
  }
  return sharedStateInstance
} 