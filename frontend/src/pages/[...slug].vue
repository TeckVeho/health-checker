<template>
  <div class="p-6 space-y-8">
    <BaseText text="GitHub Health Checker" />

    <BaseButton
      action="back"
      text="Back to Dashboard"
      icon="pi pi-angle-left"
      href="/"
      variant="primary"
      customClass="group inline-flex items-center gap-3 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl shadow-md hover:shadow-lg hover:from-blue-700 hover:to-indigo-700 active:scale-95 transition-transform duration-200 no-underline"
      aria-label="Navigate back to dashboard"
    />

    <RepoAlertTitle :owner="owner" :repo="repo">
      <template #recheck v-if="hasValidParams">
        <div class="recheck-inline-controls">
          <RecheckButton
            :loading="recheckLoading"
            :can-execute="recheckCanExecute"
            :status="recheckStatus?.status || 'idle'"
            :retry-after-seconds="recheckRetryAfterSeconds"
            @click="handleRecheck"
          />

          <!-- ReCheck Status (compact inline version) -->
          <div v-if="recheckStatus" class="recheck-status-inline">
            <RecheckStatus
              :status="recheckStatus"
              :loading="recheckLoading"
              :compact="true"
              :inline="true"
              @refresh="refreshRecheckStatus"
              @view-history="showHistory = true"
            />
          </div>
        </div>
      </template>
    </RepoAlertTitle>

    <BaseText
      v-if="loading"
      text="Loading alerts..."
      :loading="true"
      aria-label="Loading alert data"
    />

    <!-- Alerts Tabs Section -->
    <div v-else class="alerts-tabs-section">
      <Tabs :value="activeTab" @update:value="handleTabChange">
        <TabList>
          <Tab value="active">Active Alerts</Tab>
          <Tab value="resolved">Resolved Alerts</Tab>
        </TabList>
        <TabPanels>
          <TabPanel value="active">
            <!-- Active Alerts Content -->
            <div class="alerts-tab-content">
              <SectionHeader
                title="Active Alerts"
                :count="visibleAlerts.length"
                description="Issues that require immediate attention"
                variant="active"
              />
              <AlertTable
                :alerts="visibleAlerts"
                :checkTypeLabels="checkTypeLabels"
                :owner="owner"
                :repo="repo"
                :loading="loading"
                empty-message="No active alerts found for this repository."
                table-type="active"
                custom-class="shadow-lg"
              />
            </div>
          </TabPanel>
          <TabPanel value="resolved">
            <!-- Resolved Alerts Content -->
            <div class="alerts-tab-content">
              <SectionHeader
                title="Resolved Alerts"
                :count="paginationInfo.items"
                description="Issues that have been automatically resolved"
                variant="resolved"
              />
              <AlertTable
                :alerts="resolvedAlerts"
                :checkTypeLabels="checkTypeLabels"
                :owner="owner"
                :repo="repo"
                :loading="resolvedAlertsLoading"
                empty-message="No resolved alerts found for this repository."
                table-type="resolved"
                custom-class="shadow-lg"
                :pagination="paginationInfo"
                :show-pagination="true"
                @on-page-change="handlePageChange"
              />
            </div>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </div>

    <!-- ReCheck History Modal -->
    <Dialog
      v-if="hasValidParams"
      v-model:visible="showHistory"
      modal
      header="ReCheck Execution History"
      :style="{ width: '90vw', maxWidth: '1000px' }"
      :closable="true"
    >
      <RecheckHistory
        :execution-history="recheckHistory"
        :loading="recheckHistoryLoading"
        :has-more="recheckHasMore"
        @refresh="refreshRecheckHistory"
        @load-more="loadMoreHistory"
      />
    </Dialog>
  </div>
</template>

<script setup>
import { onMounted, watch, ref, computed } from 'vue';
import { useCustomToast } from '~/composables/useCustomToast';
import SectionHeader from '~/components/Molecules/SectionHeader.vue';
import AlertTable from '~/components/Molecules/AlertTable.vue';
import BaseText from '~/components/Atoms/text/BaseText.vue';
import BaseButton from '~/components/Atoms/buttons/BaseButton.vue';
import RepoAlertTitle from '~/components/Atoms/RepoAlertTitle.vue';
import RecheckButton from '~/components/Atoms/RecheckButton.vue';
import RecheckStatus from '~/components/Molecules/RecheckStatus.vue';
import RecheckHistory from '~/components/Molecules/RecheckHistory.vue';
import Dialog from 'primevue/dialog';
import { useRouteParams } from '~/composables/useRouteParams';
import { useAlerts } from '~/composables/useAlerts';
import { useAlertsTabs } from '~/composables/useAlertsTabs';
import { useRecheck } from '~/composables/useRecheck';

// Use toast for additional error handling
const toast = useCustomToast();

// Use route params composable
const { owner, repo, hasValidParams } = useRouteParams();

// Use the alerts composable
const {
  loading,
  error,
  visibleAlerts,
  checkTypeLabels,
  fetchAlerts,
  resolvedAlerts,
  hasAlerts,
  hasResolvedAlerts,
  startTemporaryPolling,
  isTemporaryPolling,
  resolvedAlertsLoading,
  resolvedAlertsPagination,
  paginationInfo,
  fetchResolvedAlerts,
  goToPage,
} = useAlerts(computed(() => owner.value), computed(() => repo.value));

// Use the alerts tabs composable
const { activeTab, setActiveTab, initializeFromUrl } = useAlertsTabs();

// Handle page changes for resolved alerts
const handlePageChange = (page) => {
  console.log('handlePageChange called with page:', page);
  goToPage(page);
};

// ReCheck functionality
const showHistory = ref(false);
const recheckHistoryLoading = ref(false);
const recheckHasMore = ref(false);

