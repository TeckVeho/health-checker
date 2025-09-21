import type { ToastMessageOptions } from 'primevue/toast';
import { useNuxtApp } from '#app';

export function useCustomToast() {
  const { $toast } = useNuxtApp();

  const show = (options: ToastMessageOptions) => {
    try {
      if ($toast) {
        ($toast as { add: (options: ToastMessageOptions) => void }).add(
          options
        );
      } else {
        console.warn('Toast service not available');
      }
    } catch (error) {
      console.error('Toast error:', error);
    }
  };

  const success = (detail: string, summary?: string) => {
    show({
      severity: 'success',
      summary: summary || 'Success',
      detail,
      life: 3000,
    });
  };

  const error = (detail: string, summary?: string) => {
    show({
      severity: 'error',
      summary: summary || 'Error',
      detail,
      life: 4000,
    });
  };

  const info = (detail: string, summary?: string) => {
    show({
      severity: 'info',
      summary: summary || 'Info',
      detail,
      life: 3000,
    });
  };

  const warn = (detail: string, summary?: string) => {
    show({
      severity: 'warn',
      summary: summary || 'Warning',
      detail,
      life: 3500,
    });
  };

  return { show, success, error, info, warn };
}
