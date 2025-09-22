import { ref, computed, readonly, watch } from 'vue';
import { apiService, type Repo, type AlertSummary } from '~/utils/api';
import { useApi } from './useApi';
import { useApiConfig } from './useApiConfig';
import {
  FIELD_MAPPING,
  TABLE_CONFIG,
  FILTER_THRESHOLD_DAYS,
} from '../constants/table';

// Shared state singleton
let sharedStateInstance: ReturnType<typeof createSharedState> | null = null;

function createSharedState() {
  const { callApi } = useApi();
  const { apiBaseUrl } = useApiConfig();

  // 確実に初期化を実行
  const initializeApi = () => {
    try {
      const url = apiBaseUrl.value;
      console.log('Initializing API with URL:', url);
      apiService.init(url);
    } catch (error) {
      console.error('Failed to initialize API:', error);
      // API初期化に失敗した場合はエラーを表示
      throw new Error(`API initialization failed: ${error.message}`);
    }
  };

  // 即座に初期化
  initializeApi();

  // Watch for changes in apiBaseUrl and reinitialize API service
  watch(
    apiBaseUrl,
    newUrl => {
      if (newUrl) {
        console.log('API URL changed, reinitializing with:', newUrl);
        initializeApi();
      }
    },
    { immediate: false }
  );

  // Shared repositories data
  const repos = ref<Repo[]>([]);
  const alertSummary = ref<AlertSummary>({});
  const alertSummaryByCheckType = ref<AlertSummary>({});

  // Loading states
  const loading = ref(false);
  const error = ref<string | null>(null);

  // Cache the threshold date to avoid redundant computations
  const thresholdDate = ref<Date | null>(null);

  // Polling state
  const isPolling = ref(false);
  const pollingInterval = ref(5000); // 5 seconds default
  let pollingTimer: NodeJS.Timeout | null = null;

  // Temporary polling after ReCheck completion
  const isTemporaryPolling = ref(false);
  const temporaryPollingCount = ref(0);
  const maxTemporaryPolls = 1; // Poll once after 1 second after ReCheck completion
  let temporaryPollingTimer: NodeJS.Timeout | null = null;

  // Computed properties
  const reposWithAlerts = computed(() => {
    return repos.value.filter(repo => {
      const fullName = `${repo.owner}/${repo.name}`;
      const summaryData = alertSummary.value[fullName];
      return summaryData && Object.keys(summaryData).length > 0;
    });
  });

  // Update threshold when showOnlyActive changes
  const updateThreshold = (showOnlyActive: boolean) => {
    if (showOnlyActive) {
      const threshold = new Date();
      threshold.setDate(threshold.getDate() - FILTER_THRESHOLD_DAYS);
      thresholdDate.value = threshold;
    } else {
      thresholdDate.value = null;
    }
  };

  // Map frontend field names to backend field names
  const mapFieldToBackend = (field: string): string => {
    return (
      FIELD_MAPPING[field as keyof typeof FIELD_MAPPING] || 'last_activity_at'
    );
  };

  // Fetch repositories data
  const fetchRepos = async (
    sortField: string = TABLE_CONFIG.sortField
  ): Promise<void> => {
    if (loading.value) return; // Prevent duplicate calls

    try {
      loading.value = true;
      error.value = null;

      const backendField = mapFieldToBackend(sortField);

      const repoData = await callApi(
        () => apiService.getRepos(TABLE_CONFIG.defaultLimit, backendField),
        { errorMessage: 'Failed to fetch repositories' }
      );

      if (repoData) {
        repos.value = repoData;
      }
    } catch (err) {
      console.error('Error fetching repos:', err);
      error.value = 'Failed to fetch repositories';
    } finally {
      loading.value = false;
    }
  };

  // Fetch alert summary data
  const fetchAlertSummary = async (): Promise<void> => {
    if (repos.value.length === 0) return;

    try {
      const summaryData = await callApi(
        () =>
          apiService.getAlertSummary(
            repos.value.map(r => ({ owner: r.owner, repo: r.name }))
          ),
        { errorMessage: 'Failed to fetch alert summary' }
      );

      if (summaryData) {
        alertSummary.value = summaryData;
      }
    } catch (err) {
      console.error('Error fetching alert summary:', err);
      error.value = 'Failed to fetch alert summary';
    }
  };

  // Fetch alert summary by check type data
  const fetchAlertSummaryByCheckType = async (): Promise<void> => {
    if (repos.value.length === 0) return;

    try {
      const summaryData = await callApi(
        () =>
          apiService.getAlertSummaryByCheckType(
            repos.value.map(r => ({ owner: r.owner, repo: r.name }))
          ),
        { errorMessage: 'Failed to fetch alert summary by check type' }
      );

      if (summaryData) {
        alertSummaryByCheckType.value = summaryData;
      }
    } catch (err) {
      console.error('Error fetching alert summary by check type:', err);
      error.value = 'Failed to fetch alert summary by check type';
    }
  };

  // Initialize data (called once)
  const initializeData = async (
    sortField: string = TABLE_CONFIG.sortField
  ): Promise<void> => {
    await fetchRepos(sortField);
    await fetchAlertSummary();
    await fetchAlertSummaryByCheckType();
  };

  // Polling functionality
  const startPolling = (interval: number = pollingInterval.value): void => {
    if (isPolling.value) {
      stopPolling();
    }

    isPolling.value = true;
    pollingInterval.value = interval;

    const poll = async () => {
      if (!isPolling.value) return;

      try {
        await Promise.all([
          fetchRepos(TABLE_CONFIG.sortField),
          fetchAlertSummary(),
          fetchAlertSummaryByCheckType(),
        ]);
      } catch (err) {
        console.warn('Polling error:', err);
        // Don't show toast for polling errors to avoid spam
      }

      if (isPolling.value) {
        pollingTimer = setTimeout(poll, pollingInterval.value);
      }
    };

    // Start polling immediately
    poll();
  };

  const stopPolling = (): void => {
    isPolling.value = false;
    if (pollingTimer) {
      clearTimeout(pollingTimer);
      pollingTimer = null;
    }
  };

  const setPollingInterval = (interval: number): void => {
    pollingInterval.value = interval;
    if (isPolling.value) {
      // Restart polling with new interval
      startPolling(interval);
    }
  };

  // Temporary polling after ReCheck completion
  const startTemporaryPolling = (interval: number = 1000): void => {
    // Stop any existing temporary polling
    stopTemporaryPolling();

    isTemporaryPolling.value = true;
    temporaryPollingCount.value = 0;

    const poll = async () => {
      if (
        !isTemporaryPolling.value ||
        temporaryPollingCount.value >= maxTemporaryPolls
      ) {
        stopTemporaryPolling();
        return;
      }

      temporaryPollingCount.value++;

      try {
        await Promise.all([
          fetchRepos(TABLE_CONFIG.sortField),
          fetchAlertSummary(),
          fetchAlertSummaryByCheckType(),
        ]);
      } catch (err) {
        console.warn('Temporary polling error:', err);
      }

      if (
        isTemporaryPolling.value &&
        temporaryPollingCount.value < maxTemporaryPolls
      ) {
        temporaryPollingTimer = setTimeout(poll, interval);
      } else {
        stopTemporaryPolling();
      }
    };

    // Start temporary polling after 1 second
    temporaryPollingTimer = setTimeout(poll, interval);
  };

  const stopTemporaryPolling = (): void => {
    isTemporaryPolling.value = false;
    temporaryPollingCount.value = 0;
    if (temporaryPollingTimer) {
      clearTimeout(temporaryPollingTimer);
      temporaryPollingTimer = null;
    }
  };

  // Cleanup function
  const cleanup = (): void => {
    stopPolling();
    stopTemporaryPolling();
  };

  return {
    // State
    repos: readonly(repos),
    alertSummary: readonly(alertSummary),
    alertSummaryByCheckType: readonly(alertSummaryByCheckType),
    loading: readonly(loading),
    error: readonly(error),
    thresholdDate: readonly(thresholdDate),

    // Polling state
    isPolling: readonly(isPolling),
    pollingInterval: readonly(pollingInterval),
    isTemporaryPolling: readonly(isTemporaryPolling),

    // Computed
    reposWithAlerts,

    // Actions
    updateThreshold,
    fetchRepos,
    fetchAlertSummary,
    fetchAlertSummaryByCheckType,
    initializeData,
    mapFieldToBackend,

    // Polling actions
    startPolling,
    stopPolling,
    setPollingInterval,
    startTemporaryPolling,
    stopTemporaryPolling,
    cleanup,
  };
}

export function useSharedState() {
  if (!sharedStateInstance) {
    sharedStateInstance = createSharedState();
  }
  return sharedStateInstance;
}
