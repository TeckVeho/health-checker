import { ref, computed, readonly, onUnmounted, type Ref } from 'vue'
import { useApi } from './useApi'
import { useApiConfig } from './useApiConfig'
import { useCustomToast } from './useCustomToast'
import { apiService } from '~/utils/api'
import { getFileUrl } from '~/utils/github'
import { logError, getErrorMessage } from '~/utils/errors'
import type { Alert, AlertsResponse } from '@/types/alerts'
import { checkTypeLabels } from '@/types/alerts'
import moment from 'moment'

// Configuration constants
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
  
  // Polling state
  const isPolling = ref(false)
  const pollingInterval = ref(5000) // 5 seconds default
  let pollingTimer: NodeJS.Timeout | null = null
  
  // Temporary polling after ReCheck completion
  const isTemporaryPolling = ref(false)
  const temporaryPollingCount = ref(0)
  const maxTemporaryPolls = 6 // Poll for 30 seconds (6 * 5s) after ReCheck completion
  let temporaryPollingTimer: NodeJS.Timeout | null = null

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
  const formatDate = (dateStr: string | null | undefined): string => {
    if (!dateStr || dateStr === null || dateStr === undefined || dateStr === 'null' || dateStr === 'undefined') {
      return 'N/A'
    }
    
    try {
      // momentを使用する前に有効な日付かチェック
      const date = new Date(dateStr)
      if (isNaN(date.getTime())) {
        console.warn('Invalid date string:', dateStr)
        return 'Invalid Date'
      }
      
      return moment(dateStr).format('YYYY-MM-DD HH:mm:ss')
    } catch (error) {
      console.error('Error formatting date:', dateStr, error)
      return 'Invalid Date'
    }
  }

  const severityMap = {
    high: 'danger',
    middle: 'warning',
    low: 'info'
  } as const

  const getSeverity = (level: string): string => {
    if (!validateLevel(level)) {
      console.warn(`Invalid severity level: ${level}`)
      return 'info'
    }
    
    return severityMap[level as keyof typeof severityMap] || 'info'
  }

  const getGitHubUrl = (filePath: string, lineNumber: number, branch?: string): string => {
    if (!validateParams()) {
      return '#'
    }

    return getFileUrl({
      owner: owner.value!,
      repo: repo.value!,
      filePath,
      lineNumber,
      branch
    })
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
        logError(err, 'fetchAlerts')
        const errorMsg = getErrorMessage(err) || 'Failed to fetch alerts'
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

  // Polling functionality
  const startPolling = (interval: number = pollingInterval.value): void => {
    if (isPolling.value) {
      stopPolling()
    }
    
    if (!validateParams()) {
      return
    }
    
    isPolling.value = true
    pollingInterval.value = interval
    
    const poll = async () => {
      if (!isPolling.value) return
      
      try {
        await fetchAlerts(false) // Use direct API call to avoid loading state conflicts
      } catch (err) {
        console.warn('Polling error:', err)
        // Don't show toast for polling errors to avoid spam
      }
      
      if (isPolling.value) {
        pollingTimer = setTimeout(poll, pollingInterval.value)
      }
    }
    
    // Start polling immediately
    poll()
  }
  
  const stopPolling = (): void => {
    isPolling.value = false
    if (pollingTimer) {
      clearTimeout(pollingTimer)
      pollingTimer = null
    }
  }
  
  const setPollingInterval = (interval: number): void => {
    pollingInterval.value = interval
    if (isPolling.value) {
      // Restart polling with new interval
      startPolling(interval)
    }
  }

  // Temporary polling after ReCheck completion
  const startTemporaryPolling = (interval: number = 5000): void => {
    if (!validateParams()) {
      return
    }
    
    // Stop any existing temporary polling
    stopTemporaryPolling()
    
    isTemporaryPolling.value = true
    temporaryPollingCount.value = 0
    
    const poll = async () => {
      if (!isTemporaryPolling.value || temporaryPollingCount.value >= maxTemporaryPolls) {
        stopTemporaryPolling()
        return
      }
      
      temporaryPollingCount.value++
      
      try {
        await fetchAlerts(false) // Use direct API call to avoid loading state conflicts
      } catch (err) {
        console.warn('Temporary polling error:', err)
      }
      
      if (isTemporaryPolling.value && temporaryPollingCount.value < maxTemporaryPolls) {
        temporaryPollingTimer = setTimeout(poll, interval)
      } else {
        stopTemporaryPolling()
      }
    }
    
    // Start temporary polling immediately
    poll()
  }
  
  const stopTemporaryPolling = (): void => {
    isTemporaryPolling.value = false
    temporaryPollingCount.value = 0
    if (temporaryPollingTimer) {
      clearTimeout(temporaryPollingTimer)
      temporaryPollingTimer = null
    }
  }

  // Cleanup on unmount
  onUnmounted(() => {
    stopPolling()
    stopTemporaryPolling()
  })

  return {
    // State
    alerts: readonly(alerts),
    loading: readonly(loading),
    error: readonly(error),
    
    // Polling state
    isPolling: readonly(isPolling),
    pollingInterval: readonly(pollingInterval),
    isTemporaryPolling: readonly(isTemporaryPolling),
    
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
    
    // Polling actions
    startPolling,
    stopPolling,
    setPollingInterval,
    startTemporaryPolling,
    stopTemporaryPolling,
  }
}