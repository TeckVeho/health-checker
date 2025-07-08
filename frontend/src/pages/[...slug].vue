<template>
  <div class="p-6 space-y-8">
    <HealthTitle title="GitHub Health Checker" />

    <BackToDashboardLink />

    <RepoAlertTitle :owner="owner" :repo="repo" />
    <Tabs value="severity">
      <TabList>
        <Tab value="severity">Severity-based view</Tab>
        <Tab value="checkType">CheckType-based view</Tab>
      </TabList>
      <TabPanels>
        <TabPanel value="severity">
          <LoadingText v-if="loading" text="Loading alerts..." aria-label="Loading alert data" />

          <!-- Unresolved Alerts Section -->
          <div v-else-if="hasAlerts" class="space-y-4">
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
        </TabPanel>
        <TabPanel value="checkType">
          <div class="space-y-6">
            <!-- Health Summary Table -->
            <HealthSummaryCard 
              v-if="health.total > 0"
              title="Health Summary"
              description="Repository health overview by severity"
            >
              <HealthSummaryTable 
                :tableData="healthTableData"
                empty-message="No health data available"
              />
            </HealthSummaryCard>

            <!-- No Health Data Message -->
            <EmptyState 
              v-else
              title="No Health Data Available"
              description="Health summary data is not available for this repository."
            />
          </div>
        </TabPanel>
      </TabPanels>
    </Tabs>
  </div>
</template>

<script setup>
import { onMounted, watch } from 'vue'
import { useCustomToast } from '~/composables/useCustomToast'
import HealthTitle from '~/components/Atoms/HealthTitle.vue'
import AlertTable from '~/components/Molecules/AlertTable.vue'
import BackToDashboardLink from '~/components/Atoms/BackToDashboardLink.vue'
import LoadingText from '~/components/Atoms/LoadingText.vue'
import RepoAlertTitle from '~/components/Atoms/RepoAlertTitle.vue'
import SectionHeader from '~/components/Molecules/SectionHeader.vue'
import HealthSummaryCard from '~/components/Molecules/HealthSummaryCard.vue'
import HealthSummaryTable from '~/components/Molecules/HealthSummaryTable.vue'
import EmptyState from '~/components/Atoms/EmptyState.vue'
import { useRouteParams } from '~/composables/useRouteParams'
import { useAlerts } from '~/composables/useAlerts'

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
  health,
  healthTableData,
  healthColumns,
  fetchHealthSummary
} = useAlerts(owner, repo)
// Watch for route changes and refetch alerts
watch([owner, repo], async ([newOwner, newRepo]) => {
  if (newOwner && newRepo) {
    try {
      await fetchAlerts()
      await fetchHealthSummary()
    } catch (err) {
      console.error('Error fetching alerts on route change:', err)
      toast.error('Navigation Error', 'Failed to load alerts for the new repository')
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
</style>
  
