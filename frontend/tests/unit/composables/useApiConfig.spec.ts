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
    it('should be reactive to config changes when no environment variables are set', () => {
      // Clear environment variables for this test
      const originalNuxtPublicApiBaseUrl = process.env.NUXT_PUBLIC_API_BASE_URL
      delete process.env.NUXT_PUBLIC_API_BASE_URL
      
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
      
      // Restore original environment
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

    it('should use NUXT_PUBLIC_API_BASE_URL when runtime config is not set', () => {
      // Mock environment variables
      const originalNuxtPublicApiBaseUrl = process.env.NUXT_PUBLIC_API_BASE_URL
      
      process.env.NUXT_PUBLIC_API_BASE_URL = 'https://api.staging.com'
      
      // Reset config
      mockConfig.public = {
        apiBaseUrl: undefined,
        primevue: { options: { theme: { preset: {} } } }
      }
      
      const { apiBaseUrl } = useApiConfig()
      
      expect(apiBaseUrl.value).toBe('https://api.staging.com')
      
      // Restore original environment
      process.env.NUXT_PUBLIC_API_BASE_URL = originalNuxtPublicApiBaseUrl
    })
  })

  describe('error handling', () => {
    it('should throw error when no API base URL is configured', () => {
      // Clear environment variables
      const originalNuxtPublicApiBaseUrl = process.env.NUXT_PUBLIC_API_BASE_URL
      delete process.env.NUXT_PUBLIC_API_BASE_URL
      
      // Mock non-development environment
      const originalNodeEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'production'
      
      // Reset config with undefined values
      mockConfig.public = {
        apiBaseUrl: undefined,
        primevue: { options: { theme: { preset: {} } } }
      }
      
      // Mock window as undefined for server-side test
      const originalWindow = global.window
      delete (global as any).window
      
      const { apiBaseUrl } = useApiConfig()
      
      // apiBaseUrl should throw error when no URL is configured
      expect(() => apiBaseUrl.value).toThrow('NUXT_PUBLIC_API_BASE_URL environment variable is not set')
      
      // Restore original environment
      process.env.NUXT_PUBLIC_API_BASE_URL = originalNuxtPublicApiBaseUrl
      process.env.NODE_ENV = originalNodeEnv
      global.window = originalWindow
    })

    it('should use runtime config when environment variables are not set', () => {
      // Clear environment variables
      const originalNuxtPublicApiBaseUrl = process.env.NUXT_PUBLIC_API_BASE_URL
      delete process.env.NUXT_PUBLIC_API_BASE_URL
      
      // Set runtime config
      mockConfig.public = {
        apiBaseUrl: 'https://api.runtime.com',
        primevue: { options: { theme: { preset: {} } } }
      }
      
      const { apiBaseUrl } = useApiConfig()
      
      expect(apiBaseUrl.value).toBe('https://api.runtime.com')
      
      // Restore original environment
      process.env.NUXT_PUBLIC_API_BASE_URL = originalNuxtPublicApiBaseUrl
    })

    it('should use current host as fallback in production when no config is available', () => {
      // Mock production environment
      const originalNodeEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'production'
      
      // Mock window.location
      const originalLocation = window.location
      Object.defineProperty(window, 'location', {
        value: {
          protocol: 'https:',
          host: 'example.com'
        },
        writable: true
      })
      
      // Clear environment variables
      const originalNuxtPublicApiBaseUrl = process.env.NUXT_PUBLIC_API_BASE_URL
      delete process.env.NUXT_PUBLIC_API_BASE_URL
      
      // Reset config
      mockConfig.public = {
        apiBaseUrl: undefined,
        primevue: { options: { theme: { preset: {} } } }
      }
      
      const { apiBaseUrl } = useApiConfig()
      
      expect(apiBaseUrl.value).toBe('https://example.com')
      
      // Restore original values
      process.env.NODE_ENV = originalNodeEnv
      Object.defineProperty(window, 'location', {
        value: originalLocation,
        writable: true
      })
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
        apiBaseUrl: 'http://localhost:3000',
        apiTimeout: 5000,
        primevue: { options: { theme: { preset: {} } } }
      }
      
      const { apiBaseUrl, apiTimeout } = useApiConfig()
      
      expect(typeof apiBaseUrl.value).toBe('string')
      expect(typeof apiTimeout.value).toBe('number')
    })
  })
})