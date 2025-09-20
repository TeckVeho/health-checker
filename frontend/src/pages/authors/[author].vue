<template>
  <div class="container mx-auto px-4 py-6">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div class="flex items-center gap-4">
        <Button 
          @click="$router.back()" 
          icon="pi pi-arrow-left" 
          severity="secondary" 
          outlined
          size="small"
        />
        <div class="flex items-center gap-3">
          <Avatar 
            :label="author.charAt(0).toUpperCase()" 
            size="large"
            shape="circle"
            :style="{ backgroundColor: getAuthorColor(author) }"
          />
          <div>
            <h1 class="text-2xl font-bold">{{ author }}</h1>
            <p v-if="authorDisplayName" class="text-gray-600">{{ authorDisplayName }}</p>
          </div>
        </div>
      </div>
      
      <!-- Summary Stats -->
      <div class="flex gap-4">
        <div class="bg-blue-50 px-4 py-2 rounded-lg text-center">
          <div class="text-2xl font-bold text-blue-600">{{ totalAlerts }}</div>
          <div class="text-sm text-gray-600">Total Issues</div>
        </div>
        <div class="bg-red-50 px-4 py-2 rounded-lg text-center">
          <div class="text-2xl font-bold text-red-600">{{ highPriorityCount }}</div>
          <div class="text-sm text-gray-600">High Priority</div>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex justify-center p-8">
      <LoadingText text="Loading author details..." />
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="text-center p-8 text-red-600">
      <p>Error loading author details: {{ error }}</p>
      <Button 
        @click="fetchData" 
        class="mt-4"
        severity="secondary"
        size="small"
      >
        Try Again
      </Button>
    </div>

    <!-- Issues List -->
    <div v-else>
      <!-- Info Bar -->
      <div class="mb-4 flex justify-end">
        <div class="text-sm text-gray-600">
          Showing {{ issues.length }} issues
        </div>
      </div>

      <!-- Issues Table -->
      <DataTable 
        :value="issues"
        striped-rows
        responsive-layout="scroll"
        class="p-datatable-sm"
        :paginator="true"
        :rows="50"
        paginator-template="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
        :rows-per-page-options="[20, 50, 100]"
        current-page-report-template="Showing {first} to {last} of {totalRecords} issues"
        sortMode="single"
        :sortField="sortField"
        :sortOrder="sortOrder"
        @sort="onSort"
      >
        <!-- Repository Column -->
        <Column field="repo" header="Repository" :sortable="true" class="min-w-40">
          <template #body="{ data: issue }">
            <div class="flex items-center gap-2">
              <i class="pi pi-github text-gray-500"></i>
              <span class="font-medium">{{ issue.owner }}/{{ issue.repo }}</span>
              <RouterLink
                :to="`/${issue.owner}/${issue.repo}`"
                class="ml-auto"
              >
                <Button
                  icon="pi pi-external-link"
                  severity="secondary"
                  text
                  size="small"
                  v-tooltip="'View repository details'"
                />
              </RouterLink>
            </div>
          </template>
        </Column>

        <!-- Issue Type Column -->
        <Column field="checkType" header="Type" :sortable="true" class="min-w-24">
          <template #body="{ data: issue }">
            <Chip 
              :label="formatIssueType(issue.checkType)" 
              :class="getIssueTypeClass(issue.checkType)"
              size="small"
            />
          </template>
        </Column>

        <!-- Title/Description Column (Issue) -->
        <Column field="title" header="Issue" :sortable="true" class="min-w-60">
          <template #body="{ data: issue }">
            <div>
              <div class="flex items-center gap-2 mb-1">
                <a 
                  v-if="issue.issueUrl"
                  :href="issue.issueUrl" 
                  target="_blank" 
                  class="text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
                >
                  #{{ extractIssueNumber(issue.issueUrl) || issue.title }}
                  <i class="pi pi-external-link text-xs"></i>
                </a>
                <span v-else class="font-medium">{{ issue.title }}</span>
              </div>
              <div v-if="issue.description" class="text-sm text-gray-600 line-clamp-2">
                {{ issue.description }}
              </div>
            </div>
          </template>
        </Column>

        <!-- Severity Column -->
        <Column field="severity" header="Severity" :sortable="true" class="text-center min-w-16">
          <template #body="{ data: issue }">
            <Badge 
              :value="issue.severity" 
              :severity="getSeverityColor(issue.severity)"
              size="small"
            />
          </template>
        </Column>

        <!-- Last Detected Column -->
        <Column field="lastDetectedAt" header="Last Detected" :sortable="true" class="min-w-32">
          <template #body="{ data: issue }">
            <span class="text-sm text-gray-600">
              {{ formatDate(issue.lastDetectedAt) }}
            </span>
          </template>
        </Column>
      </DataTable>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter, RouterLink } from 'vue-router';
