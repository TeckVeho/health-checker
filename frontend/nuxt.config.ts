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
      apiBaseUrl: process.env.API_BASE_URL || "http://localhost:23000",
    },
  },
  vite: {
    build: {
      modulePreload: false
    }
  }
});
