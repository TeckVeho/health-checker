import { ref, watch, readonly, onMounted } from 'vue';

interface FilterState {
  showOnlyActive: boolean;
}

const STORAGE_KEY = 'repo-table-filter-state';

export function useFilterState() {
  const filterState = ref<FilterState>({ showOnlyActive: true });

  // Initialize filter state from localStorage or use default
  const getInitialFilterState = (): FilterState => {
    // Only access localStorage on client side
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored) as FilterState;
          return parsed;
        }
      } catch (error) {
        console.warn('Failed to parse stored filter state:', error);
      }
    }
    const defaultState = { showOnlyActive: true } as FilterState;
    return defaultState;
  };

  // Load filter state from localStorage after mount
  onMounted(() => {
    const storedState = getInitialFilterState();
    filterState.value = storedState;
  });

  // Save filter state to localStorage whenever it changes
  const saveFilterState = (state: FilterState) => {
    // Only access localStorage on client side
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      } catch (error) {
        console.warn('Failed to save filter state:', error);
      }
    }
  };

  // Watch for changes and save to localStorage
  watch(
    filterState,
    newState => {
      saveFilterState(newState);
    },
    { deep: true }
  );

  // Update showOnlyActive filter
  const updateShowOnlyActive = (showOnlyActive: boolean) => {
    filterState.value.showOnlyActive = showOnlyActive;
  };

  // Toggle showOnlyActive filter
  const toggleShowOnlyActive = () => {
    filterState.value.showOnlyActive = !filterState.value.showOnlyActive;
  };

  // Clear filter state (reset to default)
  const clearFilterState = () => {
    filterState.value = { showOnlyActive: true };
  };

  return {
    filterState: readonly(filterState),
    updateShowOnlyActive,
    toggleShowOnlyActive,
    clearFilterState,
  };
}
