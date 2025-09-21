<template>
  <Card
    :class="cardClasses"
    :style="customStyle"
    :pt="pt"
    :aria-label="ariaLabel"
    :role="role"
    @click="handleClick"
    @mouseenter="$emit('mouseenter', $event)"
    @mouseleave="$emit('mouseleave', $event)"
  >
    <!-- ヘッダー -->
    <template v-if="title || subtitle || description || $slots.header" #header>
      <div class="card-header">
        <div v-if="title || subtitle || description" class="card-title-section">
          <h3 v-if="title" class="card-title">{{ title }}</h3>
          <p v-if="subtitle" class="card-subtitle">{{ subtitle }}</p>
          <p v-if="description" class="card-description">{{ description }}</p>
        </div>
        <div v-if="$slots.header" class="card-header-actions">
          <slot name="header" />
        </div>
      </div>
    </template>

    <!-- コンテンツ -->
    <template #content>
      <div class="card-content">
        <!-- ローディング状態 -->
        <div v-if="loading" class="card-loading">
          <i class="pi pi-spin pi-spinner mr-2" aria-hidden="true" />
          Loading...
        </div>

        <!-- エラー状態 -->
        <div v-else-if="error" class="card-error">
          <i class="pi pi-exclamation-triangle mr-2" aria-hidden="true" />
          {{ error }}
        </div>

        <!-- サマリーコンテンツ -->
        <div v-else-if="type === 'summary' && summaryData" class="card-summary">
          <div class="summary-metrics">
            <div
              v-for="metric in metrics"
              :key="metric.key"
              class="summary-metric"
            >
              <div class="metric-label">{{ metric.label }}</div>
              <div class="metric-value" :class="getMetricValueClass(metric)">
                {{ getMetricValue(metric) }}
              </div>
            </div>
          </div>

          <div v-if="healthStatus" class="health-status">
            <BaseTag
              :health-status="healthStatus"
              :count="summaryData.total"
              size="large"
            />
          </div>
        </div>

        <!-- フィルターコンテンツ -->
        <div v-else-if="type === 'filter' && filters" class="card-filter">
          <div class="filter-controls">
            <div
              v-for="filter in filters"
              :key="filter.key"
              class="filter-item"
            >
              <label class="filter-label">{{ filter.label }}</label>
              <component
                :is="filter.component"
                v-model="filterValues[filter.key]"
                :options="filter.options"
                :placeholder="filter.placeholder"
                @update:model-value="handleFilterChange"
              />
            </div>
          </div>
        </div>

        <!-- カスタムコンテンツ -->
        <div v-else class="card-custom">
          <slot />
        </div>
      </div>
    </template>

    <!-- フッター -->
    <template v-if="(actions && actions.length > 0) || $slots.footer" #footer>
      <div class="card-footer">
        <div v-if="actions && actions.length > 0" class="card-actions">
          <BaseButton
            v-for="action in actions"
            :key="action.key"
            :variant="action.variant || 'primary'"
            :text="action.label"
            :icon="action.icon"
            :disabled="action.disabled"
            @click="action.handler"
          />
        </div>
        <div v-if="$slots.footer" class="card-footer-content">
          <slot name="footer" />
        </div>
      </div>
    </template>
  </Card>
</template>

<script setup lang="ts">
import { computed, reactive, watch } from 'vue';
import Card from 'primevue/card';
import BaseButton from '../../Atoms/buttons/BaseButton.vue';
import BaseTag from '../../Atoms/tags/BaseTag.vue';

export interface MetricItem {
  key: string;
  label: string;
  value: number;
  format?: 'number' | 'percentage' | 'currency';
  color?: 'success' | 'warning' | 'error' | 'info';
}

export interface FilterItem {
  key: string;
  label: string;
  component: string;
  options?: any[];
  placeholder?: string;
  type?: string;
}

export interface CardAction {
  key: string;
  label: string;
  icon?: string;
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
  disabled?: boolean;
  handler: () => void;
}

export interface SummaryData {
  total: number;
  [key: string]: any;
}

export interface BaseCardProps {
  // 基本プロパティ
  title?: string;
  subtitle?: string;
  description?: string;
  loading?: boolean;
  error?: string;

  // 外観プロパティ
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
  size?: 'sm' | 'md' | 'lg';

  // 状態プロパティ
  disabled?: boolean;
  clickable?: boolean;

  // アクセシビリティ
  ariaLabel?: string;
  role?: string;

  // カードタイプ
  type: 'summary' | 'filter' | 'info' | 'custom';

  // サマリー固有（HealthSummaryCard統合）
  summaryData?: SummaryData;
  metrics?: MetricItem[];
  healthStatus?: 'healthy' | 'warning' | 'critical';

  // フィルター固有（RepoFilterCard統合）
  filters?: FilterItem[];
  onFilterChange?: (filters: Record<string, any>) => void;

  // アクション
  actions?: CardAction[];

  // カスタム
  customClass?: string;
  customStyle?: Record<string, string>;

  // PrimeVue props
  pt?: Record<string, any>;
}

const props = withDefaults(defineProps<BaseCardProps>(), {
  loading: false,
  error: '',
  type: 'custom',
  variant: 'primary',
  size: 'md',
  disabled: false,
  clickable: false,
  metrics: () => [],
  filters: () => [],
  actions: () => [],
  pt: () => ({}),
});

