<template>
  <div class="space-y-4">
    <!-- Loading State -->
    <div v-if="loading" class="flex justify-center p-8">
      <LoadingText text="Loading author data..." />
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="text-center p-8 text-red-600">
      <p>Error loading author data: {{ error }}</p>
      <Button 
        @click="refreshData" 
        class="mt-4"
        severity="secondary"
        size="small"
      >
        Try Again
      </Button>
    </div>

    <!-- Empty State -->
    <div v-else-if="!data || data.length === 0" class="text-center p-8 text-gray-500">
      <p>No authors with alerts found.</p>
    </div>

    <!-- Data Table -->
    <div v-else>
      <!-- Pagination Info -->
      <div class="flex justify-end items-center mb-4">
        <div class="text-sm text-gray-600">
          Showing {{ ((currentPage - 1) * itemsPerPage) + 1 }}-{{ Math.min(currentPage * itemsPerPage, totalItems) }} 
          of {{ totalItems }} authors
        </div>
      </div>

      <!-- Table -->
      <DataTable 
        :value="data" 
        :loading="loading"
        striped-rows
        responsive-layout="scroll"
        class="p-datatable-sm"
        sortMode="single"
        :sortField="sortField"
        :sortOrder="sortOrder === 'desc' ? -1 : 1"
        @sort="onSort"
      >
        <!-- Author Column -->
        <Column field="author" header="Author" :sortable="true" class="min-w-48">
          <template #body="{ data: row }">
            <div class="flex items-center gap-2">
              <Avatar 
                :label="row.author.charAt(0).toUpperCase()" 
                size="small"
                shape="circle"
                :style="{ backgroundColor: getAuthorColor(row.author) }"
              />
              <div class="flex-1">
                <div class="font-medium">{{ row.author }}</div>
                <div v-if="row.displayName" class="text-sm text-gray-500">{{ row.displayName }}</div>
              </div>
              <Button 
                @click="navigateToAuthor(row.author)"
                icon="pi pi-external-link"
                severity="secondary"
                text
                size="small"
                class="ml-2"
                v-tooltip="'View author details'"
              />
            </div>
          </template>
        </Column>

        <!-- Total Alerts Column -->
        <Column field="totalAlerts" header="Total" :sortable="true" class="text-center min-w-16">
          <template #body="{ data: row }">
            <Badge
              :value="row.totalAlerts || 0"
              :severity="getBadgeSeverity(row.totalAlerts)"
              size="small"
            />
          </template>
        </Column>

        <!-- Missing SP Column -->
        <Column field="issueTypeCounts.missingSp" header="No SP" :sortable="true" class="text-center min-w-16">
          <template #body="{ data: row }">
            <Badge 
              :value="row.issueTypeCounts.missingSp || 0" 
              :severity="row.issueTypeCounts.missingSp > 0 ? 'warning' : 'secondary'"
              size="small"
            />
          </template>
        </Column>

        <!-- Large SP Column -->
        <Column field="issueTypeCounts.largeSp" header="Large SP" :sortable="true" class="text-center min-w-16">
          <template #body="{ data: row }">
            <Badge 
              :value="row.issueTypeCounts.largeSp || 0" 
              :severity="row.issueTypeCounts.largeSp > 0 ? 'warning' : 'secondary'"
              size="small"
            />
          </template>
        </Column>

        <!-- Missing End Date Column -->
        <Column field="issueTypeCounts.missingEndDate" header="No Due Date" :sortable="true" class="text-center min-w-20">
          <template #body="{ data: row }">
            <Badge 
              :value="row.issueTypeCounts.missingEndDate || 0" 
              :severity="row.issueTypeCounts.missingEndDate > 0 ? 'danger' : 'secondary'"
              size="small"
            />
          </template>
        </Column>


        <!-- Not In Project Column -->
        <Column field="issueTypeCounts.notInProject" header="No Project" :sortable="true" class="text-center min-w-18">
          <template #body="{ data: row }">
            <Badge 
              :value="row.issueTypeCounts.notInProject || 0" 
              :severity="row.issueTypeCounts.notInProject > 0 ? 'warning' : 'secondary'"
              size="small"
            />
          </template>
        </Column>

        <!-- Template Only Column -->
        <Column header="Template" :sortable="false" class="text-center min-w-16">
          <template #body="{ data: row }">
            <Badge 
              :value="row.issueTypeCounts.templateOnly || 0" 
              :severity="row.issueTypeCounts.templateOnly > 0 ? 'info' : 'secondary'"
              size="small"
            />
          </template>
        </Column>

        <!-- Unclear Instruction Column -->
        <Column header="Unclear" :sortable="false" class="text-center min-w-16">
          <template #body="{ data: row }">
            <Badge 
              :value="row.issueTypeCounts.unclearInstruction || 0" 
              :severity="row.issueTypeCounts.unclearInstruction > 0 ? 'warning' : 'secondary'"
              size="small"
            />
          </template>
        </Column>

        <!-- Unassigned Column -->
        <Column field="issueTypeCounts.unassigned" header="Unassigned" :sortable="true" class="text-center min-w-20">
          <template #body="{ data: row }">
            <Badge 
              :value="row.issueTypeCounts.unassigned || 0" 
              :severity="row.issueTypeCounts.unassigned > 0 ? 'info' : 'secondary'"
              size="small"
            />
          </template>
        </Column>
      </DataTable>

      <!-- Pagination -->
      <Paginator
        v-if="totalPages > 1"
        :first="(currentPage - 1) * itemsPerPage"
        :rows="itemsPerPage"
        :total-records="totalItems"
        @page="handlePageChange"
        class="mt-4"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthorAlerts } from '~/composables/useAuthorAlerts';

