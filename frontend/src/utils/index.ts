// Export all utilities
export * from './api';
export * from './github';

// Date formatting utilities
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) {
    return 'Invalid Date';
  }
  return d.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// Number formatting utilities
export function formatNumber(num: number): string {
  if (isNaN(num)) {
    return '0';
  }
  return new Intl.NumberFormat('ja-JP').format(num);
}

// Text utilities
export function truncateText(
  text: string | null | undefined,
  maxLength: number = 50
): string {
  if (!text) {
    return '';
  }
  if (text.length <= maxLength) {
    return text;
  }
  return text.substring(0, maxLength) + '...';
}
