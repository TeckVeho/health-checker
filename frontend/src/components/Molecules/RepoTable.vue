<template>
  <div :class="['repo-table-container', customClass]">
    <DataTable 
      :value="tableData" 
      :class="['p-datatable-sm shadow-md border border-gray-200 rounded-md', tableClass]"
      stripedRows 
      responsiveLayout="scroll" 
      sortMode="multiple"
      :loading="loading"
      :empty-message="emptyMessage"
    >
      <Column field="name" header="Repository" sortable>
        <template #body="slotProps">
          <div class="flex items-center text-white">
            <span class="font-medium">{{ slotProps.data.name }}</span>
            &nbsp;
            <RouterLink 
              :to="`/${slotProps.data.owner}/${slotProps.data.name}`"
              class="hover:text-blue-300 transition"
              :aria-label="`View alerts for ${slotProps.data.owner}/${slotProps.data.name}`"
            >
              <i class="pi pi-external-link text-sm align-middle" />
            </RouterLink>
          </div>
        </template>
      </Column>
      
      <Column field="totalViolations" header="Total" sortable>
        <template #body="slotProps">
          <HealthTag 
            :value="slotProps.data.totalViolations"
            :severity="slotProps.data.totalViolations > 0 ? 'danger' : 'success'" 
          />
        </template>
      </Column>
      
      <Column 
        v-for="column in columns" 
        :key="column.key" 
        :field="column.key" 
        :header="column.label" 
        sortable
      >
        <template #body="slotProps">
          <HealthTag 
            :value="slotProps.data[column.key]"
            :severity="slotProps.data[column.key] > 0 ? column.tagSeverity : 'success'" 
          />
        </template>
      </Column>
    </DataTable>
  </div>
</template>

<script setup>
import { RouterLink } from 'vue-router'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import HealthTag from '@/components/Atoms/HealthTag.vue'

defineProps({
  tableData: {
    type: Array,
    required: true,
    default: () => [],
  },
  columns: {
    type: Array,
    required: true,
    default: () => [],
  },
  loading: {
    type: Boolean,
    required: false,
    default: false,
  },
  emptyMessage: {
    type: String,
    required: false,
    default: 'No repositories found',
  },
  customClass: {
    type: String,
    required: false,
    default: '',
  },
  tableClass: {
    type: String,
    required: false,
    default: '',
  },
})
</script>

<style scoped>
.repo-table-container {
  min-height: 200px;
}
</style>