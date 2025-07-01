import { ref, computed, readonly, type Ref } from 'vue'
import { useApi } from './useApi'
import { useApiConfig } from './useApiConfig'
import { useCustomToast } from './useCustomToast'
import { apiService } from '~/utils/api'
import type { Alert, AlertsResponse } from '@/types/alerts'
import { checkTypeLabels } from '@/types/alerts'

// Configuration constants
const DEFAULT_BRANCH = 'develop'
const VALID_SEVERITY_LEVELS = ['high', 'middle', 'low'] as const
type SeverityLevel = typeof VALID_SEVERITY_LEVELS[number]

export function useAlerts(owner: Ref<string | null>, repo: Ref<string | null>) {
  const { callApi } = useApi()
  const { apiBaseUrl } = useApiConfig()
  const toast = useCustomToast()
  
  // Initialize API service with correct base URL
  apiService.init(apiBaseUrl)
  
  const alerts = ref<Alert[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Computed properties
  const visibleAlerts = computed(() =>
    alerts.value.filter((a) => !a.isIgnored && !a.systemResolved)
  )

  const resolvedAlerts = computed(() =>
    alerts.value.filter((a) => !a.isIgnored && a.systemResolved)
  )

  const hasAlerts = computed(() => visibleAlerts.value.length > 0)

  const hasResolvedAlerts = computed(() => resolvedAlerts.value.length > 0)

  const alertCounts = computed(() => {
    const counts = { high: 0, middle: 0, low: 0 }
    visibleAlerts.value.forEach(alert => {
      if (counts.hasOwnProperty(alert.level)) {
        counts[alert.level as keyof typeof counts]++
      }
    })
    return counts
  })

  // Validation helpers
  const validateParams = (): boolean => {
    if (!owner.value || !repo.value) {
      const errorMsg = 'Owner and repository parameters are required'
      error.value = errorMsg
      toast.error('Invalid Parameters', errorMsg)
      return false
    }
    return true
  }

  const validateLevel = (level: string): level is SeverityLevel => {
    return VALID_SEVERITY_LEVELS.includes(level as SeverityLevel)
  }

  // Utility functions
  const formatDate = (dateStr: string): string => {
    const d = new Date(dateStr)
    const pad = (n: number) => n.toString().padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(
      d.getHours()
    )}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
  }

  const getSeverity = (level: string): string => {
    if (!validateLevel(level)) {
      console.warn(`Invalid severity level: ${level}`)
      return 'info'
    }
    
    switch (level) {
      case 'high': return 'danger'
      case 'middle': return 'warning'
      case 'low': return 'info'
      default: return 'info'
    }
  }

  const getGitHubUrl = (filePath: string, lineNumber: number, branch?: string): string => {
    if (!validateParams()) {
      return '#'
    }

    // Validate parameters
    if (!filePath || !lineNumber || lineNumber < 1) {
      console.warn('Invalid GitHub URL parameters:', { filePath, lineNumber, branch })
      return '#'
    }

    const safeBranch = branch || DEFAULT_BRANCH
    
    return `https://github.com/${owner.value}/${repo.value}/blob/${safeBranch}/${filePath}#L${lineNumber}`
  }

  // Unified data fetching method
  const fetchAlerts = async (useWrapper: boolean = true): Promise<void> => {
    if (!validateParams()) {
      return
    }

    const fetchData = async (): Promise<AlertsResponse> => {
      return await apiService.fetchData<AlertsResponse>(`/api/alerts/${owner.value}/${repo.value}`)
    }

    if (useWrapper) {
      // Use callApi wrapper for consistent error handling
      const result = await callApi(
        fetchData,
        {
          showLoading: true,
          errorMessage: 'Failed to fetch alerts'
        }
      )

      if (result) {
        alerts.value = result.alerts || []
        error.value = null
      } else {
        error.value = 'Failed to load alerts'
        toast.error('Failed to Load Alerts', 'Unable to fetch alerts from the server')
      }
    } else {
      // Direct API call with manual error handling
      try {
        loading.value = true
        error.value = null
        
        const response = await fetchData()
        alerts.value = response.alerts || []
      } catch (err) {
        console.error('Failed to fetch alerts:', err)
        const errorMsg = err instanceof Error ? err.message : 'Failed to fetch alerts'
        error.value = errorMsg
        toast.error('Error Loading Alerts', errorMsg)
      } finally {
        loading.value = false
      }
    }
  }

  // Refresh alerts (alias for fetchAlerts)
  const refreshAlerts = () => fetchAlerts()

  // Clear alerts and error state
  const clearAlerts = (): void => {
    alerts.value = []
    error.value = null
  }

  return {
    // State
    alerts: readonly(alerts),
    loading: readonly(loading),
    error: readonly(error),
    
    // Computed
    visibleAlerts,
    resolvedAlerts,
    hasAlerts,
    hasResolvedAlerts,
    alertCounts,
    
    // Utility functions
    formatDate,
    getSeverity,
    getGitHubUrl,
    validateParams,
    
    // Constants
    checkTypeLabels,
    VALID_SEVERITY_LEVELS,
    
    // Actions
    fetchAlerts,
    refreshAlerts,
    clearAlerts,
  }
}
// Log Review URL: https://58llm.link/main/restore/1e03a522-8f49-4958-822a-6ef4232c5feb