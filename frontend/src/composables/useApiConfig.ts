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
    
    // ランタイム設定がない場合は環境変数を直接使用
    const envUrl = process.env.NUXT_PUBLIC_API_BASE_URL;
    if (envUrl) {
      console.log('API Base URL from environment variable:', envUrl);
      return envUrl;
    }
    
    // 開発環境ではデフォルトのAPI URLを使用
    if (process.env.NODE_ENV === 'development') {
      const defaultUrl = 'http://localhost:23000';
      console.warn('API Base URL not configured, using default development URL:', defaultUrl);
      return defaultUrl;
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
        NUXT_PUBLIC_API_BASE_URL: process.env.NUXT_PUBLIC_API_BASE_URL
      },
      config: config.public
    });
    throw new Error('NUXT_PUBLIC_API_BASE_URL environment variable is not set. Please set NUXT_PUBLIC_API_BASE_URL environment variable.');
  });

  const apiTimeout = computed(() => {
    return config.public?.apiTimeout;
  });

  return {
    apiBaseUrl,
    apiTimeout,
  };
}
