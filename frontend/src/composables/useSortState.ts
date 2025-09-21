import { ref, watch, readonly, onMounted } from 'vue';

interface SortState {
  field: string;
  order: 'asc' | 'desc';
}

const STORAGE_KEY = 'repo-table-sort-state';

export function useSortState() {
  const sortState = ref<SortState>({ field: 'totalViolations', order: 'desc' });

  // Initialize sort state from localStorage or use default
  const getInitialSortState = (): SortState => {
    // Only access localStorage on client side
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored) as SortState;
          return parsed;
        }
      } catch (error) {
        console.warn('Failed to parse stored sort state:', error);
      }
    }
    const defaultState = {
      field: 'totalViolations',
      order: 'desc',
    } as SortState;
    return defaultState;
  };

  // Load sort state from localStorage after mount
  onMounted(() => {
    const storedState = getInitialSortState();
    sortState.value = storedState;
  });

  // Save sort state to localStorage whenever it changes
  const saveSortState = (state: SortState) => {
    // Only access localStorage on client side
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      } catch (error) {
        console.warn('Failed to save sort state:', error);
      }
    }
  };

  // Watch for changes and save to localStorage
  watch(
    sortState,
    newState => {
      saveSortState(newState);
    },
    { deep: true }
  );

  // Update sort state
  const updateSortState = (field: string, order: 'asc' | 'desc') => {
    sortState.value = { field, order };
  };

  // Clear sort state (reset to default)
  const clearSortState = () => {
    sortState.value = { field: 'totalViolations', order: 'desc' };
  };

  return {
    sortState: readonly(sortState),
    updateSortState,
    clearSortState,
  };
}
