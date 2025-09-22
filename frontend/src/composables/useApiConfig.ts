import { computed } from 'vue';
import { useRuntimeConfig } from '#app';

export function useApiConfig() {
  const config = useRuntimeConfig();

  const apiBaseUrl = computed(() => {
    // ランタイム設定を優先的に使用（ビルド時に設定された値）
    if (config.public?.apiBaseUrl) {
      console.log('API Base URL from runtime config:', config.public.apiBaseUrl);
      return config.public.apiBaseUrl;
    }
    
    // ランタイム設定がない場合は環境変数を直接使用
    const envUrl = process.env.API_BASE_URL || process.env.NUXT_PUBLIC_API_BASE_URL;
    if (envUrl) {
      console.log('API Base URL from environment variable:', envUrl);
      return envUrl;
    }
    
    // 本番環境では現在のホストを使用するフォールバック
    if (process.env.NODE_ENV === 'production' && typeof window !== 'undefined') {
      const fallbackUrl = `${window.location.protocol}//${window.location.host}`;
      console.warn('API Base URL not configured, using current host as fallback:', fallbackUrl);
      return fallbackUrl;
    }
    
    // 値が取得できない場合はエラーを投げる
    console.error('API Base URL could not be determined:', {
      env: {
        API_BASE_URL: process.env.API_BASE_URL,
        NUXT_PUBLIC_API_BASE_URL: process.env.NUXT_PUBLIC_API_BASE_URL
      },
      config: config.public
    });
    throw new Error('API_BASE_URL environment variable is not set. Please set API_BASE_URL or NUXT_PUBLIC_API_BASE_URL environment variable.');
  });

  const apiTimeout = computed(() => {
    return config.public?.apiTimeout;
  });

  return {
    apiBaseUrl,
    apiTimeout,
  };
}
