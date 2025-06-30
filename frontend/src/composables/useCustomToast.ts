import type { ToastMessageOptions } from 'primevue/toast'
import { useNuxtApp } from '#app'

export function useCustomToast() {
  const { $toast } = useNuxtApp()

  const show = (options: ToastMessageOptions) => {
    if ($toast) {
      ($toast as any).add(options)
    } else {
      console.warn('Toast service not available')
    }
  }

  const success = (summary: string, detail?: string) => {
    show({ severity: 'success', summary, detail, life: 3000 })
  }

  const error = (summary: string, detail?: string) => {
    show({ severity: 'error', summary, detail, life: 4000 })
  }

  const info = (summary: string, detail?: string) => {
    show({ severity: 'info', summary, detail, life: 3000 })
  }

  const warn = (summary: string, detail?: string) => {
    show({ severity: 'warn', summary, detail, life: 3500 })
  }

  return { show, success, error, info, warn }
} 