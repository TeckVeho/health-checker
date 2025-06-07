<template>
    <div class="p-6 space-y-6">
        <h1 class="text-3xl font-bold text-white">GitHub Health Checker</h1>

        <!-- Filter Card -->
        <Card class="w-full shadow-sm border border-gray-200 mb-4 rounded-xl">
            <template #content>
                <div class="flex flex-col md:flex-row justify-between items-center gap-4">
                    <Button :label="showOnlyActive ? 'Only Active Repo: ON' : 'Only Active Repo: OFF'"
                        :icon="showOnlyActive ? 'pi pi-check-circle' : 'pi pi-times-circle'"
                        :severity="showOnlyActive ? 'info' : 'secondary'" outlined
                        @click="showOnlyActive = !showOnlyActive" />
                </div>
            </template>
        </Card>

        <!-- Loading -->
        <div v-if="repos.length === 0">
            <p class="text-white">Loading repositories...</p>
        </div>

        <!-- Repo Table -->
        <div v-else>
            <DataTable :value="filteredTableData" class="p-datatable-sm shadow-md border border-gray-200 rounded-md"
                stripedRows responsiveLayout="scroll" sortMode="multiple">
                <Column field="name" header="Repository" sortable>
                    <template #body="slotProps">
                        <div class="flex items-center text-white">
                            <span class="font-medium">
                                {{ slotProps.data.name }}
                            </span>
                            &nbsp;
                            <RouterLink :to="`/${slotProps.data.owner}/${slotProps.data.name}`"
                                class="hover:text-blue-300 transition">
                                <i class="pi pi-external-link text-sm align-middle" />
                            </RouterLink>
                        </div>



                    </template>
                </Column>

                <Column field="totalViolations" header="Total" sortable>
                    <template #body="slotProps">
                        <Tag :value="slotProps.data.totalViolations"
                            :severity="slotProps.data.totalViolations > 0 ? 'danger' : 'success'" />
                    </template>
                </Column>

                <Column v-for="column in columns" :key="column.key" :field="column.key" :header="column.label" sortable>
                    <template #body="slotProps">
                        <Tag :value="slotProps.data[column.key]"
                            :severity="slotProps.data[column.key] > 0 ? column.tagSeverity : 'success'" />
                    </template>
                </Column>
            </DataTable>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRuntimeConfig } from '#app'
import { RouterLink } from 'vue-router'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Tag from 'primevue/tag'
import Card from 'primevue/card'
import Button from 'primevue/button'

const columns = [
    { label: 'High', key: 'high', tagSeverity: 'danger' },
    { label: 'Middle', key: 'middle', tagSeverity: 'warning' },
    { label: 'Low', key: 'low', tagSeverity: 'info' },
]

const repos = ref([])
const health = ref({})
const showOnlyActive = ref(true)

const tableData = computed(() =>
    repos.value.map((repo) => {
        const fullName = `${repo.owner}/${repo.name}`
        const healthData = health.value[fullName] || {}

        const row = { ...repo }
        let total = 0
        for (const col of columns) {
            const val = healthData[col.key] ?? 0
            row[col.key] = val
            total += val
        }
        row.totalViolations = total
        return row
    })
)

const filteredTableData = computed(() => {
    if (!showOnlyActive.value) return tableData.value

    const threshold = new Date()
    threshold.setDate(threshold.getDate() - 14)

    return tableData.value.filter((repo) => {
        const lastActivity = new Date(repo.lastActivityAt)
        return !isNaN(lastActivity) && lastActivity >= threshold
    })
})

onMounted(async () => {
    try {
        const config = useRuntimeConfig()
        const repoRes = await fetch(
            `${config.public.apiBaseUrl}/api/repos/?limit=200&sort=last_activity_at`
        )
        const repoJson = await repoRes.json()
        repos.value = repoJson.data || []

        const summaryUrl = `${config.public.apiBaseUrl}/api/alerts/summary`
        const summaryRes = await fetch(summaryUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(
                repos.value.map((r) => ({ owner: r.owner, repo: r.name }))
            ),
        })
        health.value = await summaryRes.json()
    } catch (err) {
        console.error('Failed to fetch API data:', err)
    }
})
</script>

<style scoped>
.p-tag {
    font-weight: 600;
}
</style>
  
