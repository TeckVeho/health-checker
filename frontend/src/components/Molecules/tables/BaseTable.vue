<template>
  <div
    :class="tableClasses"
    :style="customStyle"
    :aria-label="ariaLabel"
    :role="role"
  >
    <!-- テーブルヘッダー -->
    <div
      v-if="title || subtitle || description || $slots.header"
      class="table-header"
    >
      <div class="table-title-section">
        <h3 v-if="title" class="table-title">{{ title }}</h3>
        <p v-if="subtitle" class="table-subtitle">{{ subtitle }}</p>
        <p v-if="description" class="table-description">{{ description }}</p>
      </div>
      <div v-if="$slots.header" class="table-header-actions">
        <slot name="header" />
      </div>
    </div>

    <!-- ローディング状態 -->
    <div v-if="loading" class="table-loading">
      <i class="pi pi-spin pi-spinner mr-2" aria-hidden="true" />
      Loading...
    </div>

    <!-- エラー状態 -->
    <div v-else-if="error" class="table-error">
      <i class="pi pi-exclamation-triangle mr-2" aria-hidden="true" />
      {{ error }}
    </div>

    <!-- テーブルコンテンツ -->
    <div v-else class="table-content">
      <!-- フィルター -->
      <div
        v-if="filterable && filters && filters.length > 0"
        class="table-filters"
      >
        <div class="filter-controls">
          <div v-for="filter in filters" :key="filter.key" class="filter-item">
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

      <!-- テーブル -->
      <DataTable
        :value="filteredData"
        :columns="computedColumns"
        :paginator="paginator || pagination?.enabled"
        :rows="rows || pagination?.rowsPerPage"
        :total-records="totalRecords || pagination?.totalRecords"
        :sort-field="sortField || sorting?.field"
        :sort-order="
          sortOrder === 'desc'
            ? -1
            : sortOrder === 'asc'
              ? 1
              : sorting?.order === 'desc'
                ? -1
                : sorting?.order === 'asc'
                  ? 1
                  : undefined
        "
        :selection-mode="selectable ? 'multiple' : undefined"
        :expanded-rows="expandedRows"
        :loading="loading"
        :pt="pt"
        @row-select="handleRowSelect"
        @row-unselect="handleRowUnselect"
        @row-expand="handleRowExpand"
        @row-collapse="handleRowCollapse"
        @sort="handleSort"
        @page="handlePage"
        @row-click="handleRowClick"
      >
        <template #empty>
          <div class="empty-state">No data available</div>
        </template>
        <!-- カスタムカラム -->
        <template
          v-for="column in computedColumns"
          :key="column.field"
          #[column.field]="{ data }"
        >
          <slot :name="`column-${column.field}`" :data="data" :column="column">
            <span v-if="column.type === 'date'">{{
              formatDate(data[column.field])
            }}</span>
            <span v-else-if="column.type === 'number'">{{
              formatNumber(data[column.field])
            }}</span>
            <BaseTag
              v-else-if="column.type === 'tag'"
              :variant="getTagVariant(data[column.field])"
              :value="data[column.field]"
            />
            <span v-else>{{ data[column.field] }}</span>
          </slot>
        </template>

        <!-- アクションカラム -->
        <Column
          v-if="actions && actions.length > 0"
          header="Actions"
          :exportable="false"
        >
          <template #body="{ data }">
            <div class="action-buttons">
              <BaseButton
                v-for="action in actions"
                :key="action.key"
                :variant="action.variant || 'secondary'"
                :size="'small'"
                :text="action.label"
                :icon="action.icon"
                :disabled="action.disabled?.(data)"
                @click="action.handler(data)"
              />
            </div>
          </template>
        </Column>

        <!-- グループ化 -->
        <template v-if="groupBy" #groupheader="{ data }">
          <slot name="group-header" :data="data">
            <strong>{{ data[groupBy] }}</strong>
          </slot>
        </template>

        <!-- サマリー行 -->
        <!-- @ts-ignore: PrimeVue summary slot not in type definitions -->
        <template v-if="summaryData" #summary>
          <slot name="summary" :data="summaryData">
            <div class="table-summary">
              <div
                v-for="metric in metrics"
                :key="metric.key"
                class="summary-metric"
              >
                <span class="metric-label">{{ metric.label }}:</span>
                <span class="metric-value">{{ getMetricValue(metric) }}</span>
              </div>
            </div>
          </slot>
        </template>
      </DataTable>
    </div>

    <!-- デフォルトスロット -->
    <div v-if="$slots.default" class="table-default-slot">
      <slot />
    </div>

    <!-- テーブルフッター -->
    <div v-if="$slots.footer" class="table-footer">
      <slot name="footer" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, watch } from 'vue';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import BaseButton from '../../Atoms/buttons/BaseButton.vue';
