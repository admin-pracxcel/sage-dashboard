import { useEffect, useRef, useState } from 'react';
import { formatCompareLabel } from '../lib/format';
import { MIN_DATE, today, toDateString } from '../lib/dates';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const MIN_STR = toDateString(MIN_DATE);

export default function CompareSidePanel({ compareRange, onChange, onReset }) {
  const [expanded, setExpanded] = useState(false);
  const maxDate = toDateString(today());
  const fromRef = useRef(null);
  const toRef = useRef(null);

  // Sync external value changes into input DOM only when NOT focused —
  // keeps the native date picker popup from being reset mid-interaction.
  useEffect(() => {
    if (fromRef.current && document.activeElement !== fromRef.current) {
      fromRef.current.value = compareRange.from;
    }
  }, [compareRange.from]);
  useEffect(() => {
    if (toRef.current && document.activeElement !== toRef.current) {
      toRef.current.value = compareRange.to;
    }
  }, [compareRange.to]);

  function handleField(field, value) {
    if (!ISO_DATE.test(value)) return;
    if (value < MIN_STR) value = MIN_STR;
    if (field === 'from' && value === compareRange.from) return;
    if (field === 'to' && value === compareRange.to) return;
    let from = field === 'from' ? value : compareRange.from;
    let to = field === 'to' ? value : compareRange.to;
    if (to < from) [from, to] = [to, from];
    onChange({ from, to });
  }

  return (
    <div className="py-4">
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-500">
        Compared With
      </p>

      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="mt-1.5 flex w-full items-center justify-between gap-2 rounded-lg border border-black/5 bg-white px-3 py-2 text-left shadow-sm transition-colors hover:border-black/10"
      >
        <span className="text-sm font-semibold text-gray-900">
          {formatCompareLabel(compareRange)}
        </span>
        <svg
          className={`h-4 w-4 shrink-0 text-gray-500 transition-transform ${expanded ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {expanded && (
        <div className="mt-3 flex flex-col gap-2">
          <label className="flex items-center justify-between gap-2 text-xs text-gray-600">
            From
            <input
              ref={fromRef}
              type="date"
              defaultValue={compareRange.from}
              min={MIN_STR}
              max={maxDate}
              onChange={(e) => handleField('from', e.target.value)}
              className="rounded-md border border-black/10 bg-white px-2 py-1 text-xs text-gray-900"
            />
          </label>
          <label className="flex items-center justify-between gap-2 text-xs text-gray-600">
            To
            <input
              ref={toRef}
              type="date"
              defaultValue={compareRange.to}
              min={MIN_STR}
              max={maxDate}
              onChange={(e) => handleField('to', e.target.value)}
              className="rounded-md border border-black/10 bg-white px-2 py-1 text-xs text-gray-900"
            />
          </label>
          <button
            type="button"
            onClick={() => { onReset(); setExpanded(false); }}
            className="mt-1 text-left text-xs font-medium text-brand hover:underline"
          >
            Reset to previous period
          </button>
        </div>
      )}
    </div>
  );
}
