import { computed } from 'vue';
import { useRuntimeConfig } from '#app';

export function useApiConfig() {
  const config = useRuntimeConfig();

  const apiBaseUrl = computed(() => {
    // 環境変数を優先的に使用
    const envUrl = process.env.API_BASE_URL || process.env.NUXT_PUBLIC_API_BASE_URL;
    if (envUrl) {
      return envUrl;
    }
    
    // ランタイム設定を使用
    if (config.public?.apiBaseUrl) {
      return config.public.apiBaseUrl;
    }
    
    // デフォルト値（開発環境のみ）
    return 'http://localhost:23000';
  });

  const apiTimeout = computed(() => {
    return config.public?.apiTimeout;
  });

  return {
    apiBaseUrl,
    apiTimeout,
  };
}
