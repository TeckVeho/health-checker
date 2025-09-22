import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useApiConfig } from '~/composables/useApiConfig'

// Import the shared mock - will be loaded from our mock file
import { useRuntimeConfig } from '#app'

// Get the mock configuration to modify in tests
const mockConfig = useRuntimeConfig()

describe('useApiConfig', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('initialization', () => {
    it('should return expected properties', () => {
      const result = useApiConfig()
      
      expect(result).toHaveProperty('apiBaseUrl')
      expect(result).toHaveProperty('apiTimeout')
    })

    it('should return config values from runtime config', () => {
      const { apiBaseUrl, apiTimeout } = useApiConfig()
      
      expect(apiBaseUrl.value).toBe('http://localhost:3000')
      expect(apiTimeout.value).toBe(10000)
    })
  })

  describe('config values', () => {
    it('should return correct API base URL', () => {
      const { apiBaseUrl } = useApiConfig()
      
      expect(apiBaseUrl.value).toBe('http://localhost:3000')
    })

    it('should return correct API timeout', () => {
      const { apiTimeout } = useApiConfig()
      
      expect(apiTimeout.value).toBe(10000)
    })
  })

  describe('reactive updates', () => {
    it('should be reactive to config changes', () => {
      const { apiBaseUrl, apiTimeout } = useApiConfig()
      
      // Initial values
      expect(apiBaseUrl.value).toBe('http://localhost:3000')
      expect(apiTimeout.value).toBe(10000)
      
      // Simulate config change
      mockConfig.public.apiBaseUrl = 'http://localhost:4000'
      mockConfig.public.apiTimeout = 15000
      
      // Values should be reactive
      expect(apiBaseUrl.value).toBe('http://localhost:4000')
      expect(apiTimeout.value).toBe(15000)
    })
  })

  describe('environment variable priority', () => {
    it('should prioritize API_BASE_URL environment variable', () => {
      // Mock environment variable
      const originalEnv = process.env.API_BASE_URL
      process.env.API_BASE_URL = 'https://api.production.com'
      
      // Reset config
      mockConfig.public = {}
      
      const { apiBaseUrl } = useApiConfig()
      
      expect(apiBaseUrl.value).toBe('https://api.production.com')
      
      // Restore original environment
      process.env.API_BASE_URL = originalEnv
    })

    it('should fallback to NUXT_PUBLIC_API_BASE_URL when API_BASE_URL is not set', () => {
      // Mock environment variables
      const originalApiBaseUrl = process.env.API_BASE_URL
      const originalNuxtPublicApiBaseUrl = process.env.NUXT_PUBLIC_API_BASE_URL
      
      delete process.env.API_BASE_URL
      process.env.NUXT_PUBLIC_API_BASE_URL = 'https://api.staging.com'
      
      // Reset config
      mockConfig.public = {}
      
      const { apiBaseUrl } = useApiConfig()
      
      expect(apiBaseUrl.value).toBe('https://api.staging.com')
      
      // Restore original environment
      process.env.API_BASE_URL = originalApiBaseUrl
      process.env.NUXT_PUBLIC_API_BASE_URL = originalNuxtPublicApiBaseUrl
    })
  })

  describe('undefined values', () => {
    it('should handle undefined config values', () => {
      // Clear environment variables
      const originalApiBaseUrl = process.env.API_BASE_URL
      const originalNuxtPublicApiBaseUrl = process.env.NUXT_PUBLIC_API_BASE_URL
      delete process.env.API_BASE_URL
      delete process.env.NUXT_PUBLIC_API_BASE_URL
      
      // Reset config with undefined values
      mockConfig.public = {}
      
      const { apiBaseUrl, apiTimeout } = useApiConfig()
      
      // apiBaseUrl should return default value when undefined
      expect(apiBaseUrl.value).toBe('http://localhost:23000')
      expect(apiTimeout.value).toBeUndefined()
      
      // Restore original environment
      process.env.API_BASE_URL = originalApiBaseUrl
      process.env.NUXT_PUBLIC_API_BASE_URL = originalNuxtPublicApiBaseUrl
    })

    it('should handle partial config values', () => {
      // Clear environment variables
      const originalApiBaseUrl = process.env.API_BASE_URL
      const originalNuxtPublicApiBaseUrl = process.env.NUXT_PUBLIC_API_BASE_URL
      delete process.env.API_BASE_URL
      delete process.env.NUXT_PUBLIC_API_BASE_URL
      
      // Reset config with partial values
      mockConfig.public = {
        apiBaseUrl: 'http://localhost:5000'
      }
      
      const { apiBaseUrl, apiTimeout } = useApiConfig()
      
      expect(apiBaseUrl.value).toBe('http://localhost:5000')
      expect(apiTimeout.value).toBeUndefined()
      
      // Restore original environment
      process.env.API_BASE_URL = originalApiBaseUrl
      process.env.NUXT_PUBLIC_API_BASE_URL = originalNuxtPublicApiBaseUrl
    })
  })

  describe('type safety', () => {
    it('should handle string values correctly', () => {
      mockConfig.public = {
        apiBaseUrl: 'string-url',
        apiTimeout: 'string-timeout'
      }
      
      const { apiBaseUrl, apiTimeout } = useApiConfig()
      
      expect(typeof apiBaseUrl.value).toBe('string')
      expect(typeof apiTimeout.value).toBe('string')
    })

    it('should handle number values correctly', () => {
      mockConfig.public = {
        apiBaseUrl: 'http://localhost:3000',
        apiTimeout: 5000
      }
      
      const { apiBaseUrl, apiTimeout } = useApiConfig()
      
      expect(typeof apiBaseUrl.value).toBe('string')
      expect(typeof apiTimeout.value).toBe('number')
    })
  })
})
