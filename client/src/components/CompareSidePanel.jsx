import { useState } from 'react';
import { formatCompareLabel } from '../lib/format';
import { today, toDateString } from '../lib/dates';

export default function CompareSidePanel({ compareRange, onChange, onReset }) {
  const [expanded, setExpanded] = useState(false);
  const maxDate = toDateString(today());

  function handleField(field, value) {
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
              type="date"
              value={compareRange.from}
              onChange={(e) => handleField('from', e.target.value)}
              max={maxDate}
              className="rounded-md border border-black/10 bg-white px-2 py-1 text-xs text-gray-900"
            />
          </label>
          <label className="flex items-center justify-between gap-2 text-xs text-gray-600">
            To
            <input
              type="date"
              value={compareRange.to}
              onChange={(e) => handleField('to', e.target.value)}
              max={maxDate}
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
