import { ref, computed, watch, onMounted, readonly } from 'vue';
import { useRoute, useRouter } from 'vue-router';

type AlertsTabValue = 'active' | 'resolved';

interface TabState {
  sortField?: string;
  sortOrder?: 'asc' | 'desc';
  filters?: Record<string, unknown>;
  currentPage?: number;
  pageSize?: number;
}

interface AlertsTabState {
  activeTab: AlertsTabValue;
  tabStates: {
    active: TabState;
    resolved: TabState;
  };
}

const STORAGE_KEY = 'health-checker-alerts-tab-state';

export function useAlertsTabs() {
  const route = useRoute();
  const router = useRouter();

  // Initialize tab state from localStorage, URL query, or use default
  const getInitialTabState = (): AlertsTabState => {
    // Check URL query parameter first
    const tabFromUrl = route.query.tab as string;
    let initialTab: AlertsTabValue = 'active';
    let initialTabStates = {
      active: {},
      resolved: {
        currentPage: 1,
        pageSize: 50
      }
    };
    
    if (tabFromUrl === 'active' || tabFromUrl === 'resolved') {
      initialTab = tabFromUrl;
    } else {
      // Only access localStorage on client side if no URL query
      if (typeof window !== 'undefined' && window.localStorage) {
        try {
          const stored = localStorage.getItem(STORAGE_KEY);
          if (stored) {
            const parsed = JSON.parse(stored);
            // Validate the stored state
            if (parsed.activeTab && (parsed.activeTab === 'active' || parsed.activeTab === 'resolved')) {
              initialTab = parsed.activeTab;
              // Restore tab states from localStorage
              initialTabStates = {
                active: parsed.tabStates?.active || {},
                resolved: {
                  currentPage: 1,
                  pageSize: 50,
                  ...parsed.tabStates?.resolved
                }
              };
            }
          }
        } catch (error) {
          console.warn('Failed to parse stored alerts tab state:', error);
        }
      }
    }

    return {
      activeTab: initialTab,
      tabStates: initialTabStates
    };
  };

  const state = ref<AlertsTabState>(getInitialTabState());

  // Load tab state from localStorage after mount (for SSR compatibility)
  onMounted(() => {
    const storedTab = getInitialTabState();
    state.value = storedTab;
  });

  // Save tab state to localStorage whenever it changes
  const saveTabState = (newState: AlertsTabState) => {
    // Only access localStorage on client side
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
      } catch (error) {
        console.warn('Failed to save alerts tab state:', error);
      }
    }
  };

  // Watch for changes and save to localStorage
  watch(state, (newState) => {
    saveTabState(newState);
  }, { deep: true });

  // Update active tab with validation
  const setActiveTab = (tab: AlertsTabValue | string) => {
    console.log('setActiveTab called with:', tab);
    console.log('Current state.activeTab:', state.value.activeTab);
    
    if (tab === 'active' || tab === 'resolved') {
      state.value.activeTab = tab;
      console.log('Updated state.activeTab to:', state.value.activeTab);
      
      // Update URL query parameter
      const query = { ...route.query };
      query.tab = tab;
      router.replace({ query });
    } else {
      console.warn(
        `Invalid tab value: ${tab}. Valid values are: active, resolved`
      );
    }
  };

  // Get current active tab
  const getActiveTab = (): AlertsTabValue => {
    return state.value.activeTab;
  };

  // Get tab state for specific tab
  const getTabState = (tab: AlertsTabValue): TabState => {
    return state.value.tabStates[tab];
  };

  // Set tab state for specific tab
  const setTabState = (tab: AlertsTabValue, newState: Partial<TabState>) => {
    state.value.tabStates[tab] = {
      ...state.value.tabStates[tab],
      ...newState
    };
  };

  // Reset tab state
  const resetTabState = (tab: AlertsTabValue) => {
    if (tab === 'active') {
      state.value.tabStates.active = {};
    } else if (tab === 'resolved') {
      state.value.tabStates.resolved = {
        currentPage: 1,
        pageSize: 50
      };
    }
  };

  // Initialize from URL query parameters
  const initializeFromUrl = () => {
    const tabFromUrl = route.query.tab as string;
    if (tabFromUrl === 'active' || tabFromUrl === 'resolved') {
      state.value.activeTab = tabFromUrl;
    }
  };

  // Computed properties
  const isActiveTab = computed(() => state.value.activeTab === 'active');
  const isResolvedTab = computed(() => state.value.activeTab === 'resolved');

  return {
    // State
    activeTab: readonly(computed(() => state.value.activeTab)),
    tabStates: readonly(computed(() => state.value.tabStates)),
    isActiveTab,
    isResolvedTab,

    // Methods
    setActiveTab,
    getActiveTab,
    getTabState,
    setTabState,
    resetTabState,
    initializeFromUrl,

    // Constants
    TAB_VALUES: ['active', 'resolved'] as const,
  };
}
