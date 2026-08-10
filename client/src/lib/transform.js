// ---------------------------------------------------------------------------
// Pure filter/count functions — the single source of truth for all
// source-mapping, new-patient, and missed-opportunity rules.
// ---------------------------------------------------------------------------

/**
 * Filter website + calls arrays to rows whose date falls within [from, to].
 * Both bounds are inclusive (compared at start-of-day / end-of-day).
 */
export function applyDateRange({ website, calls }, from, to) {
  const start = new Date(from);
  start.setHours(0, 0, 0, 0);

  const end = new Date(to);
  end.setHours(23, 59, 59, 999);

  return {
    website: website.filter((r) => {
      const d = new Date(r.leadDate);
      return d >= start && d <= end;
    }),
    calls: calls.filter((r) => {
      const d = new Date(r.dateTime);
      return d >= start && d <= end;
    }),
  };
}

/**
 * Keep only rows matching a given source ("SEO" | "PPC").
 */
export function filterBySource({ website, calls }, source) {
  return {
    website: website.filter((r) => r.source === source),
    calls: calls.filter((r) => r.source === source),
  };
}

/**
 * Keep only new-patient rows.
 * Website: isExistingPatient !== "Yes" (so "No" and null both count).
 * Calls:   tag === "New Patient".
 */
export function filterNewPatients({ website, calls }) {
  return {
    website: website.filter((r) => r.isExistingPatient !== 'Yes'),
    calls: calls.filter((r) => r.tag === 'New Patient'),
  };
}

/**
 * Keep only missed-opportunity calls (calls only — website returns empty).
 */
export function filterMissedOpportunities({ calls }) {
  return {
    website: [],
    calls: calls.filter((r) => r.tag === 'Missed Opportunity'),
  };
}

import { daysBetween, daysInRange, fromDateString } from './dates';

/**
 * Bucket `rows` into daily counts indexed by day-of-period.
 * Returns an array of length daysInRange(range) with { day, count } entries (day is 1-indexed).
 * Rows whose date falls outside `range` are ignored.
 */
export function dailyCountsByDay(rows, dateField, range) {
  const length = daysInRange(range);
  const start = fromDateString(range.from);
  const buckets = Array.from({ length }, (_, i) => ({ day: i + 1, count: 0 }));

  for (const row of rows) {
    const rowDate = new Date(row[dateField]);
    const offset = daysBetween(start, rowDate);
    if (offset >= 0 && offset < length) {
      buckets[offset].count += 1;
    }
  }

  return buckets;
}
