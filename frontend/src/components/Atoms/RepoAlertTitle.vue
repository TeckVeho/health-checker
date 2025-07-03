<template>
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