import { describe, it, expect } from 'vitest'
import { 
  createErrorContext, 
  formatError, 
  logError, 
  isApiError, 
  getErrorMessage,
  ErrorContext 
} from '~/utils/errors'

describe('errors', () => {
  describe('createErrorContext', () => {
    it('should create error context with basic information', () => {
      const context = createErrorContext('Test error', 'test-component')
      
      expect(context).toHaveProperty('message')
      expect(context).toHaveProperty('component')
      expect(context).toHaveProperty('timestamp')
      expect(context.message).toBe('Test error')
      expect(context.component).toBe('test-component')
      expect(context.timestamp).toBeInstanceOf(Date)
    })

    it('should create error context with additional data', () => {
      const additionalData = { userId: '123', action: 'fetch' }
      const context = createErrorContext('Test error', 'test-component', additionalData)
      
      expect(context).toHaveProperty('message')
      expect(context).toHaveProperty('component')
      expect(context).toHaveProperty('timestamp')
      expect(context).toHaveProperty('userId')
      expect(context).toHaveProperty('action')
      expect(context.userId).toBe('123')
      expect(context.action).toBe('fetch')
    })

    it('should handle empty additional data', () => {
      const context = createErrorContext('Test error', 'test-component', {})
      
      expect(context).toHaveProperty('message')
      expect(context).toHaveProperty('component')
      expect(context).toHaveProperty('timestamp')
    })
  })

  describe('formatError', () => {
    it('should format error with message and component', () => {
      const error = new Error('Test error')
      const formatted = formatError(error, 'test-component')
      
      expect(formatted).toContain('Test error')
      expect(formatted).toContain('test-component')
      expect(formatted).toBe('[test-component] Test error')
    })

    it('should format error with additional context', () => {
      const error = new Error('Test error')
      const context = { userId: '123', action: 'fetch' }
      const formatted = formatError(error, 'test-component', context)
      
      expect(formatted).toContain('Test error')
      expect(formatted).toContain('test-component')
      expect(formatted).toContain('{"userId":"123","action":"fetch"}')
    })

    it('should handle string errors', () => {
      const error = 'String error message'
      const formatted = formatError(error, 'test-component')
      
      expect(formatted).toContain('String error message')
      expect(formatted).toContain('test-component')
    })

    it('should handle unknown error types', () => {
      const error = { someProperty: 'value' }
      const formatted = formatError(error, 'test-component')
      
      expect(formatted).toContain('test-component')
      expect(formatted).toContain('An unknown error occurred')
    })
  })

  describe('logError', () => {
    it('should log error to console', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      
      const error = new Error('Test error')
      logError(error, 'test-component')
      
      expect(consoleSpy).toHaveBeenCalled()
      
      consoleSpy.mockRestore()
    })

    it('should log error with context', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      
      const error = new Error('Test error')
      const context = { userId: '123' }
      logError(error, 'test-component', context)
      
      expect(consoleSpy).toHaveBeenCalled()
      
      consoleSpy.mockRestore()
    })
  })

  describe('isApiError', () => {
    it('should identify API errors correctly', () => {
      const apiError = {
        response: {
          status: 404,
          data: { message: 'Not found' }
        }
      }
      
      expect(isApiError(apiError)).toBe(true)
    })

    it('should identify non-API errors correctly', () => {
      const regularError = new Error('Regular error')
      
      expect(isApiError(regularError)).toBe(false)
    })

    it('should handle null/undefined', () => {
      expect(isApiError(null)).toBe(false)
      expect(isApiError(undefined)).toBe(false)
    })

    it('should handle objects without response property', () => {
      const objectError = { message: 'Some error' }
      
      expect(isApiError(objectError)).toBe(false)
    })
  })

  describe('getErrorMessage', () => {
    it('should extract message from API error', () => {
      const apiError = {
        response: {
          data: {
            message: 'API error message'
          }
        }
      }
      
      expect(getErrorMessage(apiError)).toBe('API error message')
    })

    it('should extract message from regular error', () => {
      const error = new Error('Regular error message')
      
      expect(getErrorMessage(error)).toBe('Regular error message')
    })

    it('should handle string errors', () => {
      const error = 'String error message'
      
      expect(getErrorMessage(error)).toBe('String error message')
    })

    it('should return default message for unknown error types', () => {
      const error = { someProperty: 'value' }
      
      expect(getErrorMessage(error)).toBe('An unknown error occurred')
    })

    it('should handle null/undefined', () => {
      expect(getErrorMessage(null)).toBe('An unknown error occurred')
      expect(getErrorMessage(undefined)).toBe('An unknown error occurred')
    })

    it('should handle API error without message', () => {
      const apiError = {
        response: {
          data: {}
        }
      }
      
      expect(getErrorMessage(apiError)).toBe('An API error occurred')
    })

    it('should handle API error without data', () => {
      const apiError = {
        response: {
          data: {}
        }
      }
      
      expect(getErrorMessage(apiError)).toBe('An API error occurred')
    })
  })

  describe('ErrorContext interface', () => {
    it('should have correct structure', () => {
      const context: ErrorContext = {
        message: 'Test error',
        component: 'test-component',
        timestamp: new Date(),
        userId: '123',
        action: 'fetch'
      }
      
      expect(context).toHaveProperty('message')
      expect(context).toHaveProperty('component')
      expect(context).toHaveProperty('timestamp')
      expect(context).toHaveProperty('userId')
      expect(context).toHaveProperty('action')
    })
  })
})
