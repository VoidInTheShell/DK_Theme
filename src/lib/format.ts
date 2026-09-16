import { formatTrafficBytes } from "@/lib/traffic-format";
export function formatCurrency(cents?: number | null) {
  if (cents == null) return '--';
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY',
  }).format(cents / 100);
}

export function formatBytes(bytes?: number | null) {
  return formatTrafficBytes(bytes);
}

export function formatDateTime(timestamp?: number | null) {
  if (!timestamp) return '--';
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(timestamp * 1000);
}
