import { computed } from 'vue';
import { useRuntimeConfig } from '#app';

export function useApiConfig() {
  const config = useRuntimeConfig();

  const apiBaseUrl = computed(() => {
    // ランタイム設定を優先的に使用（ビルド時に設定された値）
    const runtimeUrl = config.public?.apiBaseUrl;
    if (runtimeUrl && runtimeUrl !== '') {
      console.log('API Base URL from runtime config:', runtimeUrl);
      return runtimeUrl;
    }

    // デフォルト値を使用
    const defaultUrl = 'http://localhost:23000';
    console.log('API Base URL using default:', defaultUrl);
    return defaultUrl;
  });

  const apiTimeout = computed(() => {
    return config.public?.apiTimeout;
  });

  return {
    apiBaseUrl,
    apiTimeout,
  };
}
