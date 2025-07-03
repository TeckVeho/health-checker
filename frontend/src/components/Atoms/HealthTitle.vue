<template>
    <h1 
        :id="id" 
        :class="['text-3xl font-bold text-white', customClass]"
        :aria-level="ariaLevel"
    >
        {{ title }}
    </h1>
</template>
<script setup>
defineProps({
    title: {
        type: String,
        required: false,
        default: 'GitHub Health Checker!',
    },
    id: {
        type: String,
        required: false,
        default: '',
    },
    customClass: {
        type: String,
        required: false,
        default: '',
    },
    ariaLevel: {
        type: Number,
        required: false,
        default: 1,
    },
})
</script>