<template>
  <div class="recheck-history">
    <Card class="history-card">
      <template #title>
        <div class="history-header">
          <i class="pi pi-history history-icon"></i>
          <span>Execution History</span>
          <Badge
            :value="executionHistory.length.toString()"
            severity="info"
            class="count-badge"
          />
        </div>
      </template>

      <template #content>
        <div class="history-content">
          <!-- Loading state -->
          <div
            v-if="loading && executionHistory.length === 0"
            class="loading-state"
          >
            <i class="pi pi-spin pi-spinner loading-icon"></i>
            <span>Loading history...</span>
          </div>

          <!-- Empty state -->
          <div v-else-if="executionHistory.length === 0" class="empty-state">
            <i class="pi pi-inbox empty-icon"></i>
            <span>No execution history available</span>
          </div>

          <!-- History list -->
          <div v-else class="history-list">
            <div
              v-for="execution in executionHistory"
              :key="execution.id"
              class="history-item"
              :class="{
                'status-running': execution.status === 'running',
                'status-completed': execution.status === 'completed',
                'status-error': execution.status === 'error',
                'status-timeout': execution.status === 'timeout',
              }"
            >
              <div class="execution-header">
                <div class="execution-info">
                  <span class="execution-id">{{ execution.executionId }}</span>
                  <Tag
                    :value="execution.status"
                    :severity="getStatusSeverity(execution.status)"
                    :icon="getStatusIcon(execution.status)"
                    class="status-tag"
                  />
                </div>
                <div class="execution-time">
                  {{ formatDateTime(execution.startedAt) }}
                </div>
              </div>

              <div class="execution-details">
                <div class="check-types">
                  <span class="detail-label">Checks:</span>
                  <div class="check-tags">
                    <Tag
                      v-for="checkType in execution.checkTypes"
                      :key="checkType"
                      :value="checkType"
                      severity="secondary"
                      class="check-tag"
                    />
                  </div>
                </div>

                <div v-if="execution.durationSeconds" class="duration">
                  <span class="detail-label">Duration:</span>
                  <span class="detail-value">{{
                    formatDuration(execution.durationSeconds)
                  }}</span>
                </div>

                <div v-if="execution.completedAt" class="completed">
                  <span class="detail-label">Completed:</span>
                  <span class="detail-value">{{
                    formatDateTime(execution.completedAt)
                  }}</span>
                </div>

                <div v-if="execution.errorMessage" class="error">
                  <span class="detail-label error-label">Error:</span>
                  <span class="error-message">{{
                    execution.errorMessage
                  }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </template>

      <template #footer>
        <div class="history-footer">
          <Button
            label="Refresh"
            icon="pi pi-refresh"
            size="small"
            severity="secondary"
            :loading="loading"
            @click="$emit('refresh')"
          />
          <Button
            v-if="hasMore"
            label="Load More"
            icon="pi pi-angle-down"
            size="small"
            severity="secondary"
            @click="$emit('load-more')"
          />
        </div>
      </template>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import Card from 'primevue/card';
import Tag from 'primevue/tag';
import Badge from 'primevue/badge';
import Button from 'primevue/button';
import type { RecheckExecution } from '~/utils/api';

export interface RecheckHistoryProps {
  executionHistory: RecheckExecution[];
  loading?: boolean;
  hasMore?: boolean;
}

const props = withDefaults(defineProps<RecheckHistoryProps>(), {
  loading: false,
  hasMore: false,
});

const emit = defineEmits<{
  refresh: [];
  'load-more': [];
}>();

// Methods
function getStatusSeverity(status: string): string {
  switch (status) {
    case 'running':
      return 'info';
    case 'completed':
      return 'success';
    case 'error':
      return 'danger';
    case 'timeout':
      return 'warning';
    default:
      return 'secondary';
  }
}

function getStatusIcon(status: string): string {
  switch (status) {
    case 'running':
      return 'pi pi-spin pi-spinner';
    case 'completed':
      return 'pi pi-check';
    case 'error':
      return 'pi pi-times';
    case 'timeout':
      return 'pi pi-clock';
    default:
      return 'pi pi-question';
  }
}

function formatDateTime(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toLocaleString();
  } catch {
    return 'Invalid date';
  }
}

function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${seconds}s`;
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  if (minutes < 60) {
    return remainingSeconds > 0
      ? `${minutes}m ${remainingSeconds}s`
      : `${minutes}m`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
}
</script>

<style scoped>
.recheck-history {
  width: 100%;
  max-width: 800px;
}

.history-card {
  height: 100%;
}

.history-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.history-icon {
  font-size: 1.25rem;
}

.count-badge {
  margin-left: auto;
}

.history-content {
  min-height: 200px;
}

.loading-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: 2rem;
  color: var(--text-color-secondary);
}

.loading-icon,
.empty-icon {
  font-size: 2rem;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.history-item {
  border: 1px solid var(--surface-border);
  border-radius: 8px;
  padding: 1rem;
  background: var(--surface-card);
  transition: all 0.2s ease;
}

.history-item:hover {
  border-color: var(--primary-color);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.history-item.status-running {
  border-left: 4px solid var(--blue-500);
}

.history-item.status-completed {
  border-left: 4px solid var(--green-500);
}

.history-item.status-error {
  border-left: 4px solid var(--red-500);
}

.history-item.status-timeout {
  border-left: 4px solid var(--orange-500);
}

.execution-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.execution-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.execution-id {
  font-family: monospace;
  font-size: 0.875rem;
  color: var(--text-color-secondary);
}

.execution-time {
  font-size: 0.875rem;
  color: var(--text-color-secondary);
}

.status-tag {
  font-size: 0.75rem;
}

.execution-details {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.check-types,
.duration,
.completed,
.error {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.detail-label {
  font-weight: 500;
  color: var(--text-color-secondary);
  min-width: 80px;
  font-size: 0.875rem;
}

.detail-value {
  color: var(--text-color);
  font-family: monospace;
  font-size: 0.875rem;
}

.check-tags {
  display: flex;
  gap: 0.25rem;
  flex-wrap: wrap;
}

.check-tag {
  font-size: 0.75rem;
}

.error {
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
  font-size: 0.875rem;
}

.history-footer {
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
