<template>
  <div class="p-8">
    <h1 class="text-2xl font-bold mb-4">環境変数テスト</h1>
    
    <div class="space-y-4">
      <div class="bg-gray-100 p-4 rounded">
        <h2 class="font-semibold mb-2">環境変数の値:</h2>
        <ul class="space-y-2">
          <li><strong>API_BASE_URL:</strong> {{ apiBaseUrl }}</li>
          <li><strong>NUXT_PUBLIC_API_BASE_URL:</strong> {{ nuxtPublicApiBaseUrl }}</li>
          <li><strong>Runtime Config API Base URL:</strong> {{ runtimeConfigApiBaseUrl }}</li>
          <li><strong>NODE_ENV:</strong> {{ nodeEnv }}</li>
        </ul>
      </div>
      
      <div class="bg-blue-100 p-4 rounded">
        <h2 class="font-semibold mb-2">useApiConfig()の結果:</h2>
        <p><strong>API Base URL:</strong> {{ computedApiBaseUrl }}</p>
      </div>
      
      <div class="bg-green-100 p-4 rounded">
        <h2 class="font-semibold mb-2">API接続テスト:</h2>
        <button 
          @click="testApiConnection" 
          :disabled="testing"
          class="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          {{ testing ? 'テスト中...' : 'API接続テスト' }}
        </button>
        <div v-if="testResult" class="mt-2">
          <p><strong>結果:</strong> {{ testResult }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useApiConfig } from '~/composables/useApiConfig'

const { apiBaseUrl: computedApiBaseUrl } = useApiConfig()

// 環境変数の値を直接取得
const apiBaseUrl = ref(process.env.API_BASE_URL || 'undefined')
const nuxtPublicApiBaseUrl = ref(process.env.NUXT_PUBLIC_API_BASE_URL || 'undefined')
const nodeEnv = ref(process.env.NODE_ENV || 'undefined')

// Runtime Configの値を取得
const config = useRuntimeConfig()
const runtimeConfigApiBaseUrl = ref(config.public?.apiBaseUrl || 'undefined')

// API接続テスト
const testing = ref(false)
const testResult = ref('')

const testApiConnection = async () => {
  testing.value = true
  testResult.value = ''
  
  try {
    const response = await fetch(`${computedApiBaseUrl.value}/health`)
    if (response.ok) {
      testResult.value = '✅ API接続成功'
    } else {
      testResult.value = `❌ API接続失敗: ${response.status} ${response.statusText}`
    }
  } catch (error) {
    testResult.value = `❌ API接続エラー: ${error.message}`
  } finally {
    testing.value = false
  }
}
</script>
