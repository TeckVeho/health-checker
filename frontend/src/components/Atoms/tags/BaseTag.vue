<template>
  <Tag
    :value="displayValue"
    :rounded="rounded"
    :icon="computedIcon"
    :pt="pt"
    :aria-label="ariaLabel"
    :severity="computedSeverity"
    :class="tagClasses"
    :style="customStyle"
  >
    <template v-if="$slots.default">
      <slot />
    </template>
  </Tag>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import Tag from 'primevue/tag';

export interface BaseTagProps {
  // 基本プロパティ
  variant?: 'success' | 'warning' | 'error' | 'info' | 'neutral';
  size?: 'small' | 'medium' | 'large';
  closable?: boolean;
  rounded?: boolean;

  // ヘルス固有（既存機能を保持）
  healthStatus?: 'healthy' | 'warning' | 'critical';
  count?: number;

  // 表示値
  value?: string | number;

  // アイコン
  icon?: string;

  // カスタム
  customClass?: string;
  customStyle?: Record<string, string>;

  // アクセシビリティ
  ariaLabel?: string;

  // PrimeVue props
  pt?: Record<string, any>;
}

const props = withDefaults(defineProps<BaseTagProps>(), {
  variant: 'info',
  size: 'medium',
  closable: false,
  rounded: false,
  value: '',
  ariaLabel: '',
  pt: () => ({}),
});

const emit = defineEmits<{
  close: [];
}>();

// 表示値の計算
const displayValue = computed(() => {
  if (props.value === null || props.value === undefined || props.value === '') {
    return '0';
  }
  return String(props.value);
});

// ヘルスステータスに基づくseverityの計算
const computedSeverity = computed(() => {
  if (props.healthStatus) {
    const severityMap: Record<string, string> = {
      healthy: 'success',
      warning: 'warning',
      critical: 'danger',
    };
    return severityMap[props.healthStatus] || 'info';
  }

  // 数値に基づく色の自動判定（Alert件数用）
  if (
    typeof props.value === 'number' ||
    (typeof props.value === 'string' && !isNaN(Number(props.value)))
  ) {
    const numValue = Number(props.value);
    if (numValue === 0) {
      return 'success'; // 0件なら緑
    } else {
      return 'danger'; // 1件以上なら赤
    }
  }

  // デフォルトはinfo
  return 'info';
});

// アイコンの計算
const computedIcon = computed(() => {
  if (props.icon) {
    return props.icon;
  }

  if (props.healthStatus) {
    const iconMap: Record<string, string> = {
      healthy: 'pi pi-check-circle',
      warning: 'pi pi-exclamation-triangle',
      critical: 'pi pi-times-circle',
    };
    return iconMap[props.healthStatus] || '';
  }

  return '';
});

// タグクラスの計算
const tagClasses = computed(() => {
  const classes = ['base-tag'];

  // サイズクラス
  classes.push(`base-tag--${props.size}`);

  // バリアントクラス
  classes.push(`base-tag--${props.variant}`);

  // ヘルスステータスクラス
  if (props.healthStatus) {
    classes.push(`base-tag--health-${props.healthStatus}`);
  }

  // カスタムクラス
  if (props.customClass) {
    classes.push(props.customClass);
  }

  return classes;
});
</script>

<style scoped>
.base-tag {
  @apply transition-all duration-200;
}

/* サイズバリエーション */
.base-tag--small {
  @apply text-xs px-2 py-1;
}

.base-tag--medium {
  @apply text-sm px-3 py-1.5;
}

.base-tag--large {
  @apply text-base px-4 py-2;
}

/* バリアントスタイル */
.base-tag--success {
  @apply bg-green-100 text-green-800 border-green-200;
}

.base-tag--warning {
  @apply bg-yellow-100 text-yellow-800 border-yellow-200;
}

.base-tag--error {
  @apply bg-red-100 text-red-800 border-red-200;
}

.base-tag--info {
  @apply bg-blue-100 text-blue-800 border-blue-200;
}

.base-tag--neutral {
  @apply bg-gray-100 text-gray-800 border-gray-200;
}

/* ヘルスステータス固有スタイル */
.base-tag--health-healthy {
  @apply bg-green-100 text-green-800 border-green-200;
}

.base-tag--health-warning {
  @apply bg-yellow-100 text-yellow-800 border-yellow-200;
}

.base-tag--health-critical {
  @apply bg-red-100 text-red-800 border-red-200;
}

/* カウント表示のスタイル */
.base-tag[data-count] {
  @apply font-bold;
}

/* ホバー効果 */
.base-tag:hover {
  @apply shadow-md transform scale-105;
}

/* レスポンシブデザイン */
@media (max-width: 768px) {
  .base-tag--small {
    @apply text-xs px-1.5 py-0.5;
  }

  .base-tag--medium {
    @apply text-sm px-2 py-1;
  }

  .base-tag--large {
    @apply text-base px-3 py-1.5;
  }
}
</style>
