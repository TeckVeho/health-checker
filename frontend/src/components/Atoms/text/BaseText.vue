<template>
  <component
    :is="tag"
    :id="id"
    :class="textClasses"
    :style="customStyle"
    :aria-level="ariaLevel"
    :role="role"
    :aria-live="ariaLive"
    :aria-label="ariaLabel"
  >
    <!-- ローディング状態 -->
    <template v-if="loading">
      <i class="pi pi-spin pi-spinner mr-2" aria-hidden="true" />
      {{ loadingText }}
    </template>

    <!-- 通常のテキスト -->
    <template v-else>
      <!-- タイトル固有の表示 -->
      <template v-if="type !== 'custom'">
        <span
          v-if="type === 'health' && count !== undefined"
          class="health-count"
        >
          {{ count }}
        </span>
        <span v-if="type === 'repo' && owner && repo" class="repo-link">
          <a
            :href="getRepositoryUrl(owner, repo)"
            class="text-white underline hover:text-blue-400 transition-colors"
            target="_blank"
            rel="noopener noreferrer"
            :aria-label="`View ${owner}/${repo} on GitHub`"
          >
            {{ owner }}/{{ repo }}
          </a>
        </span>
        <span
          v-else-if="type === 'alert' && count !== undefined"
          class="alert-count"
        >
          {{ count }} alerts
        </span>
        <span v-else class="fallback-text">
          {{ fallbackText }}
        </span>
      </template>

      <!-- カスタムテキスト -->
      <template v-else>
        <slot>{{ text }}</slot>
      </template>
    </template>
  </component>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { getRepositoryUrl } from '~/utils/github';

export interface BaseTextProps {
  // 基本プロパティ
  variant?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'body' | 'caption';
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'muted';
  weight?: 'normal' | 'medium' | 'bold';
  align?: 'left' | 'center' | 'right';

  // テキストコンテンツ
  text?: string;

  // ローディング機能（LoadingText統合）
  loading?: boolean;
  loadingText?: string;

  // タイトル固有（HealthTitle, RepoAlertTitle統合）
  type?: 'health' | 'repo' | 'alert' | 'custom';
  count?: number;
  status?: string;
  owner?: string;
  repo?: string;
  fallbackText?: string;

  // カスタム
  customClass?: string;
  customStyle?: Record<string, string>;

  // アクセシビリティ
  id?: string;
  ariaLevel?: number;
  ariaLabel?: string;
}

const props = withDefaults(defineProps<BaseTextProps>(), {
  variant: 'body',
  color: 'primary',
  weight: 'normal',
  align: 'left',
  text: '',
  loading: false,
  loadingText: 'Loading...',
  type: 'custom',
  fallbackText: 'Content not available',
  ariaLevel: 1,
  ariaLabel: '',
});

// タグの決定
const tag = computed(() => {
  if (props.variant.startsWith('h')) {
    return props.variant;
  }
  return 'p';
});

// ロールの決定
const role = computed(() => {
  if (props.loading) return 'status';
  return undefined;
});

// aria-liveの決定
const ariaLive = computed(() => {
  if (props.loading) return 'polite';
  return undefined;
});

// テキストクラスの計算
const textClasses = computed(() => {
  const classes = ['base-text'];

  // バリアントクラス
  classes.push(`base-text--${props.variant}`);

  // カラークラス
  classes.push(`base-text--${props.color}`);

  // ウェイトクラス
  classes.push(`base-text--${props.weight}`);

  // アライメントクラス
  classes.push(`base-text--${props.align}`);

  // タイプ固有クラス
  if (props.type !== 'custom') {
    classes.push(`base-text--${props.type}`);
  }

  // ローディング状態
  if (props.loading) {
    classes.push('base-text--loading');
  }

  // カスタムクラス
  if (props.customClass) {
    classes.push(props.customClass);
  }

  return classes;
});
</script>

<style scoped>
.base-text {
  @apply transition-colors duration-200;
}

/* バリアントスタイル */
.base-text--h1 {
  @apply text-4xl font-bold;
}

.base-text--h2 {
  @apply text-3xl font-bold;
}

.base-text--h3 {
  @apply text-2xl font-semibold;
}

.base-text--h4 {
  @apply text-xl font-semibold;
}

.base-text--h5 {
  @apply text-lg font-medium;
}

.base-text--h6 {
  @apply text-base font-medium;
}

.base-text--body {
  @apply text-base;
}

.base-text--caption {
  @apply text-sm;
}

/* カラーバリエーション */
.base-text--primary {
  @apply text-white;
}

.base-text--secondary {
  @apply text-gray-400;
}

.base-text--success {
  @apply text-green-400;
}

.base-text--warning {
  @apply text-yellow-400;
}

.base-text--error {
  @apply text-red-400;
}

.base-text--muted {
  @apply text-gray-500;
}

/* ウェイトバリエーション */
.base-text--normal {
  @apply font-normal;
}

.base-text--medium {
  @apply font-medium;
}

.base-text--bold {
  @apply font-bold;
}

/* アライメントバリエーション */
.base-text--left {
  @apply text-left;
}

.base-text--center {
  @apply text-center;
}

.base-text--right {
  @apply text-right;
}

/* タイプ固有スタイル */
.base-text--health .health-count {
  @apply text-green-400 font-bold;
}

.base-text--repo .repo-link {
  @apply inline-block;
}

.base-text--alert .alert-count {
  @apply text-red-400 font-medium;
}

/* ローディング状態 */
.base-text--loading {
  @apply flex items-center;
}

/* レスポンシブデザイン */
@media (max-width: 768px) {
  .base-text--h1 {
    @apply text-3xl;
  }

  .base-text--h2 {
    @apply text-2xl;
  }

  .base-text--h3 {
    @apply text-xl;
  }
}
</style>
