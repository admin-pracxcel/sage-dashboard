import AnimatedNumber from './AnimatedNumber';

export default function ChannelCard({ label, count, buttonLabel, onButtonClick, icon, accentClass }) {
  return (
    <div className="card group p-5 transition-all duration-300 hover:-translate-y-0.5">
      <div>
        <div className="flex items-center gap-2">
          {icon && <span className="text-base">{icon}</span>}
          <p className="text-sm font-medium text-gray-400">{label}</p>
        </div>
        <p className={`mt-2 font-display text-4xl ${accentClass || 'text-gray-900'}`}>
          <AnimatedNumber value={count} />
        </p>
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
