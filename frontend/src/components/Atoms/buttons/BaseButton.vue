<template>
  <component
    :is="componentType"
    :class="buttonClasses"
    :disabled="disabled || loading"
    :loading="loading"
    :aria-label="ariaLabel"
    :href="href"
    :target="target"
    @click="handleClick"
  >
    <!-- Icon (left) -->
    <i
      v-if="icon && iconPosition === 'left'"
      :class="[icon, 'mr-2']"
      aria-hidden="true"
    />

    <!-- Button content -->
    <span v-if="text || $slots.default">
      <slot>{{ text }}</slot>
    </span>

    <!-- Icon (right) -->
    <i
      v-if="icon && iconPosition === 'right'"
      :class="[icon, 'ml-2']"
      aria-hidden="true"
    />
  </component>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import Button from 'primevue/button';

export interface BaseButtonProps {
  // 基本プロパティ
  variant?:
    | 'primary'
    | 'secondary'
    | 'danger'
    | 'success'
    | 'link'
    | 'outlined';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;

  // アイコン・テキスト
  icon?: string;
  iconPosition?: 'left' | 'right';
  text?: string;

  // アクション固有
  action?: 'health' | 'recheck' | 'back' | 'custom';
  status?: 'active' | 'inactive' | 'loading' | 'success' | 'error';

  // リンク系
  href?: string;
  target?: '_blank' | '_self';

  // カスタムスタイル
  customClass?: string;
  customStyle?: Record<string, string>;

  // アクセシビリティ
  ariaLabel?: string;
}

const props = withDefaults(defineProps<BaseButtonProps>(), {
  variant: 'primary',
  size: 'medium',
  disabled: false,
  loading: false,
  iconPosition: 'left',
  action: 'custom',
  status: 'active',
  target: '_self',
  ariaLabel: '',
});

const emit = defineEmits<{
  click: [];
}>();

// コンポーネントタイプの決定
const componentType = computed(() => {
  return props.href ? 'a' : Button;
});

// ボタンのクラス計算
const buttonClasses = computed(() => {
  const classes = ['base-button'];

  // サイズクラス
  classes.push(`base-button--${props.size}`);

  // バリアントクラス
  classes.push(`base-button--${props.variant}`);

  // アクション固有クラス
  if (props.action !== 'custom') {
    classes.push(`base-button--${props.action}`);
  }

  // ステータスクラス
  if (props.status !== 'active') {
    classes.push(`base-button--${props.status}`);
  }

  // カスタムクラス
  if (props.customClass) {
    classes.push(props.customClass);
  }

  return classes;
});

// クリックハンドラー
function handleClick(event: Event) {
  if (props.disabled || props.loading) {
    event.preventDefault();
    return;
  }

  emit('click');
}

// PrimeVue Button用のprops
const buttonProps = computed(() => {
  if (props.href) return {};

  return {
    severity: getSeverityFromVariant(props.variant),
    outlined: props.variant === 'outlined',
    size: getSizeFromProps(props.size),
    loading: props.loading,
    disabled: props.disabled,
  };
});

// バリアントからPrimeVue severityに変換
function getSeverityFromVariant(variant: string): string {
  const severityMap: Record<string, string> = {
    primary: 'info',
    secondary: 'secondary',
    danger: 'danger',
    success: 'success',
    link: 'help',
    outlined: 'info',
  };
  return severityMap[variant] || 'info';
}

// サイズ変換
function getSizeFromProps(size: string): string {
  const sizeMap: Record<string, string> = {
    small: 'small',
    medium: 'normal',
    large: 'large',
  };
  return sizeMap[size] || 'normal';
}
</script>

<style scoped>
.base-button {
  @apply inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2;
}

/* サイズバリエーション */
.base-button--small {
  @apply px-3 py-1.5 text-sm;
}

.base-button--medium {
  @apply px-4 py-2 text-base;
}

.base-button--large {
  @apply px-6 py-3 text-lg;
}

/* バリアントバリエーション */
.base-button--primary {
  @apply bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500;
}

.base-button--secondary {
  @apply bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500;
}

.base-button--danger {
  @apply bg-red-600 text-white hover:bg-red-700 focus:ring-red-500;
}

.base-button--success {
  @apply bg-green-600 text-white hover:bg-green-700 focus:ring-green-500;
}

.base-button--link {
  @apply bg-transparent text-blue-600 hover:text-blue-700 hover:bg-blue-50 focus:ring-blue-500;
}

.base-button--outlined {
  @apply bg-transparent border-2 border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white focus:ring-blue-500;
}

/* アクション固有スタイル */
.base-button--health {
  @apply bg-green-600 hover:bg-green-700;
}

.base-button--recheck {
  @apply bg-orange-600 hover:bg-orange-700;
}

.base-button--back {
  @apply bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700;
}

/* ステータススタイル */
.base-button--loading {
  @apply opacity-75 cursor-not-allowed;
}

.base-button--success {
  @apply bg-green-600 hover:bg-green-700;
}

.base-button--error {
  @apply bg-red-600 hover:bg-red-700;
}

/* 無効状態 */
.base-button:disabled {
  @apply opacity-50 cursor-not-allowed;
}

/* リンクスタイル */
.base-button[href] {
  @apply no-underline;
}

.base-button[href]:visited {
  @apply text-inherit;
}
</style>
