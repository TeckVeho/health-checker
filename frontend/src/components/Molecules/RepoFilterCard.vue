<template>
  <Card :class="['w-full shadow-sm border border-gray-200 mb-4 rounded-xl', customClass]">
    <template #content>
      <div class="flex flex-col md:flex-row justify-between items-center gap-4">
        <HealthButton 
          :label="showOnlyActive ? 'Only Active Repo: ON' : 'Only Active Repo: OFF'"
          :icon="showOnlyActive ? 'pi pi-check-circle' : 'pi pi-times-circle'"
          :severity="showOnlyActive ? 'info' : 'secondary'" 
          outlined
          :aria-label="`Toggle active repository filter. Currently ${showOnlyActive ? 'enabled' : 'disabled'}`"
          :aria-pressed="showOnlyActive"
          role="switch"
          :loading="loading"
          @click="$emit('toggle-active')" 
        />
      </div>
    </template>
  </Card>
</template>

<script setup>
// Log Review URL: https://58llm.link/main/restore/79c08854-7e90-4653-acce-1a5719e0bd7e
import Card from 'primevue/card'
import HealthButton from '@/components/Atoms/HealthButton.vue'

defineProps({
  showOnlyActive: {
    type: Boolean,
    required: true,
  },
  loading: {
    type: Boolean,
    required: false,
    default: false,
  },
  customClass: {
    type: String,
    required: false,
    default: '',
  },
})

defineEmits(['toggle-active'])
</script>