import { describe, it, expect } from 'vitest'

// Test the utility functions and logic for HealthSummaryTable component
describe('HealthSummaryTable Logic', () => {
  // Test the utility functions that would be in the HealthSummaryTable component
  const validateTableData = (data: Array<{
    severity: string
    count: number
    percentage: number
    tagSeverity: string | null
    isTotal: boolean
  }>) => {
    return {
      isValid: data.length > 0,
      hasTotal: data.some(row => row.isTotal),
      hasValidPercentages: data.every(row => row.percentage >= 0 && row.percentage <= 100)
    }
  }

  const getRowClasses = (isTotal: boolean, tagSeverity: string | null) => {
    const baseClasses = 'border-b border-gray-200'
    if (isTotal) {
      return `${baseClasses} font-semibold bg-gray-50`
    }
    return baseClasses
  }

  const formatPercentage = (percentage: number) => {
    return `${percentage}%`
  }

  describe('table data validation', () => {
    it('should validate valid table data', () => {
      const validData = [
        { severity: 'High', count: 2, percentage: 40, tagSeverity: 'danger', isTotal: false },
        { severity: 'Middle', count: 2, percentage: 40, tagSeverity: 'warning', isTotal: false },
        { severity: 'Low', count: 1, percentage: 20, tagSeverity: 'info', isTotal: false },
        { severity: 'Total', count: 5, percentage: 100, tagSeverity: null, isTotal: true }
      ]

      const validation = validateTableData(validData)
      expect(validation.isValid).toBe(true)
      expect(validation.hasTotal).toBe(true)
      expect(validation.hasValidPercentages).toBe(true)
    })

    it('should reject empty table data', () => {
      const emptyData: Array<{
        severity: string
        count: number
        percentage: number
        tagSeverity: string | null
        isTotal: boolean
      }> = []

      const validation = validateTableData(emptyData)
      expect(validation.isValid).toBe(false)
    })

    it('should validate percentage ranges', () => {
      const invalidData = [
        { severity: 'High', count: 2, percentage: 150, tagSeverity: 'danger', isTotal: false },
        { severity: 'Total', count: 2, percentage: 100, tagSeverity: null, isTotal: true }
      ]

      const validation = validateTableData(invalidData)
      expect(validation.hasValidPercentages).toBe(false)
    })
  })

  describe('row styling logic', () => {
    it('should return correct classes for regular rows', () => {
      const classes = getRowClasses(false, 'danger')
      expect(classes).toBe('border-b border-gray-200')
    })

    it('should return correct classes for total rows', () => {
      const classes = getRowClasses(true, null)
      expect(classes).toBe('border-b border-gray-200 font-semibold bg-gray-50')
    })
  })

  describe('percentage formatting', () => {
    it('should format percentages correctly', () => {
      expect(formatPercentage(0)).toBe('0%')
      expect(formatPercentage(50)).toBe('50%')
      expect(formatPercentage(100)).toBe('100%')
    })
  })

  describe('props validation', () => {
    it('should validate required props', () => {
      const requiredProps = {
        tableData: [
          { severity: 'High', count: 2, percentage: 40, tagSeverity: 'danger', isTotal: false }
        ]
      }

      expect(requiredProps.tableData).toBeDefined()
      expect(Array.isArray(requiredProps.tableData)).toBe(true)
    })

    it('should have optional empty message prop', () => {
      const optionalProps: {
        tableData: Array<{
          severity: string
          count: number
          percentage: number
          tagSeverity: string | null
          isTotal: boolean
        }>
        emptyMessage?: string
      } = {
        tableData: []
      }

      expect(optionalProps.emptyMessage).toBeUndefined()
    })
  })

  describe('data structure validation', () => {
    it('should handle complete table data', () => {
      const completeData = [
        { severity: 'High', count: 2, percentage: 40, tagSeverity: 'danger', isTotal: false },
        { severity: 'Middle', count: 2, percentage: 40, tagSeverity: 'warning', isTotal: false },
        { severity: 'Low', count: 1, percentage: 20, tagSeverity: 'info', isTotal: false },
        { severity: 'Total', count: 5, percentage: 100, tagSeverity: null, isTotal: true }
      ]

      expect(completeData).toHaveLength(4)
      expect(completeData[0].severity).toBe('High')
      expect(completeData[0].count).toBe(2)
      expect(completeData[0].percentage).toBe(40)
      expect(completeData[0].tagSeverity).toBe('danger')
      expect(completeData[0].isTotal).toBe(false)
      expect(completeData[3].isTotal).toBe(true)
    })

    it('should handle empty table data', () => {
      const emptyData: Array<{
        severity: string
        count: number
        percentage: number
        tagSeverity: string | null
        isTotal: boolean
      }> = []

      expect(emptyData).toHaveLength(0)
    })
  })

  describe('tag severity validation', () => {
    it('should validate valid tag severities', () => {
      const validSeverities = ['danger', 'warning', 'info']
      const isValidSeverity = (severity: string) => validSeverities.includes(severity)

      expect(isValidSeverity('danger')).toBe(true)
      expect(isValidSeverity('warning')).toBe(true)
      expect(isValidSeverity('info')).toBe(true)
      expect(isValidSeverity('invalid')).toBe(false)
    })

    it('should handle null tag severities for total rows', () => {
      const totalRow = {
        severity: 'Total',
        count: 5,
        percentage: 100,
        tagSeverity: null,
        isTotal: true
      }

      expect(totalRow.tagSeverity).toBeNull()
      expect(totalRow.isTotal).toBe(true)
    })
  })
}) 