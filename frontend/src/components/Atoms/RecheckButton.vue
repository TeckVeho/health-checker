<template>
  <div class="recheck-button-container">
    <Button
      :label="buttonLabel"
      :icon="buttonIcon"
      :loading="loading"
      :disabled="!canExecute || loading"
      :severity="buttonSeverity"
      :size="size"
      @click="handleClick"
      class="recheck-button"
    />
    
    <!-- Status indicator -->
    <div v-if="showStatus && status" class="status-indicator">
      <Tag
        :value="statusText"
        :severity="statusSeverity"
        :icon="statusIcon"
        class="status-tag"
      />
    </div>
    
    <!-- Retry countdown -->
    <div v-if="retryAfterSeconds > 0" class="retry-countdown">
      <small class="text-muted">
        Retry available in {{ formatCountdown(retryAfterSeconds) }}
      </small>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import Button from 'primevue/button'
import Tag from 'primevue/tag'

export interface RecheckButtonProps {
  loading?: boolean
  canExecute?: boolean
  status?: 'idle' | 'running' | 'completed' | 'error'
  retryAfterSeconds?: number
  showStatus?: boolean
  size?: 'small' | 'normal' | 'large'
}

const props = withDefaults(defineProps<RecheckButtonProps>(), {
  loading: false,
  canExecute: true,
  status: 'idle',
  retryAfterSeconds: 0,
  showStatus: true,
  size: 'normal'
})

const emit = defineEmits<{
  click: []
}>()

// Computed properties
const buttonLabel = computed(() => {
  if (props.loading) return 'Running...'
  if (props.status === 'running') return 'Running...'
  if (props.status === 'completed') return 'ReCheck'
  if (props.status === 'error') return 'Retry'
  if (!props.canExecute && props.retryAfterSeconds > 0) {
    return `Wait ${formatCountdown(props.retryAfterSeconds)}`
  }
  return 'ReCheck'
})

const buttonIcon = computed(() => {
  if (props.loading || props.status === 'running') return 'pi pi-spin pi-spinner'
  if (props.status === 'completed') return 'pi pi-refresh'
  if (props.status === 'error') return 'pi pi-replay'
  if (!props.canExecute && props.retryAfterSeconds > 0) return 'pi pi-clock'
  return 'pi pi-refresh'
})

const buttonSeverity = computed(() => {
  if (props.loading || props.status === 'running') return 'info'
  if (props.status === 'error') return 'warn'
  if (!props.canExecute && props.retryAfterSeconds > 0) return 'warning'
  return 'secondary'
})

const statusText = computed(() => {
  switch (props.status) {
    case 'running':
      return 'Running'
    case 'completed':
      return 'Completed'
    case 'error':
      return 'Error'
    default:
      return 'Ready'
  }
})

const statusSeverity = computed(() => {
  switch (props.status) {
    case 'running':
      return 'info'
    case 'completed':
      return 'success'
    case 'error':
      return 'danger'
    default:
      return 'secondary'
  }
})

const statusIcon = computed(() => {
  switch (props.status) {
    case 'running':
      return 'pi pi-spin pi-spinner'
    case 'completed':
      return 'pi pi-check'
    case 'error':
      return 'pi pi-times'
    default:
      return 'pi pi-clock'
  }
})

// Methods
function handleClick() {
  if (props.canExecute && !props.loading) {
    emit('click')
  }
}

function formatCountdown(seconds: number): string {
  if (seconds < 60) {
    return `${seconds}s`
  }
  
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  
  if (minutes < 60) {
    return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`
  }
  
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  
  return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`
}
</script>

<style scoped>
.recheck-button-container {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  align-items: flex-start;
}

.recheck-button {
  min-width: 120px;
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.status-tag {
  font-size: 0.75rem;
}

.retry-countdown {
  font-size: 0.75rem;
  color: var(--text-color-secondary);
}

.text-muted {
  color: var(--text-color-secondary);
}

/* Size variants */
.recheck-button-container.size-small .recheck-button {
  min-width: 100px;
  font-size: 0.875rem;
}

.recheck-button-container.size-large .recheck-button {
  min-width: 140px;
  font-size: 1.125rem;
}
</style>
