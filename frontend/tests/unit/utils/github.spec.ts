import { describe, it, expect } from 'vitest'
import { processIssueNumbers, getIssueUrl } from '@/utils/github'

describe('GitHub Utils', () => {
  describe('processIssueNumbers', () => {
    it('should convert issue numbers to clickable links', () => {
      const text = 'Issue #123 lacks clear instructions'
      const owner = 'test-owner'
      const repo = 'test-repo'
      
      const result = processIssueNumbers(text, owner, repo)
      
      expect(result).toContain('<a href="https://github.com/test-owner/test-repo/issues/123"')
      expect(result).toContain('target="_blank"')
      expect(result).toContain('rel="noopener noreferrer"')
      expect(result).toContain('class="text-blue-600 hover:text-blue-800 hover:underline transition-colors duration-200"')
      expect(result).toContain('>#123</a>')
    })

    it('should handle multiple issue numbers in the same text', () => {
      const text = 'Issue #123 and #456 need attention'
      const owner = 'test-owner'
      const repo = 'test-repo'
      
      const result = processIssueNumbers(text, owner, repo)
      
      expect(result).toContain('href="https://github.com/test-owner/test-repo/issues/123"')
      expect(result).toContain('href="https://github.com/test-owner/test-repo/issues/456"')
      expect(result).toContain('>#123</a>')
      expect(result).toContain('>#456</a>')
    })

    it('should return original text when no issue numbers are found', () => {
      const text = 'This is a regular description without issue numbers'
      const owner = 'test-owner'
      const repo = 'test-repo'
      
      const result = processIssueNumbers(text, owner, repo)
      
      expect(result).toBe(text)
    })

    it('should return empty string when text is null or undefined', () => {
      const owner = 'test-owner'
      const repo = 'test-repo'
      
      expect(processIssueNumbers(null as any, owner, repo)).toBe('')
      expect(processIssueNumbers(undefined as any, owner, repo)).toBe('')
    })

    it('should return original text when owner or repo is missing', () => {
      const text = 'Issue #123 needs attention'
      
      expect(processIssueNumbers(text, '', 'test-repo')).toBe(text)
      expect(processIssueNumbers(text, 'test-owner', '')).toBe(text)
      expect(processIssueNumbers(text, '', '')).toBe(text)
    })

    it('should handle issue numbers at the beginning of text', () => {
      const text = '#123 is the first issue'
      const owner = 'test-owner'
      const repo = 'test-repo'
      
      const result = processIssueNumbers(text, owner, repo)
      
      expect(result).toContain('<a href="https://github.com/test-owner/test-repo/issues/123"')
      expect(result).toContain('>#123</a>')
    })

    it('should handle issue numbers at the end of text', () => {
      const text = 'This is the last issue #789'
      const owner = 'test-owner'
      const repo = 'test-repo'
      
      const result = processIssueNumbers(text, owner, repo)
      
      expect(result).toContain('<a href="https://github.com/test-owner/test-repo/issues/789"')
      expect(result).toContain('>#789</a>')
    })
  })

  describe('getIssueUrl', () => {
    it('should generate correct issue URL', () => {
      const result = getIssueUrl('test-owner', 'test-repo', 123)
      expect(result).toBe('https://github.com/test-owner/test-repo/issues/123')
    })

    it('should return # for invalid parameters', () => {
      expect(getIssueUrl('', 'test-repo', 123)).toBe('#')
      expect(getIssueUrl('test-owner', '', 123)).toBe('#')
      expect(getIssueUrl('test-owner', 'test-repo', 0)).toBe('#')
      expect(getIssueUrl('test-owner', 'test-repo', -1)).toBe('#')
    })
  })
}) 