import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useCustomToast } from '~/composables/useCustomToast'

// Mock useNuxtApp
const mockToast = {
  add: vi.fn()
}

vi.mock('#app', () => ({
  useNuxtApp: () => ({
    $toast: mockToast
  })
}))

describe('useCustomToast', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('success', () => {
    it('should call toast.add with success message', () => {
      const { success } = useCustomToast()

      success('Operation completed successfully')

      expect(mockToast.add).toHaveBeenCalledWith({
        severity: 'success',
        summary: 'Success',
        detail: 'Operation completed successfully',
        life: 3000
      })
    })

    it('should call toast.add with custom summary', () => {
      const { success } = useCustomToast()

      success('Data saved', 'Custom Success')

      expect(mockToast.add).toHaveBeenCalledWith({
        severity: 'success',
        summary: 'Custom Success',
        detail: 'Data saved',
        life: 3000
      })
    })
  })

  describe('error', () => {
    it('should call toast.add with error message', () => {
      const { error } = useCustomToast()

      error('Something went wrong')

      expect(mockToast.add).toHaveBeenCalledWith({
        severity: 'error',
        summary: 'Error',
        detail: 'Something went wrong',
        life: 4000
      })
    })

    it('should call toast.add with custom summary', () => {
      const { error } = useCustomToast()

      error('Database connection failed', 'Database Error')

      expect(mockToast.add).toHaveBeenCalledWith({
        severity: 'error',
        summary: 'Database Error',
        detail: 'Database connection failed',
        life: 4000
      })
    })
  })

  describe('warn', () => {
    it('should call toast.add with warning message', () => {
      const { warn } = useCustomToast()

      warn('Please check your input')

      expect(mockToast.add).toHaveBeenCalledWith({
        severity: 'warn',
        summary: 'Warning',
        detail: 'Please check your input',
        life: 3500
      })
    })

    it('should call toast.add with custom summary', () => {
      const { warn } = useCustomToast()

      warn('File size is large', 'File Warning')

      expect(mockToast.add).toHaveBeenCalledWith({
        severity: 'warn',
        summary: 'File Warning',
        detail: 'File size is large',
        life: 3500
      })
    })
  })

  describe('info', () => {
    it('should call toast.add with info message', () => {
      const { info } = useCustomToast()

      info('New features available')

      expect(mockToast.add).toHaveBeenCalledWith({
        severity: 'info',
        summary: 'Info',
        detail: 'New features available',
        life: 3000
      })
    })

    it('should call toast.add with custom summary', () => {
      const { info } = useCustomToast()

      info('System maintenance scheduled', 'Maintenance Notice')

      expect(mockToast.add).toHaveBeenCalledWith({
        severity: 'info',
        summary: 'Maintenance Notice',
        detail: 'System maintenance scheduled',
        life: 3000
      })
    })
  })

  describe('show', () => {
    it('should call toast.add with custom options', () => {
      const { show } = useCustomToast()

      const customOptions = {
        severity: 'success' as const,
        summary: 'Custom Summary',
        detail: 'Custom detail message',
        life: 6000
      }

      show(customOptions)

      expect(mockToast.add).toHaveBeenCalledWith(customOptions)
    })

    it('should call toast.add with minimal options', () => {
      const { show } = useCustomToast()

      const customOptions = {
        severity: 'error' as const,
        detail: 'Minimal error message'
      }

      show(customOptions)

      expect(mockToast.add).toHaveBeenCalledWith(customOptions)
    })
  })

  describe('error handling', () => {
    it('should handle toast.add throwing an error', () => {
      mockToast.add.mockImplementation(() => {
        throw new Error('Toast error')
      })

      const { success } = useCustomToast()

      // Should not throw an error
      expect(() => success('Test message')).not.toThrow()
    })
  })
})
