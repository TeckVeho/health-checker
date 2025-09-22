import { computed } from 'vue';
import { useRuntimeConfig } from '#app';

export function useApiConfig() {
  const config = useRuntimeConfig();

  const apiBaseUrl = computed(() => {
    // 環境変数を優先的に使用
    const envUrl = process.env.API_BASE_URL || process.env.NUXT_PUBLIC_API_BASE_URL;
    if (envUrl) {
      console.log('API Base URL from environment variable:', envUrl);
      return envUrl;
    }
    
    // ランタイム設定を使用
    if (config.public?.apiBaseUrl) {
      console.log('API Base URL from runtime config:', config.public.apiBaseUrl);
      return config.public.apiBaseUrl;
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
