import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useTabState } from '~/composables/useTabState'

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

describe('useTabState', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.getItem.mockReturnValue(null)
  })

  describe('initialization', () => {
    it('should return expected properties and methods', () => {
      const result = useTabState()
      
      expect(result).toHaveProperty('activeTab')
      expect(result).toHaveProperty('setActiveTab')
      expect(result).toHaveProperty('getActiveTab')
    })

    it('should initialize with default tab when no stored state', () => {
      localStorageMock.getItem.mockReturnValue(null)
      
      const { activeTab } = useTabState()
      
      expect(activeTab.value).toBe('severity')
    })

    it('should load stored tab state', async () => {
      localStorageMock.getItem.mockReturnValue('checkType')
      
      const { activeTab } = useTabState()
      
      // Wait for onMounted to execute
      await new Promise(resolve => setTimeout(resolve, 0))
      
      expect(activeTab.value).toBe('checkType')
    })

    it('should handle invalid stored state gracefully', async () => {
      localStorageMock.getItem.mockReturnValue('invalid-tab')
      
      const { activeTab } = useTabState()
      
      // Wait for onMounted to execute
      await new Promise(resolve => setTimeout(resolve, 0))
      
      expect(activeTab.value).toBe('severity')
    })
  })

  describe('setActiveTab', () => {
    it('should update active tab', () => {
      const { activeTab, setActiveTab } = useTabState()
      
      setActiveTab('checkType')
      
      expect(activeTab.value).toBe('checkType')
    })

    it('should save tab state to localStorage', async () => {
      const { setActiveTab } = useTabState()
      
      setActiveTab('checkType')
      
      // Wait for the next tick to allow the watch to trigger
      await new Promise(resolve => setTimeout(resolve, 0))
      
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'health-checker-active-tab',
        'checkType'
      )
    })

    it('should handle all valid tab values', () => {
      const { activeTab, setActiveTab } = useTabState()
      
      const validTabs = ['severity', 'checkType']
      
      validTabs.forEach(tab => {
        setActiveTab(tab)
        expect(activeTab.value).toBe(tab)
      })
    })
  })


  describe('persistence', () => {
    it('should save tab changes to localStorage', async () => {
      const { setActiveTab } = useTabState()
      
      setActiveTab('checkType')
      
      // Wait for the next tick to allow the watch to trigger
      await new Promise(resolve => setTimeout(resolve, 0))
      
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'health-checker-active-tab',
        'checkType'
      )
    })

    it('should handle localStorage errors gracefully', async () => {
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('localStorage error')
      })
      
      const { setActiveTab } = useTabState()
      
      // Should not throw an error
      expect(() => setActiveTab('checkType')).not.toThrow()
      
      // Wait for the next tick
      await new Promise(resolve => setTimeout(resolve, 0))
    })
  })

  describe('tab validation', () => {
    it('should accept valid tab values', () => {
      const { setActiveTab, activeTab } = useTabState()
      
      const validTabs = ['severity', 'checkType']
      
      validTabs.forEach(tab => {
        setActiveTab(tab)
        expect(activeTab.value).toBe(tab)
      })
    })

    it('should handle invalid tab values gracefully', () => {
      const { setActiveTab, activeTab } = useTabState()
      
      // Set initial valid tab
      setActiveTab('severity')
      expect(activeTab.value).toBe('severity')
      
      // Try to set invalid tab - should not change
      setActiveTab('invalid-tab' as any)
      expect(activeTab.value).toBe('severity')
    })
  })

  describe('reactive updates', () => {
    it('should be reactive to tab changes', () => {
      const { activeTab, setActiveTab } = useTabState()
      
      expect(activeTab.value).toBe('severity')
      
      setActiveTab('checkType')
      expect(activeTab.value).toBe('checkType')
      
      setActiveTab('severity')
      expect(activeTab.value).toBe('severity')
    })
  })
})
