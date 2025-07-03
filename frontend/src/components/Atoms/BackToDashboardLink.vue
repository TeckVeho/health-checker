<template>
    <NuxtLink 
        :to="to"
        class="back-link group inline-flex items-center gap-3 px-5 py-2.5 
               bg-gradient-to-r from-blue-600 to-indigo-600 
               text-white font-semibold rounded-xl shadow-md 
               hover:shadow-lg hover:from-blue-700 hover:to-indigo-700 
               active:scale-95 transition-transform duration-200 no-underline"
        :aria-label="ariaLabel"
    >
        <i 
            class="pi pi-angle-left text-lg group-hover:-translate-x-1 transition-transform duration-150" 
            aria-hidden="true" 
        />
        <span class="tracking-wide">{{ text }}</span>
    </NuxtLink>
</template>

<script setup>
defineProps({
    to: {
        type: String,
        required: false,
        default: '/',
    },
    text: {
        type: String,
        required: false,
        default: 'Back to Dashboard',
    },
    ariaLabel: {
        type: String,
        required: false,
        default: 'Navigate back to dashboard',
    },
})
</script>

<style scoped>
.back-link:visited {
  color: white !important;
  text-decoration: none;
}
</style>