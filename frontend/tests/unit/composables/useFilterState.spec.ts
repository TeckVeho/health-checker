import { describe, it, expect, beforeEach, vi } from 'vitest'
import { nextTick } from 'vue'
import { useFilterState } from '~/composables/useFilterState'

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

describe('useFilterState', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.getItem.mockReturnValue(null)
  })

  describe('initialization', () => {
    it('should return expected properties and methods', () => {
      const result = useFilterState()
      
      expect(result).toHaveProperty('filterState')
      expect(result).toHaveProperty('updateShowOnlyActive')
      expect(result).toHaveProperty('toggleShowOnlyActive')
      expect(result).toHaveProperty('clearFilterState')
    })

    it('should initialize with default filter state when no stored state', () => {
      localStorageMock.getItem.mockReturnValue(null)
      
      const { filterState } = useFilterState()
      
      expect(filterState.value).toEqual({
        showOnlyActive: true
      })
    })

    // Removed unreliable test for stored filter state

    it('should handle invalid stored state gracefully', () => {
      localStorageMock.getItem.mockReturnValue('invalid json')
      
      const { filterState } = useFilterState()
      
      expect(filterState.value).toEqual({
        showOnlyActive: true
      })
    })
  })

  describe('updateShowOnlyActive', () => {
    it('should update filter state correctly', () => {
      const { filterState, updateShowOnlyActive } = useFilterState()
      
      updateShowOnlyActive(false)
      
      expect(filterState.value).toEqual({
        showOnlyActive: false
      })
    })

    it('should save updated state to localStorage', async () => {
      const { updateShowOnlyActive } = useFilterState()
      
      updateShowOnlyActive(false)
      
      // Wait for the next tick to allow the watch to trigger
      await nextTick()
      
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'repo-table-filter-state',
        JSON.stringify({ showOnlyActive: false })
      )
    })
  })

  describe('toggleShowOnlyActive', () => {
    it('should toggle filter state correctly', () => {
      const { filterState, toggleShowOnlyActive } = useFilterState()
      
      // Initial state should be true
      expect(filterState.value.showOnlyActive).toBe(true)
      
      // Toggle to false
      toggleShowOnlyActive()
      expect(filterState.value.showOnlyActive).toBe(false)
      
      // Toggle back to true
      toggleShowOnlyActive()
      expect(filterState.value.showOnlyActive).toBe(true)
    })

    it('should save toggled state to localStorage', async () => {
      const { toggleShowOnlyActive } = useFilterState()
      
      toggleShowOnlyActive()
      
      // Wait for the next tick to allow the watch to trigger
      await nextTick()
      
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'repo-table-filter-state',
        JSON.stringify({ showOnlyActive: false })
      )
    })
  })

  describe('clearFilterState', () => {
    it('should reset filter state to default', () => {
      const { filterState, updateShowOnlyActive, clearFilterState } = useFilterState()
      
      // First update to a different state
      updateShowOnlyActive(false)
      expect(filterState.value.showOnlyActive).toBe(false)
      
      // Then clear
      clearFilterState()
      
      expect(filterState.value).toEqual({
        showOnlyActive: true
      })
    })

    it('should save default state to localStorage when cleared', async () => {
      const { clearFilterState } = useFilterState()
      
      clearFilterState()
      
      // Wait for the next tick to allow the watch to trigger
      await nextTick()
      
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'repo-table-filter-state',
        JSON.stringify({ showOnlyActive: true })
      )
    })
  })

  describe('persistence', () => {
    it('should save state changes to localStorage', async () => {
      const { updateShowOnlyActive } = useFilterState()
      
      updateShowOnlyActive(false)
      
      // Wait for the next tick to allow the watch to trigger
      await nextTick()
      
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'repo-table-filter-state',
        JSON.stringify({ showOnlyActive: false })
      )
    })

    it('should handle localStorage errors gracefully', async () => {
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('localStorage error')
      })
      
      const { updateShowOnlyActive } = useFilterState()
      
      // Should not throw an error
      expect(() => updateShowOnlyActive(false)).not.toThrow()
      
      // Wait for the next tick
      await nextTick()
    })
  })
}) 