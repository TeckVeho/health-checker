import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ref } from 'vue';
import { useAlertsTabs } from '~/composables/useAlertsTabs';

// Mock vue-router
const mockPush = vi.fn();
const mockReplace = vi.fn();
let mockQuery = {};

vi.mock('vue-router', () => ({
  useRoute: () => ({
    query: mockQuery,
  }),
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
  }),
}));

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('useAlertsTabs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  it('should initialize with default state', () => {
    const { activeTab, tabStates } = useAlertsTabs();

    expect(activeTab.value).toBe('active');
    expect(tabStates.value.active).toEqual({});
    expect(tabStates.value.resolved).toEqual({
      currentPage: 1,
      pageSize: 50,
    });
  });

  it('should set active tab correctly', () => {
    const { setActiveTab, activeTab } = useAlertsTabs();

    setActiveTab('resolved');
    expect(activeTab.value).toBe('resolved');

    setActiveTab('active');
    expect(activeTab.value).toBe('active');
  });

  it('should reject invalid tab values', () => {
    const { setActiveTab, activeTab } = useAlertsTabs();
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    setActiveTab('invalid' as any);
    expect(activeTab.value).toBe('active');
    expect(consoleSpy).toHaveBeenCalledWith(
      'Invalid tab value: invalid. Valid values are: active, resolved'
    );

    consoleSpy.mockRestore();
  });

  it('should get and set tab state', () => {
    const { getTabState, setTabState, tabStates } = useAlertsTabs();

    // Test getting tab state
    expect(getTabState('active')).toEqual({});
    expect(getTabState('resolved')).toEqual({
      currentPage: 1,
      pageSize: 50,
    });

    // Test setting tab state
    setTabState('active', { sortField: 'title', sortOrder: 'asc' });
    expect(tabStates.value.active).toEqual({
      sortField: 'title',
      sortOrder: 'asc',
    });

    setTabState('resolved', { currentPage: 2, pageSize: 25 });
    expect(tabStates.value.resolved).toEqual({
      currentPage: 2,
      pageSize: 25,
    });
  });

  it('should reset tab state correctly', () => {
    const { setTabState, resetTabState, tabStates } = useAlertsTabs();

    // Set some state
    setTabState('active', { sortField: 'title' });
    setTabState('resolved', { currentPage: 3, pageSize: 100 });

    // Reset active tab
    resetTabState('active');
    expect(tabStates.value.active).toEqual({});

    // Reset resolved tab
    resetTabState('resolved');
    expect(tabStates.value.resolved).toEqual({
      currentPage: 1,
      pageSize: 50,
    });
  });

  it('should load state from localStorage', () => {
    const storedState = {
      activeTab: 'resolved',
      tabStates: {
        active: { sortField: 'title' },
        resolved: { currentPage: 2, pageSize: 25 },
      },
    };
    localStorageMock.getItem.mockReturnValue(JSON.stringify(storedState));

    // Ensure no URL query parameter interferes
    mockQuery = {};

    const { activeTab, tabStates } = useAlertsTabs();

    expect(activeTab.value).toBe('resolved');
    expect(tabStates.value.active).toEqual({ sortField: 'title' });
    expect(tabStates.value.resolved).toEqual({
      currentPage: 2,
      pageSize: 25,
    });
  });

  it('should handle invalid localStorage data gracefully', () => {
    localStorageMock.getItem.mockReturnValue('invalid json');
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const { activeTab } = useAlertsTabs();

    expect(activeTab.value).toBe('active');
    expect(consoleSpy).toHaveBeenCalledWith(
      'Failed to parse stored alerts tab state:',
      expect.any(Error)
    );

    consoleSpy.mockRestore();
  });

  it('should save state to localStorage on changes', async () => {
    const { setActiveTab, setTabState } = useAlertsTabs();

    setActiveTab('resolved');
    
    // Wait for the watch to trigger
    await new Promise(resolve => setTimeout(resolve, 0));
    
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'health-checker-alerts-tab-state',
      expect.stringContaining('"activeTab":"resolved"')
    );

    setTabState('active', { sortField: 'title' });
    
    // Wait for the watch to trigger
    await new Promise(resolve => setTimeout(resolve, 0));
    
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'health-checker-alerts-tab-state',
      expect.stringContaining('"sortField":"title"')
    );
  });

  it('should update URL query parameters on tab change', () => {
    const { setActiveTab } = useAlertsTabs();

    setActiveTab('resolved');
    expect(mockReplace).toHaveBeenCalledWith({ query: expect.objectContaining({ tab: 'resolved' }) });

    setActiveTab('active');
    expect(mockReplace).toHaveBeenCalledWith({ query: expect.objectContaining({ tab: 'active' }) });
  });

  it('should initialize from URL query parameters', () => {
    // Set up the mock query before creating the composable
    mockQuery = { tab: 'resolved' };
    
    // Create composable instance - it should initialize with the URL query
    const { activeTab } = useAlertsTabs();
    
    // The initial state should reflect the URL query
    expect(activeTab.value).toBe('resolved');
  });

  it('should ignore invalid URL query parameters', () => {
    mockQuery = { tab: 'invalid' };
    const { initializeFromUrl, activeTab } = useAlertsTabs();

    initializeFromUrl();
    expect(activeTab.value).toBe('active');
  });
});
