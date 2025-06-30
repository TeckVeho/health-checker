<template>
    <div 
        class="flex items-center gap-2"
        :class="customClass"
        role="status"
        aria-live="polite"
        :aria-label="ariaLabel"
    >
        <p class="text-white">{{ text }}</p>
    </div>
</template>
<script setup>
// Log Review URL: https://58llm.link/main/restore/d4bf6a3e-4448-47f3-bce2-8ce1fdf5e459
defineProps({
    text: {
        type: String,
        required: false,
        default: 'Loading...',
    },
    customClass: {
        type: String,
        required: false,
        default: '',
    },
    ariaLabel: {
        type: String,
        required: false,
        default: 'Loading content',
    },
})
</script>