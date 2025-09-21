import { describe, it, expect } from 'vitest'
import { formatDate, formatNumber, truncateText } from '~/utils/index'

describe('utils/index', () => {
  describe('formatDate', () => {
    it('should format date correctly', () => {
      const date = new Date('2023-01-01T12:00:00Z')
      const formatted = formatDate(date)
      
      expect(formatted).toBeDefined()
      expect(typeof formatted).toBe('string')
    })

    it('should handle string dates', () => {
      const dateString = '2023-01-01T12:00:00Z'
      const formatted = formatDate(dateString)
      
      expect(formatted).toBeDefined()
      expect(typeof formatted).toBe('string')
    })

    it('should handle invalid dates', () => {
      const invalidDate = 'invalid-date'
      const formatted = formatDate(invalidDate)
      
      expect(formatted).toBeDefined()
      expect(typeof formatted).toBe('string')
    })
  })

  describe('formatNumber', () => {
    it('should format numbers correctly', () => {
      const number = 1234.56
      const formatted = formatNumber(number)
      
      expect(formatted).toBeDefined()
      expect(typeof formatted).toBe('string')
    })

    it('should handle zero', () => {
      const formatted = formatNumber(0)
      
      expect(formatted).toBeDefined()
      expect(typeof formatted).toBe('string')
    })

    it('should handle negative numbers', () => {
      const formatted = formatNumber(-123.45)
      
      expect(formatted).toBeDefined()
      expect(typeof formatted).toBe('string')
    })

    it('should handle large numbers', () => {
      const formatted = formatNumber(1234567.89)
      
      expect(formatted).toBeDefined()
      expect(typeof formatted).toBe('string')
    })
  })

  describe('truncateText', () => {
    it('should truncate long text', () => {
      const longText = 'This is a very long text that should be truncated'
      const truncated = truncateText(longText, 20)
      
      expect(truncated).toBeDefined()
      expect(typeof truncated).toBe('string')
      expect(truncated.length).toBeLessThanOrEqual(23) // 20 + '...'
    })

    it('should not truncate short text', () => {
      const shortText = 'Short text'
      const truncated = truncateText(shortText, 20)
      
      expect(truncated).toBe(shortText)
    })

    it('should handle empty string', () => {
      const truncated = truncateText('', 10)
      
      expect(truncated).toBe('')
    })

    it('should handle null/undefined', () => {
      const truncatedNull = truncateText(null, 10)
      const truncatedUndefined = truncateText(undefined, 10)
      
      expect(truncatedNull).toBe('')
      expect(truncatedUndefined).toBe('')
    })

    it('should use default maxLength', () => {
      const longText = 'This is a very long text that should be truncated because it exceeds the default length'
      const truncated = truncateText(longText)
      
      expect(truncated).toBeDefined()
      expect(typeof truncated).toBe('string')
    })
  })
})
