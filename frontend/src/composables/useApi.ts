import { ref } from 'vue'
import { apiService } from '~/utils/api'

export function useApi() {
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Generic API call wrapper
  async function callApi<T = any>(
    apiCall: () => Promise<T>,
    options?: {
      showLoading?: boolean
      errorMessage?: string
    }
  ): Promise<T | null> {
    const { showLoading = true, errorMessage = 'An error occurred' } = options || {}

    try {
      if (showLoading) {
        loading.value = true
      }
      error.value = null

      const result = await apiCall()
      return result
    } catch (err) {
      console.error('API call failed:', err)
      error.value = err instanceof Error ? err.message : errorMessage
      return null
    } finally {
      if (showLoading) {
        loading.value = false
      }
    }
  }

  // Clear error
  function clearError() {
    error.value = null
  }

  // Set error manually
  function setError(message: string) {
    error.value = message
  }

  return {
    loading,
    error,
    callApi,
    clearError,
    setError,
    apiService, // Export the service for direct use
  }
} 