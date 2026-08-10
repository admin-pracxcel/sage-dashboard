import { format } from 'date-fns';

/** "27 May 2026" */
export function formatDate(iso) {
  return format(new Date(iso), 'd MMM yyyy');
}

/** "27 May 2026, 3:15 PM" */
export function formatDateTime(iso) {
  return format(new Date(iso), 'd MMM yyyy, h:mm a');
}

/** "6m 55s" or "0m 12s" */
export function formatDuration(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
}

/** "+61 420 702 296" → "+61 420 702 296" (trim whitespace) */
export function formatPhone(raw) {
  return raw ? raw.trim() : '—';
}

/** "2 minutes ago" style relative timestamp */
export function formatTimestamp(iso) {
  return format(new Date(iso), 'd MMM yyyy, h:mm:ss a');
}
