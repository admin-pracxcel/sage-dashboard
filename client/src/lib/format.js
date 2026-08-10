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

import { fromDateString } from './dates';

/**
 * Smart label for a { from, to } range.
 * - Full calendar month (from='YYYY-MM-01', to=last day of same month) → "Jul"
 * - Same month, partial → "Jul 25 – Jul 31"
 * - Different months → "Jul 25 – Aug 3"
 */
function formatRangeLabel(range) {
  const from = fromDateString(range.from);
  const to = fromDateString(range.to);
  const sameMonth = from.getFullYear() === to.getFullYear() && from.getMonth() === to.getMonth();
  const lastDayOfMonth = new Date(from.getFullYear(), from.getMonth() + 1, 0).getDate();
  const isFullMonth = sameMonth && from.getDate() === 1 && to.getDate() === lastDayOfMonth;

  if (isFullMonth) return format(from, 'MMM');
  if (sameMonth) return `${format(from, 'MMM d')} – ${format(to, 'MMM d')}`;
  return `${format(from, 'MMM d')} – ${format(to, 'MMM d')}`;
}

export function formatCompareLabel(range) {
  return formatRangeLabel(range);
}

export function formatMainLabel(range) {
  return formatRangeLabel(range);
}
