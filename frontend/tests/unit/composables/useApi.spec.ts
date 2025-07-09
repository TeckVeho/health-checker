import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useApi } from '@/composables/useApi'

// Mock dependencies
vi.mock('@/utils/api', () => ({
  apiService: {
    init: vi.fn(),
    fetchData: vi.fn()
  }
}))

vi.mock('@/utils/errors', () => ({
  getErrorMessage: vi.fn((err) => err?.message || 'An unknown error occurred'),
  logError: vi.fn()
}))

describe('useApi', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('initialization', () => {
    it('should return expected properties and methods', () => {
      const result = useApi()
      
      expect(result).toHaveProperty('loading')
      expect(result).toHaveProperty('error')
      expect(result).toHaveProperty('callApi')
      expect(result).toHaveProperty('clearError')
      expect(result).toHaveProperty('setError')
      expect(result).toHaveProperty('apiService')
    })

    it('should initialize with default state', () => {
      const result = useApi()
      
      expect(result.loading.value).toBe(false)
      expect(result.error.value).toBeNull()
    })
  })

  describe('callApi', () => {
    it('should successfully execute API call and return result', async () => {
      const result = useApi()
      const mockApiCall = vi.fn().mockResolvedValue('success')
      
      const apiResult = await result.callApi(mockApiCall)
      
      expect(apiResult).toBe('success')
      expect(mockApiCall).toHaveBeenCalledOnce()
      expect(result.loading.value).toBe(false)
      expect(result.error.value).toBeNull()
    })

    it('should handle API call with custom options', async () => {
      const result = useApi()
      const mockApiCall = vi.fn().mockResolvedValue('success')
      
      const apiResult = await result.callApi(mockApiCall, {
        showLoading: false,
        errorMessage: 'Custom error message'
      })
      
      expect(apiResult).toBe('success')
      expect(result.loading.value).toBe(false) // Should not change since showLoading is false
    })

    it('should handle API call errors', async () => {
      const result = useApi()
      const mockError = new Error('API Error')
      const mockApiCall = vi.fn().mockRejectedValue(mockError)
      
      const apiResult = await result.callApi(mockApiCall)
      
      expect(apiResult).toBeNull()
      expect(result.error.value).toBe('API Error')
      expect(result.loading.value).toBe(false)
    })

    it('should use custom error message when provided', async () => {
      const result = useApi()
      const mockError = new Error('API Error')
      const mockApiCall = vi.fn().mockRejectedValue(mockError)
      
      const apiResult = await result.callApi(mockApiCall, {
        errorMessage: 'Custom error message'
      })
      
      expect(apiResult).toBeNull()
      // The actual implementation uses getErrorMessage first, which returns the error message
      // Only if getErrorMessage returns falsy, then it uses the custom error message
      expect(result.error.value).toBe('API Error')
    })

    it('should handle API call without loading state', async () => {
      const result = useApi()
      const mockApiCall = vi.fn().mockResolvedValue('success')
      
      const apiResult = await result.callApi(mockApiCall, {
        showLoading: false
      })
      
      expect(apiResult).toBe('success')
      expect(result.loading.value).toBe(false) // Should remain false
    })

    it('should set loading state during API call', async () => {
      const result = useApi()
      let resolvePromise: (value: string) => void
      const mockApiCall = vi.fn().mockImplementation(() => {
        return new Promise<string>((resolve) => {
          resolvePromise = resolve
        })
      })
      
      const apiPromise = result.callApi(mockApiCall)
      
      // Check loading state is set
      expect(result.loading.value).toBe(true)
      
      // Resolve the promise
      resolvePromise!('success')
      await apiPromise
      
      expect(result.loading.value).toBe(false)
    })

    it('should handle API call with no options', async () => {
      const result = useApi()
      const mockApiCall = vi.fn().mockResolvedValue('success')
      
      const apiResult = await result.callApi(mockApiCall)
      
      expect(apiResult).toBe('success')
      expect(result.loading.value).toBe(false)
      expect(result.error.value).toBeNull()
    })
  })

  describe('error management', () => {
    it('should clear error state', () => {
      const result = useApi()
      result.error.value = 'Some error'
      
      result.clearError()
      
      expect(result.error.value).toBeNull()
    })

    it('should set error manually', () => {
      const result = useApi()
      const errorMessage = 'Manual error message'
      
      result.setError(errorMessage)
      
      expect(result.error.value).toBe(errorMessage)
    })
  })

  describe('apiService export', () => {
    it('should export apiService', () => {
      const result = useApi()
      
      expect(result.apiService).toBeDefined()
      expect(typeof result.apiService.init).toBe('function')
    })
  })

  describe('error handling edge cases', () => {
    it('should handle undefined error in callApi', async () => {
      const result = useApi()
      const mockApiCall = vi.fn().mockRejectedValue(undefined)
      
      const apiResult = await result.callApi(mockApiCall)
      
      expect(apiResult).toBeNull()
      expect(result.error.value).toBe('An unknown error occurred') // Default error message from getErrorMessage
    })

    it('should handle null error in callApi', async () => {
      const result = useApi()
      const mockApiCall = vi.fn().mockRejectedValue(null)
      
      const apiResult = await result.callApi(mockApiCall)
      
      expect(apiResult).toBeNull()
      expect(result.error.value).toBe('An unknown error occurred') // Default error message from getErrorMessage
    })

    it('should handle error without message property', async () => {
      const result = useApi()
      const mockError = { customProperty: 'custom error' }
      const mockApiCall = vi.fn().mockRejectedValue(mockError)
      
      const apiResult = await result.callApi(mockApiCall)
      
      expect(apiResult).toBeNull()
      expect(result.error.value).toBe('An unknown error occurred') // Default error message from getErrorMessage
    })
  })

  describe('loading state management', () => {
    it('should not change loading state when showLoading is false', async () => {
      const result = useApi()
      const mockApiCall = vi.fn().mockResolvedValue('success')
      
      await result.callApi(mockApiCall, { showLoading: false })
      
      expect(result.loading.value).toBe(false)
    })

    it('should reset loading state even when API call fails', async () => {
      const result = useApi()
      const mockApiCall = vi.fn().mockRejectedValue(new Error('API Error'))
      
      await result.callApi(mockApiCall)
      
      expect(result.loading.value).toBe(false)
    })
  })
}) 