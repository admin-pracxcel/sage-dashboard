/** Site launch — no lead data exists before this date. */
export const MIN_DATE = new Date(2026, 7, 1); // 1 August 2026

/** Today at midnight local (stable per render cycle). */
export function today() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Clamp a date between min and max. */
export function clamp(date, min, max) {
  if (date < min) return min;
  if (date > max) return max;
  return date;
}

/** Format a Date to "YYYY-MM-DD" for <input type="date"> value. */
export function toDateString(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Parse "YYYY-MM-DD" into a Date at midnight local. */
export function fromDateString(str) {
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** { from, to } for the 1st of the current month → today, as YYYY-MM-DD strings. */
export function currentMonthRange() {
  const now = today();
  const first = new Date(now.getFullYear(), now.getMonth(), 1);
  return { from: toDateString(first), to: toDateString(now) };
}

/** Integer days between two dates, ignoring time of day. b - a. */
export function daysBetween(a, b) {
  const MS = 24 * 60 * 60 * 1000;
  const aMid = new Date(a);
  aMid.setHours(0, 0, 0, 0);
  const bMid = new Date(b);
  bMid.setHours(0, 0, 0, 0);
  return Math.round((bMid - aMid) / MS);
}

/** Inclusive day count of a { from, to } range. */
export function daysInRange({ from, to }) {
  return daysBetween(fromDateString(from), fromDateString(to)) + 1;
}

/**
 * Given a { from, to } range, return the same-length range ending on the day before `from`.
 * Example: { from: '2026-08-01', to: '2026-08-07' } (7 days) → { from: '2026-07-25', to: '2026-07-31' }.
 */
export function priorSameLengthRange(range) {
  const length = daysInRange(range);
  const fromDate = fromDateString(range.from);
  const priorTo = new Date(fromDate);
  priorTo.setDate(priorTo.getDate() - 1);
  const priorFrom = new Date(priorTo);
  priorFrom.setDate(priorFrom.getDate() - (length - 1));
  return { from: toDateString(priorFrom), to: toDateString(priorTo) };
}
