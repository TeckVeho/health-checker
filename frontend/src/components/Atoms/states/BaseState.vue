<template>
  <div :class="stateClasses" :style="customStyle">
    <!-- アイコン -->
    <div v-if="icon || computedIcon" class="state-icon">
      <i :class="computedIcon" aria-hidden="true" />
    </div>

    <!-- タイトル -->
    <h3 v-if="title" class="state-title">
      {{ title }}
    </h3>

    <!-- 説明 -->
    <p v-if="description" class="state-description">
      {{ description }}
    </p>

    <!-- エラー表示 -->
    <div v-if="type === 'error' && error" class="state-error">
      <i class="pi pi-exclamation-triangle mr-2" aria-hidden="true" />
      {{ error }}
    </div>

    <!-- リチェックステータス -->
    <div v-if="type === 'recheck'" class="state-recheck">
      <div v-if="recheckStatus" class="recheck-status-row">
        <span class="recheck-label">Status:</span>
        <Tag
          :value="recheckStatusText"
          :severity="recheckStatusSeverity"
          :icon="recheckStatusIcon"
          class="recheck-tag"
        />
      </div>

      <div
        v-if="recheckHistory && recheckHistory.length > 0"
        class="recheck-history"
      >
        <h4 class="recheck-history-title">Recent History</h4>
        <div class="recheck-history-list">
          <div
            v-for="(item, index) in recheckHistory.slice(0, 3)"
            :key="index"
            class="recheck-history-item"
          >
            <span class="recheck-history-time">{{
              formatTime(item.timestamp)
            }}</span>
            <span class="recheck-history-status">{{ item.status }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- アクション -->
    <div v-if="action" class="state-action">
      <BaseButton
        :variant="action.variant || 'primary'"
        :text="action.label"
        @click="action.handler"
      />
    </div>

    <!-- リトライボタン（エラー時） -->
    <div v-if="type === 'error' && retry" class="state-retry">
      <BaseButton
        variant="secondary"
        text="Retry"
        icon="pi pi-refresh"
        @click="retry"
      />
    </div>

    <!-- スロットコンテンツ -->
    <div v-if="$slots.default" class="state-content">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import Tag from 'primevue/tag';
import BaseButton from '../buttons/BaseButton.vue';

export interface RecheckHistoryItem {
  timestamp: string;
  status: string;
  duration?: number;
}

export interface BaseStateProps {
  // 基本プロパティ
  type: 'empty' | 'loading' | 'error' | 'success' | 'info' | 'recheck';
  title: string;
  description?: string;
  icon?: string;

  // アクション
  action?: {
    label: string;
    handler: () => void;
    variant?: 'primary' | 'secondary' | 'danger';
  };

  // エラー固有
  error?: string;
  retry?: () => void;

  // リチェック固有（RecheckStatus, RecheckHistory統合）
  recheckStatus?: 'pending' | 'running' | 'completed' | 'failed';
  recheckHistory?: RecheckHistoryItem[];

  // カスタム
  customClass?: string;
  customStyle?: Record<string, string>;
}

const props = withDefaults(defineProps<BaseStateProps>(), {
  description: '',
  icon: '',
  error: '',
  recheckHistory: () => [],
});

// アイコンの計算
const computedIcon = computed(() => {
  if (props.icon) {
    return props.icon;
  }

  const iconMap: Record<string, string> = {
    empty: 'pi pi-inbox',
    loading: 'pi pi-spin pi-spinner',
    error: 'pi pi-exclamation-triangle',
    success: 'pi pi-check-circle',
    info: 'pi pi-info-circle',
    recheck: 'pi pi-refresh',
  };

  return iconMap[props.type] || '';
});

// リチェックステータステキスト
const recheckStatusText = computed(() => {
  const statusMap: Record<string, string> = {
    pending: 'Pending',
    running: 'Running',
    completed: 'Completed',
    failed: 'Failed',
  };
  return statusMap[props.recheckStatus || 'pending'] || 'Unknown';
});

// リチェックステータスseverity
const recheckStatusSeverity = computed(() => {
  const severityMap: Record<string, string> = {
    pending: 'secondary',
    running: 'info',
    completed: 'success',
    failed: 'danger',
  };
  return severityMap[props.recheckStatus || 'pending'] || 'secondary';
});

// リチェックステータスアイコン
const recheckStatusIcon = computed(() => {
  const iconMap: Record<string, string> = {
    pending: 'pi pi-clock',
    running: 'pi pi-spin pi-spinner',
    completed: 'pi pi-check',
    failed: 'pi pi-times',
  };
  return iconMap[props.recheckStatus || 'pending'] || '';
});

// ステートクラスの計算
const stateClasses = computed(() => {
  const classes = ['base-state'];

  // タイプクラス
  classes.push(`base-state--${props.type}`);

  // カスタムクラス
  if (props.customClass) {
    classes.push(props.customClass);
  }

  return classes;
});

// 時間フォーマット
function formatTime(timestamp: string): string {
  const date = new Date(timestamp);
  return date.toLocaleString();
}
</script>

<style scoped>
.base-state {
  @apply text-center py-12 px-4;
}

.base-state--compact {
  @apply py-6;
}

.base-state--inline {
  @apply text-left py-4;
}

/* アイコン */
.state-icon {
  @apply mb-4 text-4xl;
}

.base-state--loading .state-icon {
  @apply text-blue-500;
}

.base-state--error .state-icon {
  @apply text-red-500;
}

.base-state--success .state-icon {
  @apply text-green-500;
}

.base-state--info .state-icon {
  @apply text-blue-500;
}

.base-state--recheck .state-icon {
  @apply text-orange-500;
}

/* タイトル */
.state-title {
  @apply text-lg font-medium text-gray-900 mb-2;
}

.base-state--loading .state-title {
  @apply text-blue-900;
}

.base-state--error .state-title {
  @apply text-red-900;
}

.base-state--success .state-title {
  @apply text-green-900;
}

/* 説明 */
.state-description {
  @apply text-gray-500 mb-4;
}

/* エラー */
.state-error {
  @apply text-red-600 mb-4 p-3 bg-red-50 rounded-lg;
}

/* リチェックステータス */
.state-recheck {
  @apply text-left;
}

.recheck-status-row {
  @apply flex items-center gap-2 mb-3;
}

.recheck-label {
  @apply font-medium text-gray-700;
}

.recheck-tag {
  @apply text-sm;
}

.recheck-history {
  @apply mt-4;
}

.recheck-history-title {
  @apply text-sm font-medium text-gray-700 mb-2;
}

.recheck-history-list {
  @apply space-y-1;
}

.recheck-history-item {
  @apply flex justify-between text-sm text-gray-600;
}

.recheck-history-time {
  @apply text-xs;
}

.recheck-history-status {
  @apply font-medium;
}

/* アクション */
.state-action {
  @apply mt-6;
}

.state-retry {
  @apply mt-4;
}

/* コンテンツ */
.state-content {
  @apply mt-4;
}

/* レスポンシブデザイン */
@media (max-width: 768px) {
  .base-state {
    @apply py-8 px-2;
  }

  .state-icon {
    @apply text-3xl mb-3;
  }

  .state-title {
    @apply text-base;
  }

  .recheck-status-row {
    @apply flex-col items-start gap-1;
  }
}
</style>
