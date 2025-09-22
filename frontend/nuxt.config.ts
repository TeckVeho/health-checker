import Aura from "@primevue/themes/aura";

// ビルド時に環境変数を確実に読み込む
const apiBaseUrl = process.env.API_BASE_URL || process.env.NUXT_PUBLIC_API_BASE_URL;

// デバッグ用ログ
console.log('Nuxt Config - Environment variables:', {
  NODE_ENV: process.env.NODE_ENV,
  API_BASE_URL: process.env.API_BASE_URL,
  NUXT_PUBLIC_API_BASE_URL: process.env.NUXT_PUBLIC_API_BASE_URL,
  resolvedApiBaseUrl: apiBaseUrl
});

export default defineNuxtConfig({
  srcDir: "src/",
  modules: ["@primevue/nuxt-module"],
  css: ["primeicons/primeicons.css"],
  ssr: false,

  primevue: {
    options: {
      theme: {
        preset: Aura,
      },
    },
  },

  runtimeConfig: {
    public: {
      apiBaseUrl: apiBaseUrl,
    },
  },

  postcss: {
    plugins: {}
  },

  vite: {
    css: {
      postcss: {
        plugins: []
      }
    },
    define: {
      // ビルド時に環境変数を確実に注入
      'process.env.API_BASE_URL': JSON.stringify(process.env.API_BASE_URL),
      'process.env.NUXT_PUBLIC_API_BASE_URL': JSON.stringify(process.env.NUXT_PUBLIC_API_BASE_URL),
    }
  },

  compatibilityDate: "2025-09-11"
});