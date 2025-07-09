<template>
  <div class="p-4">
    <h2 class="text-xl font-bold" :class="titleColor">
      {{ title }} ({{ count }})
    </h2>
    <p class="text-sm mt-1" :class="descriptionColor">{{ description }}</p>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  title: {
    type: String,
    required: true
  },
  count: {
    type: Number,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  variant: {
    type: String,
    default: 'active',
    validator: (value) => ['active', 'resolved', 'health'].includes(value)
  }
})

// Computed properties for dynamic styling
const titleColor = computed(() => {
  switch (props.variant) {
    case 'active':
      return 'text-red-800'
    case 'resolved':
      return 'text-green-800'
    case 'health':
      return 'text-gray-900'
    default:
      return 'text-gray-900'
  }
})

const descriptionColor = computed(() => {
  switch (props.variant) {
    case 'active':
      return 'text-red-600'
    case 'resolved':
      return 'text-green-600'
    case 'health':
      return 'text-gray-600'
    default:
      return 'text-gray-600'
  }
})
</script>

<style scoped>
/* Ensure title styling is applied with !important */
h2.text-red-800 {
  color: #991b1b !important;
  font-weight: 700 !important;
  font-size: 1.25rem !important;
  line-height: 1.75rem !important;
}

h2.text-green-800 {
  color: #166534 !important;
  font-weight: 700 !important;
  font-size: 1.25rem !important;
  line-height: 1.75rem !important;
}

h2.text-gray-900 {
  color: #111827 !important;
  font-weight: 700 !important;
  font-size: 1.25rem !important;
  line-height: 1.75rem !important;
}

/* Ensure description styling is applied with !important */
p.text-red-600 {
  color: #dc2626 !important;
  font-size: 0.875rem !important;
  line-height: 1.25rem !important;
}

p.text-green-600 {
  color: #16a34a !important;
  font-size: 0.875rem !important;
  line-height: 1.25rem !important;
}

p.text-gray-600 {
  color: #4b5563 !important;
  font-size: 0.875rem !important;
  line-height: 1.25rem !important;
}
</style> 