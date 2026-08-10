import { formatCompareLabel } from '../lib/format';
import { today, toDateString } from '../lib/dates';

export default function CompareSidePanel({ compareRange, onChange, onReset }) {
  const maxDate = toDateString(today());

  function handleField(field, value) {
    let from = field === 'from' ? value : compareRange.from;
    let to = field === 'to' ? value : compareRange.to;
    if (to < from) [from, to] = [to, from];
    onChange({ from, to });
  }

  return (
    <div className="card p-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
        Compared with
      </p>
      <p className="mt-1 text-lg font-medium text-brand">
        {formatCompareLabel(compareRange)}
      </p>
      <div className="mt-3 flex flex-col gap-2">
        <label className="flex items-center justify-between gap-2 text-xs text-gray-500">
          From
          <input
            type="date"
            value={compareRange.from}
            onChange={(e) => handleField('from', e.target.value)}
            max={maxDate}
          />
        </label>
        <label className="flex items-center justify-between gap-2 text-xs text-gray-500">
          To
          <input
            type="date"
            value={compareRange.to}
            onChange={(e) => handleField('to', e.target.value)}
            max={maxDate}
          />
        </label>
      </div>
      <button
        onClick={onReset}
        className="mt-3 text-xs font-medium text-brand hover:underline"
      >
        Reset to previous period
      </button>
    </div>
  );
}
