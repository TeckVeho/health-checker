import { useRuntimeConfig } from '#app'

export function useApiConfig() {
  const config = useRuntimeConfig()
  
  return {
    apiBaseUrl: config.public.apiBaseUrl || 'http://localhost:3000'
  }
} 