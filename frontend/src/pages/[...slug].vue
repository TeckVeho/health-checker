<template>
  <div class="p-6 space-y-8">
    <HealthTitle title="GitHub Health Checker" />

    <BackToDashboardLink />

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
    
    <LoadingText v-if="loading" text="Loading alerts..." aria-label="Loading alert data" />

    <!-- Alerts Section -->
    <div v-else-if="hasAlerts" class="alerts-section">
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

    <!-- Resolved Alerts Section -->
    <div v-if="!loading && hasResolvedAlerts" class="space-y-4">
      <SectionHeader 
        title="Resolved Alerts"
        :count="resolvedAlerts.length"
        description="Issues that have been automatically resolved"
        variant="resolved"
      />
      
      <AlertTable 
        :alerts="resolvedAlerts"
        :checkTypeLabels="checkTypeLabels"
        :owner="owner"
        :repo="repo"
        :loading="false"
        empty-message="No resolved alerts found for this repository."
        table-type="resolved"
        custom-class="shadow-lg"
      />
    </div>

    <!-- No Alerts Message -->
    <EmptyState 
      v-if="!loading && !hasAlerts && !hasResolvedAlerts"
      title="No Alerts Found"
      description="This repository appears to be healthy with no active or resolved alerts."
    />
  </div>
</template>

<script setup>
import { onMounted, watch, ref, computed } from 'vue'
import { useCustomToast } from '~/composables/useCustomToast'
import HealthTitle from '~/components/Atoms/HealthTitle.vue'
import AlertTable from '~/components/Molecules/AlertTable.vue'
import BackToDashboardLink from '~/components/Atoms/BackToDashboardLink.vue'
import LoadingText from '~/components/Atoms/LoadingText.vue'
import RepoAlertTitle from '~/components/Atoms/RepoAlertTitle.vue'
import SectionHeader from '~/components/Molecules/SectionHeader.vue'
import EmptyState from '~/components/Atoms/EmptyState.vue'
import RecheckButton from '~/components/Atoms/RecheckButton.vue'
import RecheckStatus from '~/components/Molecules/RecheckStatus.vue'
import RecheckHistory from '~/components/Molecules/RecheckHistory.vue'
import Dialog from 'primevue/dialog'
import { useRouteParams } from '~/composables/useRouteParams'
import { useAlerts } from '~/composables/useAlerts'
import { useRecheck } from '~/composables/useRecheck'

// Use toast for additional error handling
const toast = useCustomToast()

// Use route params composable
const { owner, repo, hasValidParams } = useRouteParams()

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
} = useAlerts(owner, repo)

// ReCheck functionality
const showHistory = ref(false)
const recheckHistoryLoading = ref(false)
const recheckHasMore = ref(false)

// Use ReCheck composable
const recheck = computed(() => {
  if (!owner.value || !repo.value) return null
  return useRecheck({
    owner: owner.value,
    repo: repo.value,
    autoRefresh: true,
    refreshInterval: 3000,
    onRecheckComplete: async () => {
      // ReCheck完了後にアラートデータを更新
      console.log('ReCheck completed, refreshing alerts...')
      await fetchAlerts()
      
      // 一時的なポーリングを開始（30秒間、5秒間隔で6回）
      startTemporaryPolling(5000)
      
      // 成功通知を表示
      toast.success('ReCheck完了', 'アラート情報を更新し、継続的に監視しています')
    }
  })
})

// ReCheck state
const recheckLoading = computed(() => recheck.value?.loading.value || false)
const recheckStatus = computed(() => recheck.value?.status.value || null)
const recheckCanExecute = computed(() => recheck.value?.canExecute.value || false)
const recheckRetryAfterSeconds = computed(() => recheck.value?.retryAfterSeconds.value || 0)
const recheckHistory = computed(() => recheck.value?.executionHistory.value || [])

// ReCheck methods
async function handleRecheck() {
  if (!recheck.value) return
  
  try {
    const result = await recheck.value.executeRecheck()
    
    if (result?.success) {
      toast.success('ReCheck Started', result.message)
      // Refresh alerts after successful ReCheck
      await fetchAlerts()
    } else if (result?.error) {
      if (result.error.code === 'RATE_LIMITED') {
        const retryAfter = result.error.retryAfter || 0
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
      } else if (result.error.code === 'CONCURRENT_LIMIT_EXCEEDED') {
        toast.warn(
          '同時実行制限に達しています', 
          '他のReCheckが実行中です。完了するまでお待ちください。'
        )
      } else if (result.error.code === 'RECHECK_DISABLED') {
        toast.error(
          'ReCheckが無効です', 
          'このリポジトリではReCheck機能が無効化されています。'
        )
      } else if (result.error.code === 'INVALID_CHECK_TYPES') {
        toast.error(
          '無効なチェックタイプ', 
          '指定されたチェックタイプが無効です。'
        )
      } else {
        toast.error('ReCheck Failed', result.error.message || 'ReCheckの実行に失敗しました')
      }
    }
  } catch (error) {
    console.error('ReCheck execution error:', error)
    toast.error('ReCheck Error', 'ReCheckの実行中にエラーが発生しました')
  }
}

async function refreshRecheckStatus() {
  if (!recheck.value) return
  await recheck.value.refreshStatus()
}

async function refreshRecheckHistory() {
  if (!recheck.value) return
  
  recheckHistoryLoading.value = true
  try {
    await recheck.value.refreshHistory()
  } finally {
    recheckHistoryLoading.value = false
  }
}

async function loadMoreHistory() {
  if (!recheck.value) return
  
  recheckHistoryLoading.value = true
  try {
    // Load more history (implement pagination logic here)
    const currentCount = recheckHistory.value.length
    await recheck.value.refreshHistory(10, currentCount)
  } finally {
    recheckHistoryLoading.value = false
  }
}
// Watch for route changes and refetch alerts
watch([owner, repo], async ([newOwner, newRepo]) => {
  if (newOwner && newRepo) {
    try {
      await Promise.all([
        fetchAlerts(),
        recheck.value?.initialize()
      ])
    } catch (err) {
      console.error('Error fetching data on route change:', err)
      toast.error('Navigation Error', 'Failed to load data for the new repository')
    }
  }
}, { immediate: true })

onMounted(() => {
  // Only show warning for invalid routes, fetchAlerts is already called by watch with immediate: true
  if (!hasValidParams.value) {
    toast.warn('Invalid Route', 'Owner and repository parameters are required')
  }
})
</script>

<style scoped>
.back-link:visited {
  color: white !important;
  text-decoration: none;
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
  
