import { describe, it, expect, beforeEach, vi } from 'vitest'
import { nextTick } from 'vue'
import { useCheckTypeSortState } from '~/composables/useCheckTypeSortState'

// Override process.client for this test
Object.defineProperty(process, 'client', {
  value: true,
  writable: true
})

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
})

describe('useCheckTypeSortState', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.getItem.mockReturnValue(null)
  })

  describe('initialization', () => {
    it('should return expected properties and methods', () => {
      const result = useCheckTypeSortState()
      
      expect(result).toHaveProperty('sortState')
      expect(result).toHaveProperty('updateSortState')
      expect(result).toHaveProperty('clearSortState')
    })

    it('should initialize with default sort state when no stored state', () => {
      localStorageMock.getItem.mockReturnValue(null)
      
      const { sortState } = useCheckTypeSortState()
      
      expect(sortState.value).toEqual({
        field: 'totalViolations',
        order: 'desc'
      })
    })

    it('should handle invalid stored state gracefully', () => {
      localStorageMock.getItem.mockReturnValue('invalid json')
      
      const { sortState } = useCheckTypeSortState()
      
      expect(sortState.value).toEqual({
        field: 'totalViolations',
        order: 'desc'
      })
    })
  })

  describe('updateSortState', () => {
    it('should update sort state correctly', () => {
      const { sortState, updateSortState } = useCheckTypeSortState()
      
      updateSortState('name', 'asc')
      
      expect(sortState.value).toEqual({
        field: 'name',
        order: 'asc'
      })
    })

    it('should save updated state to localStorage', async () => {
      const { updateSortState } = useCheckTypeSortState()
      
      updateSortState('totalViolations', 'desc')
      
      // Wait for the next tick to allow the watch to trigger
      await nextTick()
      
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'checktype-table-sort-state',
        JSON.stringify({ field: 'totalViolations', order: 'desc' })
      )
    })
  })

  describe('clearSortState', () => {
    it('should reset sort state to default', () => {
      const { sortState, updateSortState, clearSortState } = useCheckTypeSortState()
      
      // First update to a different state
      updateSortState('name', 'asc')
      expect(sortState.value).toEqual({ field: 'name', order: 'asc' })
      
      // Then clear
      clearSortState()
      
      expect(sortState.value).toEqual({
        field: 'totalViolations',
        order: 'desc'
      })
    })

    it('should save default state to localStorage when cleared', async () => {
      const { clearSortState } = useCheckTypeSortState()
      
      clearSortState()
      
      // Wait for the next tick to allow the watch to trigger
      await nextTick()
      
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'checktype-table-sort-state',
        JSON.stringify({ field: 'totalViolations', order: 'desc' })
      )
    })
  })

  describe('persistence', () => {
    it('should save state changes to localStorage', async () => {
      const { updateSortState } = useCheckTypeSortState()
      
      updateSortState('owner', 'asc')
      
      // Wait for the next tick to allow the watch to trigger
      await nextTick()
      
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'checktype-table-sort-state',
        JSON.stringify({ field: 'owner', order: 'asc' })
      )
    })

    it('should handle localStorage errors gracefully', async () => {
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('localStorage error')
      })
      
      const { updateSortState } = useCheckTypeSortState()
      
      // Should not throw an error
      expect(() => updateSortState('name', 'asc')).not.toThrow()
      
      // Wait for the next tick
      await nextTick()
    })
  })
})
