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
    public: {
      apiBaseUrl: process.env.API_BASE_URL || process.env.NUXT_PUBLIC_API_BASE_URL || "http://localhost:23000",
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