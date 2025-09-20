import { ref, computed } from 'vue';
import axios from 'axios';

interface AuthorAggregation {
  author: string;
  displayName: string | null;
  totalAlerts: number;
  severityCounts: {
    high: number;
    middle: number;
    low: number;
  };
  issueTypeCounts: {
    missingSp: number;
    largeSp: number;
    missingEndDate: number;
    notInProject: number;
    templateOnly: number;
    unclearInstruction: number;
    unassigned: number;
  };
  repositories: string[];
  lastActivityDate: string;
}

interface AuthorAlertsResponse {
  data: AuthorAggregation[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const useAuthorAlerts = () => {
  // State
  const data = ref<AuthorAggregation[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);
  
  // Pagination
  const currentPage = ref(1);
  const totalItems = ref(0);
  const totalPages = ref(0);
  const limit = ref(50);
  
  // Sorting
  const sortBy = ref<'totalAlerts' | 'author' | 'lastActivity'>('totalAlerts');
  const sortOrder = ref<'asc' | 'desc'>('desc');
  
  // Filters
  const owner = ref<string>('');
  const repo = ref<string>('');

  // API base URL from runtime config
  const config = useRuntimeConfig();
  const apiBaseUrl = config.public.apiBaseUrl;

  // Methods
  const fetchData = async () => {
    loading.value = true;
    error.value = null;
    
    try {
      const params = new URLSearchParams({
        sortBy: sortBy.value,
        sortOrder: sortOrder.value,
        page: currentPage.value.toString(),
        limit: limit.value.toString()
      });
      
      if (owner.value) params.append('owner', owner.value);
      if (repo.value) params.append('repo', repo.value);
      
      const response = await axios.get<AuthorAlertsResponse>(
        `${apiBaseUrl}/api/alerts/by-author?${params}`
      );
      
      data.value = response.data.data;
      totalItems.value = response.data.pagination.total;
      totalPages.value = response.data.pagination.totalPages;
      currentPage.value = response.data.pagination.page;
      
    } catch (err: any) {
      console.error('Error fetching author alerts:', err);
      error.value = err.response?.data?.message || 'Failed to load author data';
      data.value = [];
      totalItems.value = 0;
      totalPages.value = 0;
    } finally {
      loading.value = false;
    }
  };

  const refresh = () => {
    currentPage.value = 1;
    fetchData();
  };

  const setFilters = (filters: { owner?: string; repo?: string }) => {
    if (filters.owner !== undefined) owner.value = filters.owner;
    if (filters.repo !== undefined) repo.value = filters.repo;
    currentPage.value = 1;
    fetchData();
  };

  const setSorting = (field: 'totalAlerts' | 'author' | 'lastActivity', order: 'asc' | 'desc' = 'desc') => {
    sortBy.value = field;
    sortOrder.value = order;
    currentPage.value = 1;
    fetchData();
  };

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages.value) {
      currentPage.value = page;
      fetchData();
    }
  };

  // Computed properties
  const hasData = computed(() => data.value.length > 0);
  const isEmpty = computed(() => !loading.value && !hasData.value && !error.value);
  const hasError = computed(() => !!error.value);
  
  const paginationInfo = computed(() => ({
    current: currentPage.value,
    total: totalPages.value,
    items: totalItems.value,
    from: totalItems.value > 0 ? ((currentPage.value - 1) * limit.value) + 1 : 0,
    to: Math.min(currentPage.value * limit.value, totalItems.value)
  }));

  return {
    // State
    data,
    loading,
    error,
    
    // Pagination
    currentPage,
    totalItems,
    totalPages,
    limit,
    
    // Sorting
    sortBy,
    sortOrder,
    
    // Filters
    owner,
    repo,
    
    // Methods
    fetchData,
    refresh,
    setFilters,
    setSorting,
    goToPage,
    
    // Computed
    hasData,
    isEmpty,
    hasError,
    paginationInfo
  };
};