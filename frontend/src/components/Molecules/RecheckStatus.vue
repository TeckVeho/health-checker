<template>
  <div class="recheck-status" :class="{ compact: compact, inline: inline }">
    <Card class="status-card">
      <template #title>
        <div class="status-header">
          <i :class="headerIcon" class="status-icon"></i>
          <span>ReCheck Status</span>
          <Badge 
            v-if="status?.status === 'running'"
            :value="progressValue"
            severity="info"
            class="progress-badge"
          />
        </div>
      </template>
      
      <template #content>
        <div class="status-content">
          <!-- Current Status -->
          <div class="status-row">
            <span class="status-label">Status:</span>
            <Tag 
              :value="statusText" 
              :severity="statusSeverity"
              :icon="statusIcon"
              class="status-tag"
            />
          </div>
          
          <!-- Progress (if running) -->
          <div v-if="status?.status === 'running' && status.currentExecution" class="status-row">
            <span class="status-label">Progress:</span>
            <ProgressBar 
              :value="status.currentExecution.progress" 
              :showValue="true"
              class="progress-bar"
            />
          </div>
          
          <!-- Current Phase (if running) -->
          <div v-if="status?.status === 'running' && status.currentExecution?.currentPhase" class="status-row">
            <span class="status-label">Current Phase:</span>
            <span class="status-value">{{ status.currentExecution.currentPhase }}</span>
          </div>
          
          <!-- Phase Progress (if running with phase details) -->
          <div v-if="status?.status === 'running' && status.currentExecution?.phaseDetails" class="status-row">
            <span class="status-label">Phase Progress:</span>
            <div class="phase-progress">
              <ProgressBar 
                :value="status.currentExecution.phaseDetails.progress" 
                :showValue="true"
                class="phase-progress-bar"
              />
              <span v-if="status.currentExecution.phaseDetails.totalItems" class="phase-details">
                ({{ status.currentExecution.phaseDetails.processedItems || 0 }} / {{ status.currentExecution.phaseDetails.totalItems }} items)
              </span>
            </div>
          </div>
          
          <!-- Duration (if running) -->
          <div v-if="status?.status === 'running' && status.currentExecution?.durationSeconds" class="status-row">
            <span class="status-label">Duration:</span>
            <span class="status-value">{{ formatDuration(status.currentExecution.durationSeconds) }}</span>
          </div>
          
          <!-- Last Executed -->
          <div v-if="status?.lastExecutedAt" class="status-row">
            <span class="status-label">Last Executed:</span>
            <span class="status-value">{{ formatDateTime(status.lastExecutedAt) }}</span>
          </div>
          
          
          <!-- Error Message (if error) -->
          <div v-if="status?.status === 'error'" class="status-row error-row">
            <span class="status-label error-label">Error:</span>
            <span class="error-message">Last execution failed</span>
          </div>
        </div>
      </template>
      
      <template #footer>
        <div class="status-footer">
          <Button
            label="Refresh Status"
            icon="pi pi-refresh"
            size="small"
            severity="secondary"
            :loading="loading"
            @click="$emit('refresh')"
          />
          <Button
            v-if="showHistoryButton"
            label="View History"
            icon="pi pi-history"
            size="small"
            severity="secondary"
            @click="$emit('view-history')"
          />
        </div>
      </template>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import Card from 'primevue/card'
import Tag from 'primevue/tag'
import Badge from 'primevue/badge'
import ProgressBar from 'primevue/progressbar'
import Button from 'primevue/button'
import type { RecheckStatusResponse } from '~/utils/api'

export interface RecheckStatusProps {
  status: RecheckStatusResponse | null
  loading?: boolean
  showHistoryButton?: boolean
  compact?: boolean
  inline?: boolean
}

const props = withDefaults(defineProps<RecheckStatusProps>(), {
  loading: false,
  showHistoryButton: true,
  compact: false,
  inline: false
})

const emit = defineEmits<{
  refresh: []
  'view-history': []
}>()

// Computed properties
const statusText = computed(() => {
  if (!props.status) return 'Unknown'
  
  switch (props.status.status) {
    case 'running':
      return 'Running'
    case 'completed':
      return 'Completed'
    case 'error':
      return 'Error'
    case 'idle':
      return 'Idle'
    default:
      return 'Unknown'
  }
})