import BaseTag from '../../Atoms/tags/BaseTag.vue';

export interface TableColumn<T = any> {
  field: string;
  header: string;
  type?: 'text' | 'number' | 'date' | 'tag' | 'custom';
  sortable?: boolean;
  filterable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
}

export interface FilterItem {
  key: string;
  label: string;
  component: string;
  options?: any[];
  placeholder?: string;
  type?: string;
}

export interface TableAction<T = any> {
  key: string;
  label: string;
  icon?: string;
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
  disabled?: (data: T) => boolean;
  handler: (data: T) => void;
}

export interface PaginationConfig {
  enabled: boolean;
  rowsPerPage: number;
  totalRecords: number;
  currentPage?: number;
}

export interface SortingConfig {
  field: string;
  order: 'asc' | 'desc';
}

export interface FilteringConfig {
  enabled: boolean;
  filters: FilterItem[];
}

export interface GroupConfig {
  field: string;
  order: 'asc' | 'desc';
}

export interface MetricConfig {
  key: string;
  label: string;
  value: number;
  format?: 'number' | 'percentage' | 'currency';
}

export interface SummaryData {
  [key: string]: any;
}

export interface BaseTableProps<T = any> {
  // 基本プロパティ
  data: T[];
  columns: TableColumn<T>[];
  loading?: boolean;
  error?: string;
  title?: string;
  subtitle?: string;
  description?: string;

  // 外観プロパティ
  variant?: 'default' | 'striped' | 'bordered';
  size?: 'sm' | 'md' | 'lg';

  // アクセシビリティ
  ariaLabel?: string;
  role?: string;

  // テーブルタイプ
  type: 'alert' | 'author' | 'health' | 'repo' | 'custom';

  // 機能
  selectable?: boolean;
  expandable?: boolean;
  sortable?: boolean;
  filterable?: boolean;

  // ページネーション
  pagination?: PaginationConfig;
  paginator?: boolean;
  rows?: number;
  totalRecords?: number;

  // ソート・フィルター
  sorting?: SortingConfig;
  sortField?: string;
  sortOrder?: 'asc' | 'desc';
  filtering?: FilteringConfig;
  filters?: FilterItem[];

  // アクション
  actions?: TableAction<T>[];

  // グループ化（AuthorGroupedTable統合）
  groupBy?: string;
  groupConfig?: GroupConfig;

  // サマリー（HealthSummaryTable統合）
  summaryData?: SummaryData;
  metrics?: MetricConfig[];

  // カスタム
  customClass?: string;
  customStyle?: Record<string, string>;

  // PrimeVue props
  pt?: Record<string, any>;
}

const props = withDefaults(defineProps<BaseTableProps>(), {
  loading: false,
  error: '',
  variant: 'default',
  size: 'md',
  selectable: false,
  expandable: false,
  sortable: true,
  filterable: false,
  actions: () => [],
  metrics: () => [],
  pt: () => ({}),
});

const emit = defineEmits<{
  'row-select': [data: any];
  'row-unselect': [data: any];
  'row-expand': [data: any];
  'row-collapse': [data: any];
  sort: [event: any];
  page: [event: any];
  'filter-change': [filters: Record<string, any>];
  'row-click': [event: any];
  'selection-change': [event: any];
}>();

// フィルター値の管理
const filterValues = reactive<Record<string, any>>({});
const expandedRows = reactive<Record<string, boolean>>({});

// テーブルクラスの計算
const tableClasses = computed(() => {
  const classes = ['base-table'];

  // タイプクラス
  classes.push(`base-table--${props.type}`);

  // バリアントクラス
  classes.push(`base-table--${props.variant}`);

  // サイズクラス
  classes.push(`base-table--${props.size}`);

  // 状態クラス
  if (props.loading) classes.push('base-table--loading');
  if (props.error) classes.push('base-table--error');

  // カスタムクラス
  if (props.customClass) {
    classes.push(props.customClass);
  }

  return classes;
});

// 計算されたカラム
const computedColumns = computed(() => {
  return props.columns.map(column => ({
    ...column,
    sortable: column.sortable ?? props.sortable,
    filterable: column.filterable ?? props.filterable,
  }));
});

