<template>
  <div class="repo-alert-title-container">
    <h2 
      :id="id"
      :class="['text-2xl font-semibold text-white', customClass]"
    >
      {{ title }}
      <a 
        v-if="owner && repo"
        :href="getRepositoryUrl(owner, repo)"
        class="text-white underline hover:text-blue-400 transition-colors" 
        target="_blank"
        rel="noopener noreferrer"
        :aria-label="`View ${owner}/${repo} on GitHub`"
      >
        {{ owner }}/{{ repo }}
      </a>
      <span v-else class="text-gray-400">
        {{ fallbackText }}
      </span>
    </h2>
    
    <!-- ReCheck UI Slot -->
    <div v-if="$slots.recheck" class="recheck-inline">
      <slot name="recheck" />
    </div>
  </div>
</template>

<script setup>
import { getRepositoryUrl } from '~/utils/github'

const props = defineProps({
  owner: {
    type: String,
    required: false,
    default: '',
  },
  repo: {
    type: String,
    required: false,
    default: '',
  },
  title: {
    type: String,
    required: false,
    default: 'Alerts for ',
  },
  fallbackText: {
    type: String,
    required: false,
    default: 'Repository not specified',
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
})
</script>

<style scoped>
.repo-alert-title-container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
}

.recheck-inline {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-shrink: 0;
  max-width: 50%; /* Limit width to prevent overflow */
}

/* Responsive design */
@media (max-width: 768px) {
  .repo-alert-title-container {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
  }
  
  .recheck-inline {
    align-self: stretch;
    justify-content: flex-start;
  }
}
</style>