import axios from 'axios';
import { useAlerts } from '~/composables/useAlerts';

// Types
interface Issue {
  id: number;
  owner: string;
  repo: string;
  checkType: string;
  title: string;
  description?: string;
  severity: string;
  issueUrl?: string;
  lastDetectedAt: string;
}

// Route and router
const route = useRoute();
const router = useRouter();
const author = route.params.author as string;

// State
const issues = ref<Issue[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);
const authorDisplayName = ref<string | null>(null);

// Sorting state
const sortField = ref<string>('lastDetectedAt');
const sortOrder = ref<number>(-1); // -1 for desc, 1 for asc

// API config
const config = useRuntimeConfig();
const apiBaseUrl = config.public.apiBaseUrl;

// Extract formatDate from useAlerts composable
const { formatDate } = useAlerts(ref(null), ref(null));

const totalAlerts = computed(() => issues.value.length);
const highPriorityCount = computed(() => 
  issues.value.filter(issue => issue.severity === 'high').length
);

// Methods
const fetchData = async () => {
  loading.value = true;
  error.value = null;
  
  try {
    const response = await axios.get(`${apiBaseUrl}/api/alerts/authors/${encodeURIComponent(author)}`);
    issues.value = response.data.issues || [];
    authorDisplayName.value = response.data.authorDisplayName;
  } catch (err: any) {
    console.error('Error fetching author details:', err);
    error.value = err.response?.data?.message || 'Failed to load author details';
    issues.value = [];
  } finally {
    loading.value = false;
  }
};

const onSort = (event: any) => {
  sortField.value = event.sortField;
  sortOrder.value = event.sortOrder;
};

const formatIssueType = (checkType: string): string => {
  const typeMap: Record<string, string> = {
    'issue_missing_sp': 'No SP',
    'issue_large_sp': 'Large SP',
    'issue_missing_end_date': 'No Due Date',
    'issue_not_in_project': 'No Project',
    'issue_template_only': 'Template',
    'issue_unclear_instruction': 'Unclear',
    'issue_unassigned': 'Unassigned'
  };
  return typeMap[checkType] || checkType;
};

const getIssueTypeClass = (checkType: string): string => {
  const classMap: Record<string, string> = {
    'issue_missing_sp': 'bg-yellow-100 text-yellow-800',
    'issue_large_sp': 'bg-orange-100 text-orange-800',
    'issue_missing_end_date': 'bg-red-100 text-red-800',
    'issue_not_in_project': 'bg-purple-100 text-purple-800',
    'issue_template_only': 'bg-blue-100 text-blue-800',
    'issue_unclear_instruction': 'bg-gray-100 text-gray-800',
    'issue_unassigned': 'bg-indigo-100 text-indigo-800'
  };
  return classMap[checkType] || 'bg-gray-100 text-gray-800';
};

const getSeverityColor = (severity: string): string => {
  const severityMap: Record<string, string> = {
    'high': 'danger',
    'middle': 'warning',
    'low': 'info'
  };
  return severityMap[severity] || 'secondary';
};

const getAuthorColor = (author: string): string => {
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

const extractIssueNumber = (issueUrl: string): string | null => {
  if (!issueUrl) return null;
  const match = issueUrl.match(/\/issues\/(\d+)/);
  return match ? match[1] : null;
};


// Lifecycle
onMounted(() => {
  fetchData();
});

// Set page title
useHead({
  title: `${author} - Author Details`
});
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>