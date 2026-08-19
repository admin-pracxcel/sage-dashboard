import AnimatedNumber from './AnimatedNumber';

export default function ChannelCard({ label, count, missedCount, buttonLabel, onButtonClick, icon, accentClass, deltaChip }) {
  return (
    <div className="card group p-5 transition-all duration-300 hover:-translate-y-0.5">
      <div>
        <div className="flex items-center gap-2">
          {icon && <span className="text-base">{icon}</span>}
          <p className="text-sm font-medium text-gray-400">{label}</p>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <p className={`font-display text-4xl ${accentClass || 'text-gray-900'}`}>
            <AnimatedNumber value={count} />
          </p>
          {missedCount != null && (
            <>
              <span className="text-2xl font-light text-gray-300">/</span>
              <span
                title={`${missedCount} Missed Opportunity`}
                className="inline-flex items-baseline gap-1 rounded-lg bg-red-100 px-2.5 py-0.5 text-sm font-semibold text-red-700"
              >
                {missedCount}
                <span className="text-[10px] font-medium uppercase tracking-wide text-red-600">Missed Opportunity</span>
              </span>
            </>
          )}
        </div>
        {deltaChip}
      </div>
      <button
        onClick={onButtonClick}
        className="mt-4 flex items-center gap-1.5 rounded-lg border border-surface-border bg-white px-3.5 py-2 text-xs font-semibold text-gray-700 transition-all hover:border-brand/40 hover:text-brand"
      >
        {buttonLabel}
        <svg className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
        </svg>
      </button>
    </div>
  );
}
