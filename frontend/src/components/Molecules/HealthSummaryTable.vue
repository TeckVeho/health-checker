<template>
  <DataTable
    :value="tableData"
    class="p-datatable-sm"
    stripedRows
    :empty-message="emptyMessage"
  >
    <Column field="severity" header="Severity Level" class="col-severity">
      <template #body="slotProps">
        <div class="flex items-center">
          <Tag
            v-if="slotProps.data.tagSeverity"
            :value="slotProps.data.severity"
            :severity="slotProps.data.tagSeverity"
            class="text-sm font-medium"
          />
          <span v-else class="text-sm font-semibold text-gray-900">
            {{ slotProps.data.severity }}
          </span>
        </div>
      </template>
    </Column>

    <Column field="count" header="Count" class="col-count">
      <template #body="slotProps">
        <span
          :class="slotProps.data.isTotal ? 'font-semibold' : ''"
          class="text-sm text-gray-900"
        >
          {{ slotProps.data.count }}
        </span>
      </template>
    </Column>

    <Column field="percentage" header="Percentage" class="col-percentage">
      <template #body="slotProps">
        <span
          :class="slotProps.data.isTotal ? 'font-semibold' : ''"
          class="text-sm text-gray-900"
        >
          {{ slotProps.data.percentage }}%
        </span>
      </template>
    </Column>
  </DataTable>
</template>

<script setup>
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Tag from 'primevue/tag';

defineProps({
  tableData: {
    type: Array,
    required: true,
    default: () => [],
  },
  emptyMessage: {
    type: String,
    default: 'No health data available',
  },
});
</script>

<style scoped>
/* DataTable column styling */
:deep(.col-severity) {
  width: 150px !important;
  min-width: 150px !important;
  max-width: 150px !important;
}

:deep(.col-count) {
  width: 100px !important;
  min-width: 100px !important;
  max-width: 100px !important;
}

:deep(.col-percentage) {
  width: 120px !important;
  min-width: 120px !important;
  max-width: 120px !important;
}

:deep(.p-datatable .p-datatable-thead > tr > th) {
  border-bottom: 1px solid #e5e7eb !important;
  padding: 0.75rem !important;
}

:deep(.p-datatable .p-datatable-tbody > tr > td) {
  padding: 0.75rem !important;
  vertical-align: middle !important;
}

:deep(.p-datatable .p-datatable-tbody > tr:last-child) {
  font-weight: 600 !important;
}
</style>