// Use ReCheck composable
const recheck = computed(() => {
  if (!owner.value || !repo.value) return null;
  return useRecheck({
    owner: owner.value,
    repo: repo.value,
    autoRefresh: true,
    refreshInterval: 3000,
    onRecheckComplete: async () => {
      // ReCheck完了後にアラートデータを更新
      console.log('ReCheck completed, refreshing alerts...');
      await fetchAlerts();

      // 一時的なポーリングを開始（1秒後に1回だけ）
      startTemporaryPolling(1000);

      // 成功通知を表示
      toast.success('ReCheck完了', 'アラート情報を更新しました');
    },
  });
});

// ReCheck state
const recheckLoading = computed(() => recheck.value?.loading.value || false);
const recheckStatus = computed(() => recheck.value?.status.value || null);
const recheckCanExecute = computed(
  () => recheck.value?.canExecute.value || false
);
const recheckRetryAfterSeconds = computed(
  () => recheck.value?.retryAfterSeconds.value || 0
);
const recheckHistory = computed(
  () => recheck.value?.executionHistory.value || []
);

// ReCheck methods
async function handleRecheck() {
  if (!recheck.value) return;

  try {
    const result = await recheck.value.executeRecheck();

    if (result?.success) {
      toast.success('ReCheck Started', result.message);
      // Refresh alerts after successful ReCheck
      await fetchAlerts();
    } else if (result?.error) {
      if (result.error.code === 'RATE_LIMITED') {
        const retryAfter = result.error.retryAfter || 0;
        const minutes = Math.ceil(retryAfter / 60);
        const seconds = retryAfter % 60;
        let timeMessage = '';

        if (minutes > 0) {
          timeMessage =
            seconds > 0 ? `${minutes}分${seconds}秒` : `${minutes}分`;
        } else {
          timeMessage = `${seconds}秒`;
        }

        toast.warn(
          '時間制限によりReCheckできません',
          `前回の実行から3分経過していません。あと${timeMessage}お待ちください。`
        );
      } else if (result.error.code === 'CONCURRENT_LIMIT_EXCEEDED') {
        toast.warn(
          '同時実行制限に達しています',
          '他のReCheckが実行中です。完了するまでお待ちください。'
        );
      } else if (result.error.code === 'RECHECK_DISABLED') {
        toast.error(
          'ReCheckが無効です',
          'このリポジトリではReCheck機能が無効化されています。'
        );
      } else if (result.error.code === 'INVALID_CHECK_TYPES') {
        toast.error(
          '無効なチェックタイプ',
          '指定されたチェックタイプが無効です。'
        );
      } else {
        toast.error(
          'ReCheck Failed',
          result.error.message || 'ReCheckの実行に失敗しました'
        );
      }
    }
  } catch (error) {
    console.error('ReCheck execution error:', error);
    toast.error('ReCheck Error', 'ReCheckの実行中にエラーが発生しました');
  }
}

async function refreshRecheckStatus() {
  if (!recheck.value) return;
  await recheck.value.refreshStatus();
}

async function refreshRecheckHistory() {
  if (!recheck.value) return;

  recheckHistoryLoading.value = true;
  try {
    await recheck.value.refreshHistory();
  } finally {
    recheckHistoryLoading.value = false;
  }
}

async function loadMoreHistory() {
  if (!recheck.value) return;

  recheckHistoryLoading.value = true;
  try {
    // Load more history (implement pagination logic here)
    const currentCount = recheckHistory.value.length;
    await recheck.value.refreshHistory(10, currentCount);
  } finally {
    recheckHistoryLoading.value = false;
  }
}

// Tab change handler
const handleTabChange = (tab) => {
  console.log('Tab change requested:', tab);
  console.log('Current activeTab:', activeTab.value);
  setActiveTab(tab);
  console.log('After setActiveTab, activeTab:', activeTab.value);
  
  // Fetch resolved alerts when switching to resolved tab
  if (tab === 'resolved' && resolvedAlerts.value.length === 0) {
    fetchResolvedAlerts();
  }
};
// Watch for route changes and refetch alerts
watch(
  [owner, repo],
  async ([newOwner, newRepo]) => {
    if (newOwner && newRepo) {
      try {
        await Promise.all([fetchAlerts(), recheck.value?.initialize()]);
      } catch (err) {
        console.error('Error fetching data on route change:', err);
        toast.error(
          'Navigation Error',
          'Failed to load data for the new repository'
        );
      }
    }
  },
  { immediate: true }
);

onMounted(() => {
  // Initialize tab state from URL
  initializeFromUrl();
  
  // If resolved tab is active, also fetch resolved alerts
  if (activeTab.value === 'resolved') {
    fetchResolvedAlerts();
  }
  
  // Only show warning for invalid routes, fetchAlerts is already called by watch with immediate: true
  if (!hasValidParams.value) {
    toast.warn('Invalid Route', 'Owner and repository parameters are required');
  }
});
</script>

<style scoped>
.back-link:visited {
  color: white !important;
  text-decoration: none;
}

/* Alerts tabs section */
.alerts-tabs-section {
  @apply space-y-6;
}

.alerts-tab-content {
  @apply space-y-6;
}

/* ReCheck inline controls */
.recheck-inline-controls {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.recheck-status-inline {
  display: flex;
  align-items: center;
}

.alerts-section {
  margin-top: 2rem;
}

/* Responsive design */
@media (max-width: 768px) {
  .recheck-inline-controls {
    justify-content: flex-start;
    width: 100%;
  }

  .recheck-status-inline {
    margin-top: 0.75rem;
  }

  .alerts-section {
    margin-top: 1.5rem;
  }
}
</style>
