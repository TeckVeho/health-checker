import Aura from "@primevue/themes/aura";

// ビルド時に環境変数を確実に読み込む
const apiBaseUrl = process.env.NUXT_PUBLIC_API_BASE_URL || 'http://localhost:23000';

// デバッグ用ログ
console.log('Nuxt Config - Environment variables:', {
  NODE_ENV: process.env.NODE_ENV,
  NUXT_PUBLIC_API_BASE_URL: process.env.NUXT_PUBLIC_API_BASE_URL,
  resolvedApiBaseUrl: apiBaseUrl
});

export default defineNuxtConfig({
  srcDir: "src/",
  modules: ["@primevue/nuxt-module"],
  css: ["primeicons/primeicons.css"],
  ssr: false,

  app: {
    head: {
      title: "Github Health Checker",
    },
  },

  primevue: {
    options: {
      theme: {
        preset: Aura,
      },
    },
  },

  runtimeConfig: {
    // サーバーサイドで使用する環境変数
    apiBaseUrl: process.env.NUXT_PUBLIC_API_BASE_URL || '',
    // クライアントサイドで使用する環境変数（NUXT_PUBLIC_プレフィックスが必要）
    public: {
      apiBaseUrl: process.env.NUXT_PUBLIC_API_BASE_URL || '',
    },
  },

  vite: {
    define: {
      // ビルド時に環境変数を確実に注入
      'process.env.NUXT_PUBLIC_API_BASE_URL': JSON.stringify(process.env.NUXT_PUBLIC_API_BASE_URL),
    }
  },

  compatibilityDate: "2025-09-11"
});