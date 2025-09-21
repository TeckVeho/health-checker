<template>
  <div :class="['w-full overflow-x-auto', customClass]">
    <DataTable
      :value="alerts"
      :class="['p-datatable-sm shadow-md border rounded-md', tableClass]"
      stripedRows
      responsiveLayout="stack"
      sortMode="multiple"
      :loading="loading"
      :empty-message="emptyMessage"
      scrollable
      scrollHeight="400px"
      :resizableColumns="false"
      columnResizeMode="fit"
    >
      <Column field="severity" header="Severity" sortable class="col-severity">
        <template #body="slotProps">
          <Tag
            :value="slotProps.data.severity"
            :severity="getSeverityColor(slotProps.data.severity)"
            data-label="Severity"
          />
        </template>
      </Column>

      <Column field="checkType" header="Type" sortable class="col-check-type">
        <template #body="slotProps">
          <div class="text-sm" data-label="Type">
            {{ getCheckTypeLabel(slotProps.data.checkType) }}
          </div>
        </template>
      </Column>

      <Column field="title" header="Title" sortable class="col-title">
        <template #body="slotProps">
          <div
            class="font-medium text-gray-900 truncate"
            :title="slotProps.data.title"
            data-label="Title"
          >
            {{ slotProps.data.title || '-' }}
          </div>
        </template>
      </Column>

      <Column field="description" header="Description" class="col-description">
        <template #body="slotProps">
          <div
            class="text-sm text-gray-700 truncate"
            :title="slotProps.data.description"
            data-label="Description"
            v-html="processIssueNumbersLocal(slotProps.data.description || '-')"
          />
        </template>
      </Column>

      <Column field="filePath" header="File (Line)" class="col-file-path">
        <template #body="slotProps">
          <a
            v-if="slotProps.data.filePath && slotProps.data.lineNumber"
            :href="
              getFileUrl(
                slotProps.data.filePath,
                slotProps.data.lineNumber,
                slotProps.data.branch
              )
            "
            class="file-link truncate block text-blue-600 hover:text-blue-800 hover:underline transition-colors duration-200"
            target="_blank"
            rel="noopener noreferrer"
            :aria-label="`View ${slotProps.data.filePath} at line ${slotProps.data.lineNumber} on GitHub`"
            :title="`${slotProps.data.filePath}:${slotProps.data.lineNumber}`"
            data-label="File (Line)"
          >
            {{ slotProps.data.filePath }}:{{ slotProps.data.lineNumber }}
          </a>
          <span v-else class="text-gray-500" data-label="File (Line)">-</span>
        </template>
      </Column>

      <Column field="codeSnippet" header="Code" class="col-code">
        <template #body="slotProps">
          <pre
            class="code-snippet font-mono text-xs text-gray-700 bg-gray-50 p-2 rounded border max-h-24 overflow-y-auto whitespace-pre-wrap"
            data-label="Code"
            >{{ slotProps.data.codeSnippet }}</pre
          >
        </template>
      </Column>

      <Column field="note" header="Note" class="col-note">
        <template #body="slotProps">
          <pre
            class="note-content text-sm text-gray-800 whitespace-pre-wrap max-h-20 overflow-y-auto"
            v-html="formatNotes(slotProps.data.notes)"
            data-label="Note"
          />
        </template>
      </Column>

      <Column
        field="lastDetectedAt"
        header="Last Detected"
        sortable
        class="col-last-detected"
      >
        <template #body="slotProps">
          <div class="text-sm text-gray-600" data-label="Last Detected">
            {{ formatDate(slotProps.data.lastDetectedAt) }}
          </div>
        </template>
      </Column>
    </DataTable>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Tag from 'primevue/tag';
import { getFileUrlLegacy, processIssueNumbers } from '~/utils/github';
import { useAlerts } from '~/composables/useAlerts';

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
  tableType: {
    type: String,
    required: false,
    default: '',
  },
});

// Use the shared useAlerts composable for formatDate
const { formatDate } = useAlerts(ref(null), ref(null));

// Utility functions
const severityColorMap = {
  high: 'danger',
  middle: 'warning',
  low: 'info',
};

const getSeverityColor = level => {
  return severityColorMap[level] || 'success';
};

const getCheckTypeLabel = checkType => {
  return props.checkTypeLabels[checkType] || checkType;
};

const getFileUrl = (filePath, lineNumber, branch) => {
  return getFileUrlLegacy(
    props.owner,
    props.repo,
    filePath,
    lineNumber,
    branch
  );
};

const formatNotes = notes => {
  return (notes || '-').replace(/\n/g, '<br>');
};

const processIssueNumbersLocal = text => {
  return processIssueNumbers(text, props.owner, props.repo);
};
</script>

<style scoped>
/* Column width classes for perfect alignment */
:deep(.col-severity) {
  width: 80px !important;
  min-width: 80px !important;
  max-width: 80px !important;
}

:deep(.col-check-type) {
  width: 150px !important;
  min-width: 150px !important;
  max-width: 150px !important;
}

:deep(.col-title) {
  width: 150px !important;
  min-width: 150px !important;
  max-width: 150px !important;
}

:deep(.col-description) {
  width: 300px !important;
  min-width: 300px !important;
  max-width: 300px !important;
}

