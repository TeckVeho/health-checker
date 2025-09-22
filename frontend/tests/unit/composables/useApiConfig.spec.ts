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
      
      expect(apiBaseUrl.value).toBe(process.env.NUXT_PUBLIC_API_BASE_URL || 'http://localhost:3000')
      expect(apiTimeout.value).toBe(10000)
    })
  })

  describe('config values', () => {
    it('should return correct API base URL', () => {
      const { apiBaseUrl } = useApiConfig()
      
      expect(apiBaseUrl.value).toBe(process.env.NUXT_PUBLIC_API_BASE_URL || 'http://localhost:3000')
    })

    it('should return correct API timeout', () => {
      const { apiTimeout } = useApiConfig()
      
      expect(apiTimeout.value).toBe(10000)
    })
  })

  describe('reactive updates', () => {
    it('should be reactive to config changes when no environment variables are set', () => {
      // Clear environment variables for this test
      const originalApiBaseUrl = process.env.API_BASE_URL
      const originalNuxtPublicApiBaseUrl = process.env.NUXT_PUBLIC_API_BASE_URL
      delete process.env.API_BASE_URL
      delete process.env.NUXT_PUBLIC_API_BASE_URL
      
      const { apiBaseUrl, apiTimeout } = useApiConfig()
      
      // Initial values
      expect(apiBaseUrl.value).toBe(process.env.NUXT_PUBLIC_API_BASE_URL || 'http://localhost:3000')
      expect(apiTimeout.value).toBe(10000)
      
      // Simulate config change
      mockConfig.public.apiBaseUrl = 'http://localhost:4000'
      mockConfig.public.apiTimeout = 15000

      // Values should be reactive
      expect(apiBaseUrl.value).toBe('http://localhost:4000')
      expect(apiTimeout.value).toBe(15000)
      
      // Restore original environment
      process.env.API_BASE_URL = originalApiBaseUrl
      process.env.NUXT_PUBLIC_API_BASE_URL = originalNuxtPublicApiBaseUrl
    })
  })

  describe('environment variable priority', () => {
    it('should prioritize NUXT_PUBLIC_API_BASE_URL environment variable', () => {
      // Mock environment variable
      const originalEnv = process.env.NUXT_PUBLIC_API_BASE_URL
      process.env.NUXT_PUBLIC_API_BASE_URL = 'https://api.production.com'
      
      // Reset config
      mockConfig.public = {
        apiBaseUrl: undefined,
        primevue: { options: { theme: { preset: {} } } }
      }
      
      const { apiBaseUrl } = useApiConfig()
      
      expect(apiBaseUrl.value).toBe('https://api.production.com')
      
      // Restore original environment
      process.env.NUXT_PUBLIC_API_BASE_URL = originalEnv
    })

    it('should fallback to NUXT_PUBLIC_API_BASE_URL when API_BASE_URL is not set', () => {
      // Mock environment variables
      const originalApiBaseUrl = process.env.API_BASE_URL
      const originalNuxtPublicApiBaseUrl = process.env.NUXT_PUBLIC_API_BASE_URL
      
      delete process.env.API_BASE_URL
      process.env.NUXT_PUBLIC_API_BASE_URL = 'https://api.staging.com'
      
      // Reset config
      mockConfig.public = {
        apiBaseUrl: undefined,
        primevue: { options: { theme: { preset: {} } } }
      }
      
      const { apiBaseUrl } = useApiConfig()
      
      expect(apiBaseUrl.value).toBe('https://api.staging.com')
      
      // Restore original environment
      process.env.API_BASE_URL = originalApiBaseUrl
      process.env.NUXT_PUBLIC_API_BASE_URL = originalNuxtPublicApiBaseUrl
    })
  })

  describe('error handling', () => {
    it('should throw error when no API base URL is configured', () => {
      // Clear environment variables
      const originalApiBaseUrl = process.env.API_BASE_URL
      const originalNuxtPublicApiBaseUrl = process.env.NUXT_PUBLIC_API_BASE_URL
      delete process.env.API_BASE_URL
      delete process.env.NUXT_PUBLIC_API_BASE_URL
      
      // Reset config with undefined values
      mockConfig.public = {
        apiBaseUrl: undefined,
        primevue: { options: { theme: { preset: {} } } }
      }
      
      const { apiBaseUrl } = useApiConfig()
      
      // apiBaseUrl should throw error when no URL is configured
      expect(() => apiBaseUrl.value).toThrow('NUXT_PUBLIC_API_BASE_URL environment variable is required')
      
      // Restore original environment
      process.env.API_BASE_URL = originalApiBaseUrl
      process.env.NUXT_PUBLIC_API_BASE_URL = originalNuxtPublicApiBaseUrl
    })

    it('should use runtime config when environment variables are not set', () => {
      // Clear environment variables
      const originalApiBaseUrl = process.env.API_BASE_URL
      const originalNuxtPublicApiBaseUrl = process.env.NUXT_PUBLIC_API_BASE_URL
      delete process.env.API_BASE_URL
      delete process.env.NUXT_PUBLIC_API_BASE_URL
      
      // Set runtime config
      mockConfig.public = {
        apiBaseUrl: 'https://api.runtime.com',
        primevue: { options: { theme: { preset: {} } } }
      }
      
      const { apiBaseUrl } = useApiConfig()
      
      expect(apiBaseUrl.value).toBe('https://api.runtime.com')
      
      // Restore original environment
      process.env.API_BASE_URL = originalApiBaseUrl
      process.env.NUXT_PUBLIC_API_BASE_URL = originalNuxtPublicApiBaseUrl
    })

    it('should throw error in production when no config is available', () => {
      // Mock production environment
      const originalNodeEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'production'
      
      // Clear environment variables
      const originalApiBaseUrl = process.env.API_BASE_URL
      const originalNuxtPublicApiBaseUrl = process.env.NUXT_PUBLIC_API_BASE_URL
      delete process.env.API_BASE_URL
      delete process.env.NUXT_PUBLIC_API_BASE_URL
      
      // Reset config
      mockConfig.public = {
        apiBaseUrl: undefined,
        primevue: { options: { theme: { preset: {} } } }
      }
      
      const { apiBaseUrl } = useApiConfig()
      
      // Should throw error in production when no config is available
      expect(() => apiBaseUrl.value).toThrow('API configuration not found. Please check your environment variables.')
      
      // Restore original values
      process.env.NODE_ENV = originalNodeEnv
      process.env.API_BASE_URL = originalApiBaseUrl
      process.env.NUXT_PUBLIC_API_BASE_URL = originalNuxtPublicApiBaseUrl
    })
  })

  describe('type safety', () => {
    it('should handle string values correctly', () => {
      mockConfig.public = {
        apiBaseUrl: 'string-url',
        apiTimeout: 'string-timeout',
        primevue: { options: { theme: { preset: {} } } }
      }
      
      const { apiBaseUrl, apiTimeout } = useApiConfig()
      
      expect(typeof apiBaseUrl.value).toBe('string')
      expect(typeof apiTimeout.value).toBe('string')
    })

    it('should handle number values correctly', () => {
      mockConfig.public = {
        apiBaseUrl: process.env.NUXT_PUBLIC_API_BASE_URL || 'http://localhost:3000',
        apiTimeout: 5000,
        primevue: { options: { theme: { preset: {} } } }
      }
      
      const { apiBaseUrl, apiTimeout } = useApiConfig()
      
      expect(typeof apiBaseUrl.value).toBe('string')
      expect(typeof apiTimeout.value).toBe('number')
    })
  })
})