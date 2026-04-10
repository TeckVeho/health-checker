<template>
  <div class="p-6 space-y-6">
    <BaseText text="GitHub Health Checker!" />

    <!-- Filter Card -->
    <RepoFilterCard
      :showOnlyActive="showOnlyActive"
      :loading="loading || checkTypeLoading"
      @toggle-active="handleToggleFilter"
    />

    <Tabs :value="activeTab" @update:value="handleTabChange">
      <TabList>
        <Tab value="severity">Severity-based view</Tab>
        <Tab value="checkType">CheckType-based view</Tab>
        <Tab value="author">Author-based view</Tab>
      </TabList>
      <TabPanels>
        <TabPanel value="severity">
          <!-- Loading -->
          <div v-if="!repos || repos.length === 0">
            <BaseText
              text="Loading repositories..."
              :loading="true"
              aria-label="Loading repository data"
            />
          </div>

          <!-- Repo Table -->
          <div v-else>
            <RepoTable
              :tableData="sortedTableData"
              :columns="columns"
              :loading="loading"
              :sortState="sortState"
              @sort-change="handleSortChange"
              empty-message="No repositories found. Try adjusting your filters."
            />
          </div>
        </TabPanel>
        <TabPanel value="checkType">
          <!-- Loading -->
          <div v-if="!checkTypeRepos || checkTypeRepos.length === 0">
            <BaseText
              text="Loading checkType data..."
              :loading="true"
              aria-label="Loading checkType data"
            />
          </div>

          <!-- CheckType Repo Table -->
          <div v-else>
            <RepoTable
              :tableData="checkTypeSortedTableData"
              :columns="checkTypeColumns"
              :loading="checkTypeLoading"
              :sortState="checkTypeSortState"
              @sort-change="handleCheckTypeSortChange"
              empty-message="No repositories found. Try adjusting your filters."
            />
          </div>
        </TabPanel>
        <TabPanel value="author">
          <AuthorGroupedTable
            :loading="loading || checkTypeLoading"
            :showOnlyActive="showOnlyActive"
          />
        </TabPanel>
      </TabPanels>
    </Tabs>
  </div>
</template>

<script setup lang="ts">
import { onMounted, computed } from 'vue';

useHead({
  title: 'Dashboard · Github Health Checker',
});
import { useRepoHealth } from '@/composables/useRepoHealth';
import { useCheckTypeAlerts } from '@/composables/useCheckTypeAlerts';
import { useTabState } from '@/composables/useTabState';
import { useSharedState } from '@/composables/useSharedState';
import { useCustomToast } from '@/composables/useCustomToast';
import BaseText from '@/components/Atoms/text/BaseText.vue';
import RepoFilterCard from '@/components/Molecules/RepoFilterCard.vue';
import RepoTable from '@/components/Molecules/RepoTable.vue';
import AuthorGroupedTable from '@/components/Molecules/AuthorGroupedTable.vue';

const toast = useCustomToast();

// Tab state management
const { activeTab, setActiveTab } = useTabState();

// Severity-based data
const {
  columns,
  repos,
  showOnlyActive,
  sortedTableData,
  sortState,
  updateSortState,
  toggleShowOnlyActive,
  fetchData,
  loading,
} = useRepoHealth();

// Shared state for polling functionality
const sharedState = useSharedState();
const { startTemporaryPolling, isTemporaryPolling } = sharedState;

// CheckType-based data
const {
  columns: checkTypeColumns,
  repos: checkTypeRepos,
  sortedTableData: checkTypeSortedTableData,
  sortState: checkTypeSortState,
  updateSortState: updateCheckTypeSortState,
  toggleShowOnlyActive: toggleCheckTypeShowOnlyActive,
  fetchData: fetchCheckTypeData,
  loading: checkTypeLoading,
} = useCheckTypeAlerts();

const handleSortChange = (field, order) => {
  updateSortState(field, order);
};

const handleCheckTypeSortChange = (field, order) => {
  updateCheckTypeSortState(field, order);
};

const handleTabChange = tab => {
  setActiveTab(tab);
};

const handleToggleFilter = () => {
  toggleShowOnlyActive();
  toggleCheckTypeShowOnlyActive();
};

async function refreshAllData() {
  try {
    const sharedState = useSharedState();
    await sharedState.initializeData();
  } catch (err) {
    console.error('Error refreshing data:', err);
    toast.error('Data Refresh Error', 'データの更新に失敗しました');
  }
}

async function fetchAndToast() {
  try {
    // Use shared state to avoid duplicate API calls
    const sharedState = useSharedState();
    await sharedState.initializeData();
  } catch (err) {
    toast.error('Error fetching data', err?.message || String(err));
  }
}

onMounted(fetchAndToast);
</script>

<style scoped>
.p-tag {
  font-weight: 600;
}
</style>
