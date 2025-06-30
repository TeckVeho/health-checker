<template>
  <div :class="['alert-table-container', customClass]">
    <DataTable 
      :value="alerts" 
      :class="['p-datatable-sm shadow-md border border-gray-200 rounded-md', tableClass]"
      stripedRows 
      responsiveLayout="scroll" 
      sortMode="multiple"
      :loading="loading"
      :empty-message="emptyMessage"
    >
      <Column field="severity" header="Severity" sortable>
        <template #body="slotProps">
          <Tag 
            :value="slotProps.data.severity" 
            :severity="getSeverityColor(slotProps.data.severity)" 
          />
        </template>
      </Column>
      
      <Column field="checkType" header="Type" sortable>
        <template #body="slotProps">
          {{ getCheckTypeLabel(slotProps.data.checkType) }}
        </template>
      </Column>
      
      <Column field="title" header="Title" sortable />
      <Column field="description" header="Description" />
      
      <Column field="filePath" header="File (Line)">
        <template #body="slotProps">
          <a 
            v-if="slotProps.data.filePath && slotProps.data.lineNumber"
            :href="getFileUrl(slotProps.data.filePath, slotProps.data.lineNumber, slotProps.data.branch)"
            class="text-blue-600 underline hover:text-blue-800" 
            target="_blank" 
            rel="noopener noreferrer"
            :aria-label="`View ${slotProps.data.filePath} at line ${slotProps.data.lineNumber} on GitHub`"
          >
            {{ slotProps.data.filePath }}:{{ slotProps.data.lineNumber }}
          </a>
          <span v-else>-</span>
        </template>
      </Column>
      
      <Column field="codeSnippet" header="Code">
        <template #body="slotProps">
          <pre class="whitespace-pre-wrap text-sm text-gray-700 max-w-xs overflow-x-auto">
            {{ slotProps.data.codeSnippet || '-' }}
          </pre>
        </template>
      </Column>
      
      <Column field="note" header="Note">
        <template #body="slotProps">
          <span class="text-sm text-gray-800 whitespace-pre-wrap">
            {{ formatNotes(slotProps.data.notes) }}
          </span>
        </template>
      </Column>
      
      <Column field="lastDetectedAt" header="Last Detected" sortable>
        <template #body="slotProps">
          {{ formatDate(slotProps.data.lastDetectedAt) }}
        </template>
      </Column>
    </DataTable>
  </div>
</template>

<script setup>
// Log Review URL: https://58llm.link/main/restore/31cd93c9-e937-4957-8ced-a4beedf7c283
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Tag from 'primevue/tag'

const props = defineProps({
  alerts: {
    type: Array,
    required: true,
    default: () => [],
  },
  checkTypeLabels: {
    type: Object,
    required: true,
    default: () => ({}),
  },
  owner: {
    type: String,
    required: false,
    default: '',
  },
  repo: {
    type: String,
    required: false,
    default: '',
  },
  loading: {
    type: Boolean,
    required: false,
    default: false,
  },
  emptyMessage: {
    type: String,
    required: false,
    default: 'No alerts found',
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

// Utility functions
const getSeverityColor = (level) => {
  if (level === 'high') return 'danger'
  if (level === 'middle') return 'warning'
  if (level === 'low') return 'info'
  return 'success'
}

const getCheckTypeLabel = (checkType) => {
  return props.checkTypeLabels[checkType] || checkType
}

const getFileUrl = (filePath, lineNumber, branch) => {
  if (!props.owner || !props.repo) {
    return '#'
  }
  const safeBranch = branch || 'develop'
  return `https://github.com/${props.owner}/${props.repo}/blob/${safeBranch}/${filePath}#L${lineNumber}`
}

const formatDate = (dateStr) => {
  if (!dateStr) return '-'
  
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return '-'
    
    const pad = (n) => n.toString().padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(
      d.getHours()
    )}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
  } catch (error) {
    return '-'
  }
}

const formatNotes = (notes) => {
  return (notes || '-').replace(/\n/g, '<br>')
}
</script>

<style scoped>
.alert-table-container {
  min-height: 200px;
}
</style>