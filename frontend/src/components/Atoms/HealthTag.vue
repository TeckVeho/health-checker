<template>
    <Tag 
        :value="displayValue"
        :severity="severity"
        :rounded="rounded"
        :icon="icon"
        :pt="pt"
        :aria-label="ariaLabel"
    />
</template>

<script setup>
import Tag from 'primevue/tag'
import { computed } from 'vue'

// Props with validation
const props = defineProps({
    value: {
        type: [Number, String],
        required: false,
        default: '',
    },
    severity: {
        type: String,
        required: false,
        default: 'info',
        validator: (value) => ['info', 'success', 'warning', 'danger', 'secondary'].includes(value)
    },
    rounded: {
        type: Boolean,
        required: false,
        default: false
    },
    icon: {
        type: String,
        required: false,
        default: ''
    },
    pt: {
        type: Object,
        required: false,
        default: () => ({})
    },
    ariaLabel: {
        type: String,
        required: false,
        default: ''
    }
})

// Computed property to handle value display
const displayValue = computed(() => {
    if (props.value === null || props.value === undefined || props.value === '') {
        return '0'
    }
    return String(props.value)
})
</script>