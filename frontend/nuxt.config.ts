import Aura from "@primevue/themes/aura";

export default defineNuxtConfig({
  srcDir: "src/",

  modules: ["@primevue/nuxt-module"],

  css: ["primeicons/primeicons.css"],

  ssr: true,

  app: {
    buildAssetsDir: "/assets/",
  },

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
  
  // Development server configuration
  devServer: {
    port: parseInt(process.env.NITRO_PORT || '23001'),
    host: process.env.NITRO_HOST || 'localhost'
  },
  
  // Disable problematic parser for WSL
  nitro: {
    esbuild: {
      options: {
        target: 'node18'
      }
    }
  },
  
  // Use alternative bundler options
  vite: {
    esbuild: {
      target: 'node18'
    }
  }
});
