import Aura from "@primevue/themes/aura";

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
    // サーバーサイドで使用する環境変数
    apiBaseUrl: '',
    // クライアントサイドで使用する環境変数（NUXT_PUBLIC_プレフィックスが必要）
    public: {
      apiBaseUrl: '',
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
    }
  },

  compatibilityDate: "2025-09-11"
});