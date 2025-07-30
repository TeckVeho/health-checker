import { ref, watch, readonly, onMounted } from 'vue'

type TabValue = 'severity' | 'checkType'

const STORAGE_KEY = 'health-checker-active-tab'

export function useTabState() {
  const activeTab = ref<TabValue>('severity')

  // Initialize tab state from localStorage or use default
  const getInitialTabState = (): TabValue => {
    // Only access localStorage on client side
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const stored = localStorage.getItem(STORAGE_KEY)
        if (stored && (stored === 'severity' || stored === 'checkType')) {
          return stored as TabValue
        }
      } catch (error) {
        console.warn('Failed to parse stored tab state:', error)
      }
    }
    return 'severity' as TabValue
  }

  // Load tab state from localStorage after mount
  onMounted(() => {
    const storedTab = getInitialTabState()
    activeTab.value = storedTab
  })

  // Save tab state to localStorage whenever it changes
  const saveTabState = (tab: TabValue) => {
    // Only access localStorage on client side
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        localStorage.setItem(STORAGE_KEY, tab)
      } catch (error) {
        console.warn('Failed to save tab state:', error)
      }
    }
  }

  // Watch for changes and save to localStorage
  watch(activeTab, (newTab) => {
    saveTabState(newTab)
  })

  // Update active tab
  const setActiveTab = (tab: TabValue) => {
    activeTab.value = tab
  }

  // Get current active tab
  const getActiveTab = (): TabValue => {
    return activeTab.value
  }

  return {
    activeTab: readonly(activeTab),
    setActiveTab,
    getActiveTab,
  }
} 