<template>
    <div class="p-6 space-y-6">
        <h1 class="text-3xl font-bold text-primary">GitHub Health Checker</h1>

        <NuxtLink to="/"
            class="back-link group inline-flex items-center gap-3 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl shadow-md hover:shadow-lg hover:from-blue-700 hover:to-indigo-700 active:scale-95 transition-transform duration-200 no-underline">
            <i class="pi pi-angle-left text-lg group-hover:-translate-x-1 transition-transform duration-150" />
            <span class="tracking-wide">Back to Dashboard</span>
        </NuxtLink>
        <h2 class="text-2xl font-semibold text-white">
            Alerts for {{ owner }}/{{ repo }}
        </h2>
        <div v-if="loading">Loading alerts...</div>

        <DataTable v-else :value="visibleAlerts" class="p-datatable-sm shadow-md border border-gray-200 rounded-md"
            stripedRows responsiveLayout="scroll" sortMode="multiple">
            <Column field="severity" header="Severity" sortable>
                <template #body="slotProps">
                    <Tag :value="slotProps.data.severity" :severity="getSeverity(slotProps.data.severity)" />
                </template>
            </Column>

            <Column field="checkType" header="Type" sortable>
                <template #body="slotProps">
                    {{ checkTypeLabels[slotProps.data.checkType] || slotProps.data.checkType }}
                </template>
            </Column>

            <Column field="title" header="Title" sortable />
            <Column field="description" header="Description" />

            <Column field="filePath" header="File (Line)">
                <template #body="slotProps">
                    <a v-if="slotProps.data.filePath && slotProps.data.lineNumber"
                        :href="getGitHubUrl(slotProps.data.filePath, slotProps.data.lineNumber, slotProps.data.branch)"
                        class="text-blue-600 underline hover:text-blue-800" target="_blank" rel="noopener noreferrer">
                        {{ slotProps.data.filePath }}:{{ slotProps.data.lineNumber }}
                    </a>
                    <span v-else>-</span>
                </template>
            </Column>

            <Column field="codeSnippet" header="Code">
                <template #body="slotProps">
                    <pre class="whitespace-pre-wrap text-sm text-gray-700">
  {{ slotProps.data.codeSnippet }}
            </pre>
                </template>
            </Column>
            <Column field="note" header="Note">
                <template #body="slotProps">
                    <span class="text-sm text-gray-800 whitespace-pre-wrap"
                        v-html="(slotProps.data.notes || '-').replace(/\n/g, '<br>')" />
                </template>
            </Column>
            <Column field="lastDetectedAt" header="Last Detected" sortable>
                <template #body="slotProps">
                    {{ formatDate(slotProps.data.lastDetectedAt) }}
                </template>
            </Column>
        </DataTable>
    </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useRuntimeConfig } from '#app'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Tag from 'primevue/tag'

const checkTypeLabels = {

    default_branch_violation: 'Default Branch Violation',
    branch_name_violation: 'Branch Name Violation',
    branch_protect_rule_violation: 'Branch Protect Rule Violation',
    exposed_secret_key: 'Exposed Secret Key',

    issue_format_violation: 'Issue Format Violation',
    pull_request_format_violation: 'Pull Request Format Violation',
    no_unit_test_ci: 'No Unit Test CI',
    security_risk: 'Security Risk',
    performance_issue: 'Performance Issue',
}

const route = useRoute()
const [owner, repo] = route.params.slug || []
const alerts = ref([])
const loading = ref(true)

const config = useRuntimeConfig()

const visibleAlerts = computed(() =>
    alerts.value.filter((a) => !a.isIgnored && !a.systemResolved)
)

const formatDate = (dateStr) => {
    const d = new Date(dateStr)
    const pad = (n) => n.toString().padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(
        d.getHours()
    )}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

const getSeverity = (level) => {
    if (level === 'high') return 'danger'
    if (level === 'middle') return 'warning'
    if (level === 'low') return 'info'
    return 'success'
}

const getGitHubUrl = (filePath, lineNumber, branch) => {
    const safeBranch = branch || 'main'
    return `https://github.com/${owner}/${repo}/blob/${safeBranch}/${filePath}#L${lineNumber}`
}

onMounted(async () => {
    if (!owner || !repo) return

    try {
        const res = await fetch(`${config.public.apiBaseUrl}/api/alerts/${owner}/${repo}`)
        const json = await res.json()
        alerts.value = json.alerts || []
    } catch (err) {
        console.error('Failed to fetch alerts:', err)
    } finally {
        loading.value = false
    }
})
</script>

<style scoped>
.back-link:visited {
    color: white !important;
    text-decoration: none;
}
</style>
  