const statusSeverity = computed(() => {
  if (!props.status) return 'secondary'
  
  switch (props.status.status) {
    case 'running':
      return 'info'
    case 'completed':
      return 'success'
    case 'error':
      return 'danger'
    case 'idle':
      return 'secondary'
    default:
      return 'secondary'
  }
})

const statusIcon = computed(() => {
  if (!props.status) return 'pi pi-question'
  
  switch (props.status.status) {
    case 'running':
      return 'pi pi-spin pi-spinner'
    case 'completed':
      return 'pi pi-check'
    case 'error':
      return 'pi pi-times'
    case 'idle':
      return 'pi pi-clock'
    default:
      return 'pi pi-question'
  }
})

const headerIcon = computed(() => {
  if (!props.status) return 'pi pi-info-circle'
  
  switch (props.status.status) {
    case 'running':
      return 'pi pi-spin pi-spinner'
    case 'completed':
      return 'pi pi-check-circle'
    case 'error':
      return 'pi pi-exclamation-triangle'
    case 'idle':
      return 'pi pi-info-circle'
    default:
      return 'pi pi-info-circle'
  }
})

const progressValue = computed(() => {
  if (!props.status?.currentExecution) return '0%'
  return `${props.status.currentExecution.progress}%`
})

const retryAfterSeconds = computed(() => {
  if (!props.status?.nextAvailableAt) return 0
  const now = new Date()
  const nextAvailable = new Date(props.status.nextAvailableAt)
  const diff = nextAvailable.getTime() - now.getTime()
  return Math.max(0, Math.ceil(diff / 1000))
})

// Methods
function formatDateTime(dateString: string): string {
  try {
    const date = new Date(dateString)
    return date.toLocaleString()
  } catch {
    return 'Invalid date'
  }
}

function formatDuration(seconds: number): string {
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
.recheck-status {
  width: 100%;
  max-width: 500px;
}

.status-card {
  height: 100%;
}

.status-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.status-icon {
  font-size: 1.25rem;
}

.progress-badge {
  margin-left: auto;
}

.status-content {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.status-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.25rem 0;
}

/* Compact version styles */
.recheck-status.compact .status-row {
  padding: 0.125rem 0;
}

.recheck-status.compact .status-card .p-card-content {
  padding: 0.75rem;
}

.recheck-status.compact .status-card .p-card-title {
  padding: 0.5rem 0.75rem;
  font-size: 0.9rem;
}

.recheck-status.compact .status-footer {
  padding: 0.5rem 0.75rem;
  gap: 0.5rem;
}

/* Inline version styles */
.recheck-status.inline {
  max-width: 400px;
}

.recheck-status.inline .status-card {
  border: none;
  box-shadow: none;
  background: transparent;
}

.recheck-status.inline .status-card .p-card-content {
  padding: 0.5rem 0;
}

.recheck-status.inline .status-card .p-card-title {
  display: none; /* Hide title in inline mode */
}

.recheck-status.inline .status-row {
  padding: 0.1rem 0;
  border-bottom: none;
}

.recheck-status.inline .status-footer {
  padding: 0.25rem 0;
  gap: 0.25rem;
}

.recheck-status.inline .status-footer .p-button {
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
}

.status-label {
  font-weight: 500;
  color: var(--text-color-secondary);
  min-width: 100px;
}

.status-value {
  color: var(--text-color);
  font-family: monospace;
}

.status-tag {
  font-size: 0.875rem;
}

.progress-bar {
  width: 200px;
  flex-shrink: 0;
}

.phase-progress {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.phase-progress-bar {
  width: 200px;
  flex-shrink: 0;
}

.phase-details {
  font-size: 0.875rem;
  color: var(--text-color-secondary);
  margin-top: 0.25rem;
}

.error-row {
  background-color: var(--red-50);
  padding: 0.5rem;
  border-radius: 4px;
  margin-top: 0.5rem;
}

.error-label {
  color: var(--red-700);
  font-weight: 600;
}

.error-message {
  color: var(--red-700);
}

.status-footer {
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
}

/* Dark mode support */
:deep(.p-card) {
  background: var(--surface-card);
  border: 1px solid var(--surface-border);
}

:deep(.p-card .p-card-title) {
  color: var(--text-color);
}

:deep(.p-card .p-card-content) {
  color: var(--text-color);
}
</style>
