<template>
  <div class="alerts-tab-content">
    
    <!-- Active Alerts Tab Content -->
    <div v-show="activeTab === 'active'" :key="activeTab" class="active-alerts-content">
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

    <!-- Resolved Alerts Tab Content -->
    <div v-show="activeTab === 'resolved'" :key="activeTab" class="resolved-alerts-content">
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
        :on-page-change="handlePageChange"
      />
    </div>

    <!-- No Alerts Message -->
    <BaseState
      v-if="!loading && !hasAlerts && !hasResolvedAlerts"
      type="empty"
      title="No Alerts Found"
      description="This repository appears to be healthy with no active or resolved alerts."
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, watchEffect } from 'vue';
import { useAlerts } from '~/composables/useAlerts';
import { useAlertsTabs } from '~/composables/useAlertsTabs';
import AlertTable from '~/components/Molecules/AlertTable.vue';
import SectionHeader from '~/components/Molecules/SectionHeader.vue';
import BaseState from '~/components/Atoms/states/BaseState.vue';
import type { AlertsTabContentProps } from '@/types/alerts';

const props = defineProps<AlertsTabContentProps>();

// Use composables
const {
  visibleAlerts,
  resolvedAlerts,
  hasAlerts,
  hasResolvedAlerts,
  loading,
  paginationInfo,
  resolvedAlertsLoading,
  fetchAlerts,
  fetchResolvedAlerts,
  goToPage,
} = useAlerts(computed(() => props.owner), computed(() => props.repo));

const { activeTab } = useAlertsTabs();

// activeTab is already a computed, use it directly in template

// Debug logging
console.log('AlertsTabContent - activeTab:', activeTab.value);

// Watch for tab changes and fetch appropriate data (副作用処理のみ)
watchEffect(() => {
  const currentTab = activeTab.value;
  console.log('AlertsTabContent - activeTab changed to:', currentTab);
  if (currentTab === 'resolved' && resolvedAlerts.value.length === 0) {
    // Fetch resolved alerts when switching to resolved tab
    fetchResolvedAlerts();
  }
});

// Handle page changes for resolved alerts
const handlePageChange = (page: number) => {
  goToPage(page);
};

// Initialize data on mount
onMounted(() => {
  // Fetch active alerts on mount
  fetchAlerts();
  
  // If resolved tab is active, also fetch resolved alerts
  if (activeTab.value === 'resolved') {
    fetchResolvedAlerts();
  }
});
</script>

<style scoped>
.alerts-tab-content {
  @apply space-y-6;
}

.active-alerts-content,
.resolved-alerts-content {
  @apply space-y-4;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .alerts-tab-content {
    @apply space-y-4;
  }
}
</style>
