<template>
  <div class="rounded-lg shadow-md border border-gray-200">
    <div class="px-6 py-4 border-b border-gray-200 bg-gray-50 rounded-t-lg">
      <h3 class="text-lg font-semibold text-gray-900">{{ title }}</h3>
      <p class="text-sm text-gray-600 mt-1">{{ description }}</p>
    </div>
    
    <div class="p-4">
      <slot />
    </div>
  </div>
</template>

<script setup>
defineProps({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  }
})
</script> 