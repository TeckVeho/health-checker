<template>
    <Button 
        :label="label"
        :icon="icon"
        :severity="severity"
        :outlined="outlined"
        :aria-label="ariaLabel"
        :disabled="disabled"
        :loading="loading"
        @click="emit('click')" />
</template>

<script setup>
// Log Review URL: https://58llm.link/main/restore/1c1fd98b-d763-4eff-aebc-5f05e840c267
import Button from 'primevue/button'

// Props with validation
const props = defineProps({
    label: {
        type: String,
        required: false,
        default: 'Button',
    },
    icon: {
        type: String,
        required: false,
        default: 'pi pi-check-circle',
    },
    severity: {
        type: String,
        required: false,
        default: 'info',
        validator: (value) => ['info', 'success', 'warning', 'danger', 'secondary', 'help'].includes(value)
    },
    outlined: {
        type: Boolean,
        required: false,
        default: false,
    },
    disabled: {
        type: Boolean,
        required: false,
        default: false,
    },
    loading: {
        type: Boolean,
        required: false,
        default: false,
    },
    ariaLabel: {
        type: String,
        required: false,
        default: ''
    }
})

// Emits
const emit = defineEmits(['click'])
</script>