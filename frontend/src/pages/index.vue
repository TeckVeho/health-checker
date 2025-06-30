<template>
    <div class="p-6 space-y-6">
        <HealthTitle title="GitHub Health Checker!"/>

        <!-- Filter Card -->
        <RepoFilterCard
            :showOnlyActive="showOnlyActive"
            :loading="loading"
            @toggle-active="showOnlyActive = !showOnlyActive"
        />

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
                :tableData="filteredTableData" 
                :columns="columns"
                :loading="loading"
                empty-message="No repositories found. Try adjusting your filters."
            />
        </div>
    </div>
</template>

<script setup>
import { useRepoHealth } from '@/composables/useRepoHealth'
import { useCustomToast } from '@/composables/useCustomToast'
import HealthTitle from '@/components/Atoms/HealthTitle.vue'
import HealthButton from '@/components/Atoms/HealthButton.vue'
import LoadingText from '@/components/Atoms/LoadingText.vue'
import HealthTag from '@/components/Atoms/HealthTag.vue'
import RepoFilterCard from '@/components/Molecules/RepoFilterCard.vue'
import RepoTable from '@/components/Molecules/RepoTable.vue'

const toast = useCustomToast()
const {
  columns,
  repos,
  showOnlyActive,
  filteredTableData,
  fetchData,
  loading,
} = useRepoHealth()

async function fetchAndToast() {
  try {
    await fetchData()
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
</style>
  
