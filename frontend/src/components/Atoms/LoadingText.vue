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