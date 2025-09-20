<template>
    <div class="p-6 space-y-6">
        <HealthTitle title="GitHub Health Checker!"/>

        <!-- Filter Card -->
        <RepoFilterCard
            :showOnlyActive="showOnlyActive"
            :loading="loading || checkTypeLoading"
            @toggle-active="handleToggleFilter"
        />

        <!-- ReCheck Button -->
        <div class="recheck-section">
            <div class="flex items-center justify-between mb-4">
                <h3 class="text-lg font-semibold text-white">Repository Health Check</h3>
                <RecheckButton
                    :loading="recheckLoading"
                    :can-execute="recheckCanExecute"
                    :status="recheckStatus?.status || 'idle'"
                    :retry-after-seconds="recheckRetryAfterSeconds"
                    @click="handleRecheck"
                />
            </div>
            
            <!-- ReCheck Status -->
            <div v-if="recheckStatus" class="mb-4">
                <RecheckStatus
                    :status="recheckStatus"
                    :loading="recheckLoading"
                    :compact="true"
                    @refresh="refreshRecheckStatus"
                />
            </div>
        </div>

        <Tabs :value="activeTab" @update:value="handleTabChange">
          <TabList>
            <Tab value="severity">Severity-based view</Tab>
            <Tab value="checkType">CheckType-based view</Tab>
            <Tab value="author">Author-based view</Tab>
          </TabList>
          <TabPanels>
            <TabPanel value="severity">
              <!-- Loading -->
              <div v-if="repos.length === 0">
                <LoadingText 
                  text="Loading repositories..."
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
              <div v-if="repos.length === 0">
                <LoadingText 
                  text="Loading checkType data..."
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
import { onMounted, computed } from 'vue'
import { useRepoHealth } from '@/composables/useRepoHealth'
import { useCheckTypeAlerts } from '@/composables/useCheckTypeAlerts'
import { useTabState } from '@/composables/useTabState'
import { useSharedState } from '@/composables/useSharedState'
import { useCustomToast } from '@/composables/useCustomToast'
import { useRecheck } from '@/composables/useRecheck'
import HealthTitle from '@/components/Atoms/HealthTitle.vue'
import HealthButton from '@/components/Atoms/HealthButton.vue'
import LoadingText from '@/components/Atoms/LoadingText.vue'
import HealthTag from '@/components/Atoms/HealthTag.vue'
import RepoFilterCard from '@/components/Molecules/RepoFilterCard.vue'
import RepoTable from '@/components/Molecules/RepoTable.vue'
import AuthorGroupedTable from '@/components/Molecules/AuthorGroupedTable.vue'
import RecheckButton from '@/components/Atoms/RecheckButton.vue'
import RecheckStatus from '@/components/Molecules/RecheckStatus.vue'

const toast = useCustomToast()

// Tab state management
const { activeTab, setActiveTab } = useTabState()

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
} = useRepoHealth()

// Shared state for polling functionality
const sharedState = useSharedState()
const { startTemporaryPolling, isTemporaryPolling } = sharedState

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
} = useCheckTypeAlerts()

const handleSortChange = (field, order) => {
  updateSortState(field, order)
}

const handleCheckTypeSortChange = (field, order) => {
  updateCheckTypeSortState(field, order)
}

const handleTabChange = (tab) => {
  setActiveTab(tab)
}

const handleToggleFilter = () => {
  toggleShowOnlyActive()
  toggleCheckTypeShowOnlyActive()
}

// ReCheck functionality
const recheck = useRecheck({
  owner: 'global', // Global recheck for all repositories
  repo: 'global',
  autoRefresh: true,
  refreshInterval: 5000,
  isGlobal: true,
  onRecheckComplete: async () => {
    // ReCheck完了後に全データを更新
    console.log('Global ReCheck completed, refreshing all data...')
    await refreshAllData()
    
    // 一時的なポーリングを開始（1秒後に1回だけ）
    startTemporaryPolling(1000)
    
    // 成功通知を表示
    toast.success('ReCheck完了', '全リポジトリの情報を更新しました')
  }
})

// ReCheck state
const recheckLoading = computed(() => recheck.loading.value)
const recheckStatus = computed(() => recheck.status.value)
const recheckCanExecute = computed(() => recheck.canExecute.value)
const recheckRetryAfterSeconds = computed(() => recheck.retryAfterSeconds.value)

// ReCheck methods
async function handleRecheck() {
  try {
    const result = await recheck.executeRecheck()
    
    if (result?.success) {
      toast.success('ReCheck Started', result.message)
      // Refresh all data after successful ReCheck
      await refreshAllData()
    } else if (result?.error) {
      handleRecheckError(result.error)
    }
  } catch (error) {
    console.error('ReCheck execution error:', error)
    toast.error('ReCheck Error', 'ReCheckの実行中にエラーが発生しました')
  }
}

function handleRecheckError(error: any) {
  if (error.code === 'RATE_LIMITED') {
    const retryAfter = error.retryAfter || 0
    const minutes = Math.ceil(retryAfter / 60)
    const seconds = retryAfter % 60
    let timeMessage = ''
    
    if (minutes > 0) {
      timeMessage = seconds > 0 ? `${minutes}分${seconds}秒` : `${minutes}分`
    } else {
      timeMessage = `${seconds}秒`
    }
    
    toast.warn(
      '時間制限によりReCheckできません', 
      `前回の実行から3分経過していません。あと${timeMessage}お待ちください。`
    )
  } else if (error.code === 'CONCURRENT_LIMIT_EXCEEDED') {
    toast.warn(
      '同時実行制限に達しています', 
      '他のReCheckが実行中です。完了するまでお待ちください。'
    )
  } else {
    toast.error('ReCheck Failed', error.message || 'ReCheckの実行に失敗しました')
  }
}

async function refreshRecheckStatus() {
  await recheck.refreshStatus()
}

async function refreshAllData() {
  try {
    const sharedState = useSharedState()
    await sharedState.initializeData()
  } catch (err) {
    console.error('Error refreshing data:', err)
    toast.error('Data Refresh Error', 'データの更新に失敗しました')
  }
}

async function fetchAndToast() {
  try {
    // Use shared state to avoid duplicate API calls
    const sharedState = useSharedState()
    await sharedState.initializeData()
    
    // Initialize ReCheck functionality
    await recheck.initialize()
  } catch (err) {
    toast.error('Error fetching data', err?.message || String(err))
  }
}

onMounted(fetchAndToast)
</script>

<style scoped>
.p-tag {
    font-weight: 600;
}

/* ReCheck section styles */
.recheck-section {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    padding: 1rem;
    margin-bottom: 1rem;
}

.recheck-section h3 {
    color: white;
    margin: 0;
}
</style>
  
