<template>
    <div class="p-6 space-y-6">
        <h1 class="text-3xl font-bold text-primary">Mastra Frontend</h1>
        <p class="text-lg text-gray-600">GitHubリポジトリのヘルスチェックUIへようこそ。</p>

        <div v-if="repos.length === 0">
            <p>読み込み中...</p>
        </div>

        <div v-else>
            <DataTable :value="tableData" class="p-datatable-sm shadow-md border border-gray-200 rounded-md" stripedRows
                responsiveLayout="scroll">
                <Column field="name" header="Repository" />
                <Column field="branch_exists" header="Branch Exists">
                    <template #body="slotProps">
                        <Tag :value="slotProps.data.branch_exists"
                            :severity="slotProps.data.branch_exists > 0 ? 'danger' : 'success'" />
                    </template>
                </Column>
                <Column field="branch_protection" header="Branch Protection">
                    <template #body="slotProps">
                        <Tag :value="slotProps.data.branch_protection"
                            :severity="slotProps.data.branch_protection > 0 ? 'danger' : 'success'" />
                    </template>
                </Column>
                <Column field="gitleaks" header="gitleaks">
                    <template #body="slotProps">
                        <Tag :value="slotProps.data.gitleaks"
                            :severity="slotProps.data.gitleaks > 0 ? 'danger' : 'success'" />
                    </template>
                </Column>
            </DataTable>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Tag from 'primevue/tag'

const repos = ref([])
const health = ref({})

const tableData = computed(() =>
    repos.value.map((repo) => {
        const fullName = `${repo.owner}/${repo.name}`
        const healthData = health.value[fullName] || {}

        return {
            ...repo,
            branch_exists: healthData.branch_exists ?? 0,
            branch_protection: healthData.branch_protection ?? 0,
            gitleaks: healthData.gitleaks ?? 0,
        }
    })
)

onMounted(async () => {
    try {
        const config = useRuntimeConfig()
        const url = `${config.public.apiBaseUrl}/api/repos/?limit=20&sort=last_activity_at`
        const repoRes = await fetch(url)
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
        console.error('API取得エラー:', err)
    }
})
</script>
