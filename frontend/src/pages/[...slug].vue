<template>
  <div class="p-6 space-y-8">
    <HealthTitle title="GitHub Health Checker" />

    <BackToDashboardLink />

    <RepoAlertTitle :owner="owner" :repo="repo" />

    <LoadingText v-if="loading" text="Loading alerts..." aria-label="Loading alert data" />

    <!-- Unresolved Alerts Section -->
    <div v-else-if="hasAlerts" class="space-y-4">
      <div class="p-4">
        <h2 class="text-xl font-bold text-red-800">
          Active Alerts ({{ visibleAlerts.length }})
        </h2>
        <p class="text-sm text-red-600 mt-1">Issues that require immediate attention</p>
      </div>
      
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
      <div class="p-4">
        <h2 class="text-xl font-bold text-green-800">
          Resolved Alerts ({{ resolvedAlerts.length }})
        </h2>
        <p class="text-sm text-green-600 mt-1">Issues that have been automatically resolved</p>
      </div>
      
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
    <div v-if="!loading && !hasAlerts && !hasResolvedAlerts" class="text-center py-12">
      <div class="max-w-md mx-auto">
        <h3 class="text-lg font-medium text-gray-900 mb-2">No Alerts Found</h3>
        <p class="text-gray-500">This repository appears to be healthy with no active or resolved alerts.</p>
      </div>
    </div>
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
  hasResolvedAlerts
} = useAlerts(owner, repo)

// Watch for route changes and refetch alerts
watch([owner, repo], async ([newOwner, newRepo]) => {
  if (newOwner && newRepo) {
    try {
      await fetchAlerts()
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

/* Ensure title styling is applied - only for section titles, not table headers */
h2.text-red-800 {
  color: #991b1b !important;
  font-weight: 700 !important;
  font-size: 1.25rem !important;
  line-height: 1.75rem !important;
}

h2.text-green-800 {
  color: #166534 !important;
  font-weight: 700 !important;
  font-size: 1.25rem !important;
  line-height: 1.75rem !important;
}

p.text-red-600 {
  color: #dc2626 !important;
  font-size: 0.875rem !important;
  line-height: 1.25rem !important;
}

p.text-green-600 {
  color: #16a34a !important;
  font-size: 0.875rem !important;
  line-height: 1.25rem !important;
}
</style>
  
