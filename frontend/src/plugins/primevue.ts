import { defineNuxtPlugin } from '#app';

export default defineNuxtPlugin(nuxtApp => {
  // ToastService và Toast component đã được @primevue/nuxt-module đăng ký
  // Chỉ cần cung cấp toast service globally
  nuxtApp.provide('toast', nuxtApp.vueApp.config.globalProperties.$toast);
});
