// Mock for Nuxt app functions
import { vi } from 'vitest'
import { reactive } from 'vue'

// Create a reactive config object that can be modified in tests
const mockRuntimeConfig = reactive({
  public: {
    apiBaseUrl: 'http://localhost:3000',
    apiTimeout: 10000
  }
})

export const useNuxtApp = vi.fn(() => ({
  $toast: {
    add: vi.fn()
  },
  $config: mockRuntimeConfig
}))

export const useRuntimeConfig = vi.fn(() => mockRuntimeConfig)