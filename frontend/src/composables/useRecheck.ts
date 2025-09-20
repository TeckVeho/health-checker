import { ref, computed, watch } from 'vue'
import { apiService, type RecheckResponse, type RecheckStatusResponse, type RecheckExecution, type RecheckStats, type RecheckSettings } from '~/utils/api'
import { useApi } from './useApi'

export interface RecheckOptions {
  owner: string
  repo: string
  checks?: string[]
  autoRefresh?: boolean
  refreshInterval?: number
  isGlobal?: boolean
}

export function useRecheck(options: RecheckOptions) {
  const { owner, repo, checks = ['branch', 'clone', 'gitleaks', 'issue'], autoRefresh = true, refreshInterval = 2000, isGlobal = false } = options
  
  const { loading, error, callApi } = useApi()
  
  // State
  const status = ref<RecheckStatusResponse | null>(null)
  const executionHistory = ref<RecheckExecution[]>([])
  const stats = ref<RecheckStats | null>(null)
  const settings = ref<RecheckSettings | null>(null)
  const lastExecution = ref<RecheckResponse | null>(null)
  
  // Auto-refresh timer
  let refreshTimer: NodeJS.Timeout | null = null
  
  // Computed
  const isRunning = computed(() => status.value?.status === 'running')
  const isIdle = computed(() => !status.value || status.value?.status === 'idle')
  const canExecute = computed(() => {
    if (!status.value) return true
    
    // 実行中の場合は実行不可
    if (status.value.status === 'running') return false
    
    // 時間制限をチェック
    if (retryAfterSeconds.value > 0) return false
    
    // 実行可能な状態
    return status.value.status === 'idle' || status.value.status === 'completed' || status.value.status === 'error'
  })
  
  const nextAvailableAt = computed(() => {
    if (!status.value?.nextAvailableAt) return null
    return new Date(status.value.nextAvailableAt)
  })
  
  const retryAfterSeconds = ref(0)
  
  // リアルタイムでretryAfterSecondsを更新するタイマー
  let countdownTimer: NodeJS.Timeout | null = null
  
  const updateRetryAfterSeconds = () => {
    if (!nextAvailableAt.value) {
      retryAfterSeconds.value = 0
      return
    }
    const now = new Date()
    const diff = nextAvailableAt.value.getTime() - now.getTime()
    retryAfterSeconds.value = Math.max(0, Math.ceil(diff / 1000))
    
    // カウントダウンが終了したらタイマーを停止
    if (retryAfterSeconds.value <= 0 && countdownTimer) {
      clearInterval(countdownTimer)
      countdownTimer = null
    }
  }
  
  const startCountdownTimer = () => {
    if (countdownTimer) {
      clearInterval(countdownTimer)
    }
    
    updateRetryAfterSeconds()
    
    if (retryAfterSeconds.value > 0) {
      countdownTimer = setInterval(updateRetryAfterSeconds, 1000)
    }
  }
  
  const stopCountdownTimer = () => {
    if (countdownTimer) {
      clearInterval(countdownTimer)
      countdownTimer = null
    }
  }
  
  // Methods
  async function executeRecheck(customChecks?: string[]): Promise<RecheckResponse | null> {
    // フロントエンド側で時間制限をチェック
    if (!canExecute.value) {
      if (retryAfterSeconds.value > 0) {
        const minutes = Math.ceil(retryAfterSeconds.value / 60)
        const seconds = retryAfterSeconds.value % 60
        let timeMessage = ''
        
        if (minutes > 0) {
          timeMessage = seconds > 0 ? `${minutes}分${seconds}秒` : `${minutes}分`
        } else {
          timeMessage = `${seconds}秒`
        }
        
        // エラーレスポンスを返す
        return {
          success: false,
          message: `前回の実行から3分経過していません。あと${timeMessage}お待ちください。`,
          error: {
            code: 'RATE_LIMITED',
            message: `前回の実行から3分経過していません。あと${timeMessage}お待ちください。`,
            retryAfter: retryAfterSeconds.value
          }
        }
      }
      
      // その他の理由で実行不可の場合
      return {
        success: false,
        message: 'ReCheckを実行できません',
        error: {
          code: 'EXECUTION_NOT_ALLOWED',
          message: '現在ReCheckを実行できません'
        }
      }
    }
    
    const result = await callApi(
      () => isGlobal 
        ? apiService.executeGlobalRecheck(customChecks || checks)
        : apiService.executeRecheck(owner, repo, customChecks || checks),
      {
        showLoading: true,
        errorMessage: 'Failed to execute ReCheck'
      }
    )
    
    if (result) {
      lastExecution.value = result
      // Refresh status after execution
      await refreshStatus()
    }
    
    return result
  }
  
  async function refreshStatus(): Promise<RecheckStatusResponse | null> {
    const result = await callApi(
      () => apiService.getRecheckStatus(owner, repo),
      {
        showLoading: false,
        errorMessage: 'Failed to get ReCheck status'
      }
    )
    
    if (result) {
      status.value = result
      
      // カウントダウンタイマーを開始
      if (result.nextAvailableAt) {
        startCountdownTimer()
      } else {
        stopCountdownTimer()
      }
    }
    
    return result
  }
  
  async function refreshHistory(limit: number = 10, offset: number = 0): Promise<RecheckExecution[] | null> {
    const result = await callApi(
      () => apiService.getRecheckHistory(owner, repo, limit, offset),
      {
        showLoading: false,
        errorMessage: 'Failed to get ReCheck history'
      }
    )
    
    if (result) {
      executionHistory.value = result.data || []
    }
    
    return result?.data || null
  }
  
  async function refreshStats(): Promise<RecheckStats | null> {
    const result = await callApi(
      () => apiService.getRecheckStats(owner, repo),
      {
        showLoading: false,
        errorMessage: 'Failed to get ReCheck stats'
      }
    )
    
    if (result) {
      stats.value = result.data
    }
    
    return result?.data || null
  }
  
  async function refreshSettings(): Promise<RecheckSettings | null> {
    const result = await callApi(
      () => apiService.getRecheckSettings(owner, repo),
      {
        showLoading: false,
        errorMessage: 'Failed to get ReCheck settings'
      }
    )
    
    if (result) {
      settings.value = result.data
    }
    
    return result?.data || null
  }
  
  async function updateSettings(newSettings: Partial<RecheckSettings>): Promise<RecheckSettings | null> {
    const result = await callApi(
      () => apiService.updateRecheckSettings(owner, repo, newSettings),
      {
        showLoading: true,
        errorMessage: 'Failed to update ReCheck settings'
      }
    )
    
    if (result) {
      settings.value = result.data
    }
    
    return result?.data || null
  }
  
  // Auto-refresh functionality
  function startAutoRefresh() {
    if (refreshTimer) {
      clearInterval(refreshTimer)
    }
    
    if (autoRefresh && isRunning.value) {
      refreshTimer = setInterval(async () => {
        await refreshStatus()
        
        // Stop auto-refresh if execution is no longer running
        if (!isRunning.value) {
          stopAutoRefresh()
        }
      }, refreshInterval)
    }
  }
  
  function stopAutoRefresh() {
    if (refreshTimer) {
      clearInterval(refreshTimer)
      refreshTimer = null
    }
  }
  
  // Watch for status changes to manage auto-refresh
  watch(isRunning, (newIsRunning) => {
    if (newIsRunning && autoRefresh) {
      startAutoRefresh()
    } else {
      stopAutoRefresh()
    }
  })
  
  // Initialize
  async function initialize() {
    await Promise.all([
      refreshStatus(),
      refreshHistory(),
      refreshStats(),
      refreshSettings()
    ])
    
    // Start auto-refresh if running
    if (isRunning.value && autoRefresh) {
      startAutoRefresh()
    }
  }
  
  // Cleanup
  function cleanup() {
    stopAutoRefresh()
    stopCountdownTimer()
  }
  
  return {
    // State
    loading,
    error,
    status,
    executionHistory,
    stats,
    settings,
    lastExecution,
    
    // Computed
    isRunning,
    isIdle,
    canExecute,
    nextAvailableAt,
    retryAfterSeconds,
    
    // Methods
    executeRecheck,
    refreshStatus,
    refreshHistory,
    refreshStats,
    refreshSettings,
    updateSettings,
    initialize,
    cleanup,
    
    // Auto-refresh control
    startAutoRefresh,
    stopAutoRefresh,
  }
}
