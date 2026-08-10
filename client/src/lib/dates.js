/** Floor date for the dashboard — May 1, 2026 midnight local. */
export const MIN_DATE = new Date('2026-05-01T00:00:00');

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