const emit = defineEmits<{
  'filter-change': [filters: Record<string, any>];
  click: [event: MouseEvent];
  mouseenter: [event: MouseEvent];
  mouseleave: [event: MouseEvent];
}>();

// フィルター値の管理
const filterValues = reactive<Record<string, any>>({});

// カードクラスの計算
const cardClasses = computed(() => {
  const classes = ['base-card'];

  // タイプクラス
  classes.push(`base-card--${props.type}`);

  // バリアントクラス
  classes.push(`base-card--${props.variant}`);

  // サイズクラス
  classes.push(`base-card--${props.size}`);

  // 状態クラス
  if (props.loading) classes.push('base-card--loading');
  if (props.error) classes.push('base-card--error');
  if (props.disabled) classes.push('base-card--disabled');
  if (props.clickable) classes.push('base-card--clickable');

  // カスタムクラス
  if (props.customClass) {
    classes.push(props.customClass);
  }

  return classes;
});

// メトリック値の取得
function getMetricValue(metric: MetricItem): string {
  const value = props.summaryData?.[metric.key] || metric.value || 0;

  switch (metric.format) {
    case 'percentage':
      return `${value}%`;
    case 'currency':
      return `$${value.toLocaleString()}`;
    default:
      return value.toLocaleString();
  }
}

// メトリック値のクラス取得
function getMetricValueClass(metric: MetricItem): string {
  if (metric.color) {
    return `metric-value--${metric.color}`;
  }
  return '';
}

// フィルター変更ハンドラー
function handleFilterChange() {
  if (props.onFilterChange) {
    props.onFilterChange({ ...filterValues });
  }
  emit('filter-change', { ...filterValues });
}

// クリックハンドラー
function handleClick(event: MouseEvent) {
  if (!props.disabled) {
    emit('click', event);
  }
}

// フィルターの初期化
watch(
  () => props.filters,
  newFilters => {
    if (newFilters) {
      newFilters.forEach(filter => {
        if (!(filter.key in filterValues)) {
          filterValues[filter.key] = filter.options?.[0] || '';
        }
      });
    }
  },
  { immediate: true }
);
</script>

<style scoped>
.base-card {
  @apply w-full shadow-sm border border-gray-200 rounded-xl;
}

/* ヘッダー */
.card-header {
  @apply flex justify-between items-start gap-4 p-6 border-b border-gray-200 bg-gray-50 rounded-t-xl;
}

.card-title-section {
  @apply flex-1;
}

.card-title {
  @apply text-lg font-semibold text-gray-900;
}

.card-subtitle {
  @apply text-sm text-gray-600 mt-1;
}

.card-description {
  @apply text-sm text-gray-600 mt-2;
}

.card-header-actions {
  @apply flex-shrink-0;
}

/* コンテンツ */
.card-content {
  @apply p-6;
}

.card-loading {
  @apply flex items-center justify-center py-8 text-gray-500;
}

.card-error {
  @apply flex items-center justify-center py-8 text-red-500;
}

/* サマリーコンテンツ */
.card-summary {
  @apply space-y-4;
}

.summary-metrics {
  @apply grid grid-cols-2 md:grid-cols-4 gap-4;
}

.summary-metric {
  @apply text-center p-3 bg-gray-50 rounded-lg;
}

.metric-label {
  @apply text-sm text-gray-600 mb-1;
}

.metric-value {
  @apply text-xl font-bold text-gray-900;
}

.metric-value--success {
  @apply text-green-600;
}

.metric-value--warning {
  @apply text-yellow-600;
}

.metric-value--error {
  @apply text-red-600;
}

.metric-value--info {
  @apply text-blue-600;
}

.health-status {
  @apply flex justify-center;
}

/* フィルターコンテンツ */
.card-filter {
  @apply space-y-4;
}

.filter-controls {
  @apply space-y-3;
}

.filter-item {
  @apply flex flex-col gap-2;
}

.filter-label {
  @apply text-sm font-medium text-gray-700;
}

/* カスタムコンテンツ */
.card-custom {
  @apply space-y-4;
}

/* フッター */
.card-footer {
  @apply flex justify-between items-center gap-4 p-6 border-t border-gray-200 bg-gray-50 rounded-b-xl;
}

.card-actions {
  @apply flex gap-2;
}

.card-footer-content {
  @apply flex-1;
}

/* バリアント別スタイル */
.base-card--primary {
  @apply border-blue-200;
}

.base-card--secondary {
  @apply border-gray-200;
}

.base-card--success {
  @apply border-green-200;
}

.base-card--warning {
  @apply border-yellow-200;
}

.base-card--danger {
  @apply border-red-200;
}

/* サイズ別スタイル */
.base-card--sm {
  @apply text-sm;
}

.base-card--md {
  @apply text-base;
}

.base-card--lg {
  @apply text-lg;
}

/* 状態別スタイル */
.base-card--loading {
  @apply opacity-75;
}

.base-card--error {
  @apply border-red-200;
}

.base-card--disabled {
  @apply opacity-50 pointer-events-none;
}

.base-card--clickable {
  @apply cursor-pointer hover:shadow-md transition-shadow;
}

/* レスポンシブデザイン */
@media (max-width: 768px) {
  .card-header {
    @apply flex-col items-start gap-2;
  }

  .card-actions {
    @apply flex-col w-full;
  }

  .summary-metrics {
    @apply grid-cols-1 gap-2;
  }

  .filter-controls {
    @apply space-y-2;
  }
}
</style>
