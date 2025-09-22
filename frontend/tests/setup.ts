import '@testing-library/jest-dom'
import { vi } from 'vitest'
import { mount, VueWrapper } from '@vue/test-utils'
import { config } from '@vue/test-utils'

// Make mount available globally
declare global {
  var mount: typeof import('@vue/test-utils').mount
}

global.mount = mount

// Configure Vue Test Utils
config.global.mocks = {
  $t: (key: string) => key,
  $tc: (key: string) => key,
  $te: (key: string) => true,
  $d: (value: any) => value,
  $n: (value: any) => value,
}

// Mock process.client for browser environment
Object.defineProperty(process, 'client', {
  value: false,
  writable: true
})

// Mock localStorage
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  },
  writable: true
})

// Set test environment variables
process.env.API_BASE_URL = 'http://localhost:3000'

// Global mocks
global.console = {
  ...console,
  error: vi.fn(),
  warn: vi.fn(),
} 