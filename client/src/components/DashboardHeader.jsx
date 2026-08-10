import { formatTimestamp } from '../lib/format';
import CompareRangePill from './CompareRangePill';

export default function DashboardHeader({ fetchedAt, isRefreshing, onRefresh, compareRange, onCompareChange, onCompareReset }) {
  return (
    <header className="mb-10 animate-fade-in">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand">
            IntelliLens
          </p>
          <h1 className="mt-1 font-display text-4xl md:text-5xl" style={{ color: '#2e3e33' }}>
            Sage Psychological Services
          </h1>
          <p className="mt-2 text-sm text-gray-400">
            Performance Dashboard
          </p>
        </div>
        <div className="flex items-center gap-4">
          <CompareRangePill
            compareRange={compareRange}
            onChange={onCompareChange}
            onReset={onCompareReset}
          />
          {fetchedAt && (
            <p className="text-xs text-gray-400">
              Updated {formatTimestamp(fetchedAt)}
            </p>
          )}
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="group relative overflow-hidden rounded-xl border border-surface-border bg-surface-card px-5 py-2.5 text-sm font-medium text-gray-600 transition-all hover:border-brand/40 hover:text-brand disabled:opacity-50"
          >
            <span className="relative z-10 flex items-center gap-2">
              <svg
                className={`h-4 w-4 ${isRefreshing ? 'animate-spin-slow' : 'transition-transform group-hover:rotate-180'}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {isRefreshing ? 'Syncing...' : 'Refresh'}
            </span>
            <span className="absolute inset-0 -z-0 bg-gradient-to-r from-brand/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
          </button>
        </div>
      </div>
      <div className="mt-6 h-px bg-gradient-to-r from-brand/30 via-surface-border to-transparent" />
    </header>
  );
}
