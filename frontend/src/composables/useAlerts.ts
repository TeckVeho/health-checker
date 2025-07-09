import { ref, computed, readonly, type Ref } from 'vue'
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

  // Health summary data
  const health = ref<{
    total: number
    high: number
    middle: number
    low: number
  }>({
    total: 0,
    high: 0,
    middle: 0,
    low: 0
  })

  const healthTableData = ref<Array<{
    severity: string
    count: number
    percentage: number
    tagSeverity: string | null
    isTotal: boolean
  }>>([])

  const healthColumns = [
    { label: 'High', key: 'high', tagSeverity: 'danger' },
    { label: 'Middle', key: 'middle', tagSeverity: 'warning' },
    { label: 'Low', key: 'low', tagSeverity: 'info' },
  ]

  // Prepare table data for DataTable
  const prepareHealthTableData = () => {
    const data = []
    
    // Add severity rows
    healthColumns.forEach(col => {
      data.push({
        severity: col.label,
        count: (health.value as any)[col.key] || 0,
        percentage: health.value.total > 0 ? Math.round(((health.value as any)[col.key] || 0) / health.value.total * 100) : 0,
        tagSeverity: col.tagSeverity,
        isTotal: false
      })
    })
    
    // Add total row
    data.push({
      severity: 'Total',
      count: health.value.total,
      percentage: 100,
      tagSeverity: null,
      isTotal: true
    })
    
    healthTableData.value = data
  }

  // Fetch health summary data
  const fetchHealthSummary = async (): Promise<void> => {
    if (!validateParams()) {
      return
    }

    try {
      const summaryData = await callApi(
        () => apiService.getAlertSummary([{ owner: owner.value!, repo: repo.value! }]),
        { errorMessage: 'Failed to fetch alert summary' }
      )

      if (summaryData) {
        const healthData = `${owner.value}/${repo.value}`
        let total = 0
        
        for (const col of healthColumns) {
          const val = summaryData[healthData]?.[col.key as keyof typeof summaryData[typeof healthData]] ?? 0
          total += val
        }
        
        health.value = {
          total: total,
          high: summaryData[healthData]?.['high'] ?? 0,
          middle: summaryData[healthData]?.['middle'] ?? 0,
          low: summaryData[healthData]?.['low'] ?? 0,
        }
        
        prepareHealthTableData()
      }
    } catch (err) {
      console.error('Error fetching health summary:', err)
      toast.error('Failed to Load Health Summary', 'Unable to fetch health summary data')
    }
  }

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
    return moment(dateStr).format('YYYY-MM-DD HH:mm:ss')
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
    
    // Health summary
    health: readonly(health),
    healthTableData: readonly(healthTableData),
    healthColumns,
    fetchHealthSummary,
    
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