:deep(.col-file-path) {
  width: 200px !important;
  min-width: 200px !important;
  max-width: 200px !important;
  white-space: normal !important;
  word-break: break-all !important;
  overflow-wrap: break-word !important;
}

:deep(.col-file-path .p-datatable-tbody > tr > td) {
  white-space: normal !important;
  word-break: break-all !important;
  overflow-wrap: break-word !important;
  overflow: visible !important;
  text-overflow: unset !important;
}

:deep(.col-code) {
  width: 200px !important;
  min-width: 200px !important;
  max-width: 200px !important;
}

:deep(.col-note) {
  width: 280px !important;
  min-width: 280px !important;
  max-width: 280px !important;
}

:deep(.col-last-detected) {
  width: 110px !important;
  min-width: 110px !important;
  max-width: 110px !important;
}

/* Ensure consistent table layout with fixed columns */
:deep(.p-datatable) {
  width: 100%;
  table-layout: fixed;
  min-width: 1470px; /* Total width: 80+150+150+300+200+200+280+110 = 1470px */
}

:deep(.p-datatable .p-datatable-thead > tr > th) {
  padding: 0.5rem;
  text-align: left;
  white-space: nowrap;
  position: sticky;
  top: 0;
  z-index: 10;
  overflow: hidden;
  text-overflow: ellipsis;
  vertical-align: middle;
}

:deep(.p-datatable .p-datatable-tbody > tr > td) {
  padding: 0.5rem;
  vertical-align: middle;
  overflow: hidden;
  text-overflow: ellipsis;
  word-wrap: break-word;
  overflow-wrap: break-word;
}

/* Ensure inner elements are properly aligned */
:deep(.p-datatable .p-datatable-tbody > tr > td > div),
:deep(.p-datatable .p-datatable-tbody > tr > td > span),
:deep(.p-datatable .p-datatable-tbody > tr > td > a) {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
}

/* Consistent link styling */
:deep(.p-datatable a) {
  text-decoration: none;
  transition: color 0.2s ease;
}

:deep(.p-datatable a:hover) {
  text-decoration: underline;
}

/* File link specific styling */
:deep(.file-link) {
  text-decoration: none;
  transition: color 0.2s ease;
  font-size: 0.875rem;
  word-break: break-all;
  overflow-wrap: break-word;
}

:deep(.file-link:hover) {
  text-decoration: underline;
}

/* Code snippet styling */
:deep(.code-snippet) {
  margin: 0;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  line-height: 1.4;
  text-align: left;
  text-indent: 0;
  padding: 0.25rem;
  white-space: pre-wrap;
  word-wrap: break-word;
  overflow-wrap: break-word;
  font-size: 0.75rem;
  max-height: 100px;
  overflow-y: auto;
}

/* Note content styling */
:deep(.note-content) {
  font-size: 0.875rem;
  white-space: pre-wrap;
  max-height: 80px;
  overflow-y: auto;
  line-height: 1.4;
}

/* Text styling */
:deep(.p-datatable .text-sm) {
  font-size: 0.875rem;
}

:deep(.p-datatable .text-xs) {
  font-size: 0.75rem;
}

:deep(.p-datatable .font-medium) {
  font-weight: 500;
}

/* Responsive breakpoints */
@media (max-width: 1024px) {
  :deep(.p-datatable) {
    min-width: 1470px;
  }

  :deep(.p-datatable .p-datatable-thead > tr > th),
  :deep(.p-datatable .p-datatable-tbody > tr > td) {
    padding: 0.5rem;
  }
}

@media (max-width: 768px) {
  :deep(.p-datatable) {
    min-width: 1470px;
  }

  :deep(.p-datatable .p-datatable-thead > tr > th),
  :deep(.p-datatable .p-datatable-tbody > tr > td) {
    padding: 0.375rem;
  }
}

@media (max-width: 640px) {
  :deep(.p-datatable) {
    min-width: 1470px;
  }

  :deep(.p-datatable .p-datatable-thead > tr > th),
  :deep(.p-datatable .p-datatable-tbody > tr > td) {
    padding: 0.25rem;
  }

  :deep(.code-snippet) {
    padding: 0.25rem;
    font-size: 0.7rem;
  }
}

/* Stack layout for very small screens */
@media (max-width: 480px) {
  :deep(.p-datatable) {
    min-width: auto;
    table-layout: auto;
  }

  :deep(.p-datatable .p-datatable-thead > tr > th),
  :deep(.p-datatable .p-datatable-tbody > tr > td) {
    display: block;
    width: 100%;
    padding: 0.5rem;
  }

  :deep(.p-datatable .p-datatable-tbody > tr > td:before) {
    content: attr(data-label) ': ';
    font-weight: 600;
    display: inline-block;
    width: 120px;
  }

  :deep(.code-snippet) {
    margin-top: 0.5rem;
  }
}

/* Hover effects */
:deep(.p-datatable .p-datatable-tbody > tr:hover) {
  /* Keep original hover behavior */
}

/* Loading state */
:deep(.p-datatable.p-datatable-loading) {
  opacity: 0.7;
  pointer-events: none;
}

/* Empty state */
:deep(.p-datatable .p-datatable-emptymessage) {
  padding: 2rem;
  text-align: center;
}
</style>
