import { computed } from 'vue';
import { useRuntimeConfig } from '#app';

export function useApiConfig() {
  const config = useRuntimeConfig();

  const apiBaseUrl = computed(() => {
    // If public config doesn't exist or apiBaseUrl is not set, return default
    if (!config.public || config.public.apiBaseUrl === undefined) {
      return 'http://localhost:23000';
    }
    // Otherwise return the value or default
    return config.public.apiBaseUrl || 'http://localhost:23000';
  });

  const apiTimeout = computed(() => {
    return config.public?.apiTimeout;
  });

  return {
    apiBaseUrl,
    apiTimeout,
  };
}
