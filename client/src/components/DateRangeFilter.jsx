import { useEffect, useRef } from 'react';
import { MIN_DATE, toDateString } from '../lib/dates';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const MIN_STR = toDateString(MIN_DATE);

export default function DateRangeFilter({ dateRange, maxDate, onChange }) {
  const maxStr = toDateString(maxDate);
  const fromRef = useRef(null);
  const toRef = useRef(null);

  // Sync external value changes into the input DOM only when NOT focused,
  // so the native date picker popup is never yanked out from under the user.
  useEffect(() => {
    if (fromRef.current && document.activeElement !== fromRef.current) {
      fromRef.current.value = dateRange.from;
    }
  }, [dateRange.from]);
  useEffect(() => {
    if (toRef.current && document.activeElement !== toRef.current) {
      toRef.current.value = dateRange.to;
    }
  }, [dateRange.to]);

  function handleChange(field, value) {
    if (!ISO_DATE.test(value)) return;
    // Clamp typed values below the launch floor.
    if (value < MIN_STR) value = MIN_STR;
    if (field === 'from' && value === dateRange.from) return;
    if (field === 'to' && value === dateRange.to) return;
    let from = field === 'from' ? value : dateRange.from;
    let to = field === 'to' ? value : dateRange.to;
    if (to < from) [from, to] = [to, from];
    onChange({ from, to });
  }

  return (
    <div className="animate-slide-up stagger-1 flex flex-wrap items-center gap-4 opacity-0">
      <div className="flex items-center gap-2">
        <svg className="h-4 w-4 text-brand" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
        </svg>
        <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Range</span>
      </div>
      <label className="flex items-center gap-2 text-sm text-gray-500">
        From
        <input
          ref={fromRef}
          type="date"
          defaultValue={dateRange.from}
          min={MIN_STR}
          max={maxStr}
          onChange={(e) => handleChange('from', e.target.value)}
        />
      </label>
      <span className="text-gray-300">—</span>
      <label className="flex items-center gap-2 text-sm text-gray-500">
        To
        <input
          ref={toRef}
          type="date"
          defaultValue={dateRange.to}
          min={MIN_STR}
          max={maxStr}
          onChange={(e) => handleChange('to', e.target.value)}
        />
      </label>
    </div>
  );
}