// Props
interface Props {
  loading?: boolean;
  showOnlyActive?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  showOnlyActive: false
});

// Composables
const {
  data,
  loading: dataLoading,
  error,
  totalItems,
  totalPages,
  currentPage,
  sortBy,
  sortOrder,
  fetchData,
  refresh: refreshData
} = useAuthorAlerts();

// Local state
const itemsPerPage = 50;

// Computed
const loading = computed(() => props.loading || dataLoading.value);

// Map field names for sorting
const sortField = computed(() => {
  const fieldMap: Record<string, string> = {
    'totalAlerts': 'totalAlerts',
    'author': 'author',
    'lastActivity': 'lastActivityDate'
  };
  return fieldMap[sortBy.value] || sortBy.value;
});

// Router
const router = useRouter();

// Methods
const onSort = (event: any) => {
  const field = event.sortField;
  const order = event.sortOrder === -1 ? 'desc' : 'asc';
  
  // Map nested fields to API parameter names
  if (field === 'author') {
    sortBy.value = 'author';
  } else if (field === 'totalAlerts') {
    sortBy.value = 'totalAlerts';
  } else if (field.startsWith('issueTypeCounts.')) {
    // For issue type counts, sort by total alerts as a fallback
    sortBy.value = 'totalAlerts';
  } else {
    sortBy.value = 'totalAlerts';
  }
  
  sortOrder.value = order;
  fetchData();
};

const handlePageChange = (event: any) => {
  currentPage.value = event.page + 1; // PrimeVue uses 0-based indexing
  fetchData();
};

const getAuthorColor = (author: string): string => {
  // Generate consistent colors for authors
  const colors = [
    '#3B82F6', '#10B981', '#F59E0B', '#EF4444', 
    '#8B5CF6', '#06B6D4', '#84CC16', '#F97316'
  ];
  
  let hash = 0;
  for (let i = 0; i < author.length; i++) {
    hash = author.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  return colors[Math.abs(hash) % colors.length];
};

const getBadgeSeverity = (totalAlerts: number): string => {
  // Determine badge severity based on total alert count
  if (totalAlerts === 0) return 'secondary';
  if (totalAlerts <= 5) return 'success';
  if (totalAlerts <= 15) return 'warning';
  return 'danger';
};

const navigateToAuthor = (author: string) => {
  router.push(`/authors/${encodeURIComponent(author)}`);
};

const formatDate = (dateString: string | null): string => {
  if (!dateString) return '-';
  
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return '1 day ago';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    
    return date.toLocaleDateString();
  } catch {
    return '-';
  }
};

// Watchers
watch(() => props.showOnlyActive, () => {
  fetchData();
});

// Lifecycle
onMounted(() => {
  fetchData();
});
</script>

<style scoped>
.p-datatable-sm .p-datatable-tbody > tr > td {
  padding: 0.5rem;
}

.p-badge {
  min-width: 1.5rem;
}
</style>