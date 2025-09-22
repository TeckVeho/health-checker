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

    // ランタイム設定が空の場合、本番環境では適切なエラーを表示
    if (process.env.NODE_ENV === 'production') {
      console.error('Runtime config is empty. Please ensure NUXT_PUBLIC_API_BASE_URL is set during build.');
      throw new Error('API configuration not found. Please check your environment variables.');
    }

    // 開発環境でも環境変数が必須
    const envUrl = process.env.NUXT_PUBLIC_API_BASE_URL;
    if (!envUrl) {
      throw new Error('NUXT_PUBLIC_API_BASE_URL environment variable is required');
    }
    console.log('API Base URL from environment variable:', envUrl);
    return envUrl;
  });

  const apiTimeout = computed(() => {
    return config.public?.apiTimeout;
  });

  return {
    apiBaseUrl,
    apiTimeout,
  };
}
