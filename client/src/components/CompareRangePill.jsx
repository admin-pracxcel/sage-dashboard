import { useEffect, useRef, useState } from 'react';
import { formatCompareLabel } from '../lib/format';
import { today, toDateString } from '../lib/dates';

export default function CompareRangePill({ compareRange, onChange, onReset }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const maxDate = toDateString(today());

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    function handleEsc(e) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [open]);

  function handleField(field, value) {
    let from = field === 'from' ? value : compareRange.from;
    let to = field === 'to' ? value : compareRange.to;
    if (to < from) [from, to] = [to, from];
    onChange({ from, to });
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 rounded-lg border border-surface-border bg-surface-card px-3 py-1.5 text-xs font-medium text-gray-500 transition-colors hover:border-brand/40 hover:text-brand"
      >
        vs {formatCompareLabel(compareRange)}
        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>
      {open && (
        <div className="absolute right-0 top-full z-20 mt-2 w-72 rounded-xl border border-surface-border bg-surface-card p-4 shadow-lg">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
            Compare to
          </p>
          <div className="flex flex-col gap-3">
            <label className="flex items-center justify-between gap-2 text-sm text-gray-500">
              From
              <input
                type="date"
                value={compareRange.from}
                max={maxDate}
                onChange={(e) => handleField('from', e.target.value)}
              />
            </label>
            <label className="flex items-center justify-between gap-2 text-sm text-gray-500">
              To
              <input
                type="date"
                value={compareRange.to}
                max={maxDate}
                onChange={(e) => handleField('to', e.target.value)}
              />
            </label>
          </div>
          <button
            onClick={() => {
              onReset();
              setOpen(false);
            }}
            className="mt-4 text-xs font-medium text-brand hover:underline"
          >
            Reset to previous period
          </button>
        </div>
      )}
    </div>
  );
}