// フィルタリングされたデータ
const filteredData = computed(() => {
  if (!props.filterable || !props.filters || props.filters.length === 0) {
    return props.data;
  }

  return props.data.filter(item => {
    return Object.entries(filterValues).every(([key, value]) => {
      if (!value) return true;
      return item[key]
        ?.toString()
        .toLowerCase()
        .includes(value.toString().toLowerCase());
    });
  });
});

// イベントハンドラー
function handleRowSelect(data: any) {
  emit('row-select', data);
}

function handleRowUnselect(data: any) {
  emit('row-unselect', data);
}

function handleRowExpand(data: any) {
  expandedRows[data.id] = true;
  emit('row-expand', data);
}

function handleRowCollapse(data: any) {
  expandedRows[data.id] = false;
  emit('row-collapse', data);
}

function handleSort(event: any) {
  emit('sort', event);
}

function handlePage(event: any) {
  emit('page', event);
}

function handleFilterChange() {
  emit('filter-change', { ...filterValues });
}

function handleRowClick(event: any) {
  emit('row-click', event);
}

function handleSelectionChange(event: any) {
  emit('selection-change', event);
}

// ユーティリティ関数
function formatDate(value: any): string {
  if (!value) return '';
  return new Date(value).toLocaleDateString();
}

function formatNumber(value: any): string {
  if (value === null || value === undefined) return '';
  return Number(value).toLocaleString();
}

function getTagVariant(
  value: any
): 'error' | 'success' | 'info' | 'warning' | 'neutral' {
  if (typeof value === 'string') {
    if (
      value.toLowerCase().includes('error') ||
      value.toLowerCase().includes('critical')
    ) {
      return 'error';
    }
    if (value.toLowerCase().includes('warning')) {
      return 'warning';
    }
    if (
      value.toLowerCase().includes('success') ||
      value.toLowerCase().includes('healthy')
    ) {
      return 'success';
    }
  }
  return 'info';
}

function getMetricValue(metric: MetricConfig): string {
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
.base-table {
  @apply w-full;
}

/* ヘッダー */
.table-header {
  @apply flex justify-between items-start gap-4 p-4 border-b border-gray-200 bg-gray-50;
}

.table-title-section {
  @apply flex-1;
}

.table-title {
  @apply text-lg font-semibold text-gray-900;
}

.table-subtitle {
  @apply text-sm text-gray-600 mt-1;
}

.table-description {
  @apply text-sm text-gray-600 mt-2;
}

.table-header-actions {
  @apply flex-shrink-0;
}

/* ローディング・エラー */
.table-loading,
.table-error {
  @apply flex items-center justify-center py-8 text-gray-500;
}

.table-error {
  @apply text-red-500;
}

/* コンテンツ */
.table-content {
  @apply space-y-4;
}

/* フィルター */
.table-filters {
  @apply p-4 bg-gray-50 border-b border-gray-200;
}

.filter-controls {
  @apply grid grid-cols-1 md:grid-cols-3 gap-4;
}

.filter-item {
  @apply flex flex-col gap-2;
}

.filter-label {
  @apply text-sm font-medium text-gray-700;
}

/* アクションボタン */
.action-buttons {
  @apply flex gap-1;
}

/* サマリー */
.table-summary {
  @apply flex gap-4 p-4 bg-gray-50 border-t border-gray-200;
}

.summary-metric {
  @apply flex gap-2;
}

.metric-label {
  @apply text-sm font-medium text-gray-700;
}

.metric-value {
  @apply text-sm font-bold text-gray-900;
}

/* フッター */
.table-footer {
  @apply p-4 border-t border-gray-200 bg-gray-50;
}

/* バリアント別スタイル */
.base-table--default {
  @apply border border-gray-200;
}

.base-table--striped {
  @apply border border-gray-200;
}

.base-table--bordered {
  @apply border-2 border-gray-300;
}

/* サイズ別スタイル */
.base-table--sm {
  @apply text-sm;
}

.base-table--md {
  @apply text-base;
}

.base-table--lg {
  @apply text-lg;
}

/* 空の状態 */
.empty-state {
  @apply py-8 text-center text-gray-500;
}

/* レスポンシブデザイン */
@media (max-width: 768px) {
  .table-header {
    @apply flex-col items-start gap-2;
  }

  .filter-controls {
    @apply grid-cols-1 gap-2;
  }

  .action-buttons {
    @apply flex-col;
  }

  .table-summary {
    @apply flex-col gap-2;
  }
}
</style>
