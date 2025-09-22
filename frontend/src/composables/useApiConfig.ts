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

    // 本番環境では環境変数が必須
    if (process.env.NODE_ENV === 'production') {
      throw new Error('NUXT_PUBLIC_API_BASE_URL environment variable is required in production');
    }

    // 開発環境のみデフォルト値を使用
    const defaultUrl = process.env.NUXT_PUBLIC_API_BASE_URL;
    console.log('API Base URL using default (dev only):', defaultUrl);
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
