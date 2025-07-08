import '@testing-library/jest-dom'
import { vi } from 'vitest'

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

// Global mocks
global.console = {
  ...console,
  error: vi.fn(),
  warn: vi.fn(),
} 