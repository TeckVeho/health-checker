<template>
  <Card
    :class="[
      'w-full shadow-sm border border-gray-200 mb-4 rounded-xl',
      customClass,
    ]"
  >
    <template #content>
      <div class="flex flex-col md:flex-row justify-between items-center gap-4">
        <BaseButton
          :text="
            showOnlyActive ? 'Only Active Repo: ON' : 'Only Active Repo: OFF'
          "
          :icon="showOnlyActive ? 'pi pi-check-circle' : 'pi pi-times-circle'"
          :variant="showOnlyActive ? 'primary' : 'secondary'"
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
import Card from 'primevue/card';
import BaseButton from '@/components/Atoms/buttons/BaseButton.vue';

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
});

defineEmits(['toggle-active']);
</script>
