<template>
  <div class="p-6 space-y-6">
    <HealthTitle title="GitHub Health Checker" />

    <BackToDashboardLink />

    <RepoAlertTitle :owner="owner" :repo="repo" />

    <LoadingText v-if="loading" text="Loading alerts..." aria-label="Loading alert data" />

    <AlertTable 
      v-else
      :alerts="visibleAlerts"
      :checkTypeLabels="checkTypeLabels"
      :owner="owner"
      :repo="repo"
      :loading="loading"
      empty-message="No alerts found for this repository."
    />
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
  fetchAlerts
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
</style>
  
