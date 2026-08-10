import AnimatedNumber from './AnimatedNumber';

export default function StatCard({ label, value, sublabel, accent = 'brand', buttonLabel, onButtonClick, deltaChip }) {
  const styles = {
    brand: {
      dot: 'bg-brand',
    },
    rose: {
      dot: 'bg-red-400',
    },
  };

  const s = styles[accent] || styles.brand;

  return (
    <div className="flex h-full flex-col rounded-2xl bg-gray-900 p-6 transition-all duration-300 hover:-translate-y-1">
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-0.5 text-xs font-semibold text-white/80">
          <span className={`h-1.5 w-1.5 rounded-full ${s.dot} animate-pulse-soft`} />
          {label}
        </span>
      </div>
      <p className="mt-4 font-display text-5xl text-white">
        <AnimatedNumber value={value} />
      </p>
      {deltaChip && (
        <div className="[&>p]:!text-white/70 [&>p.text-brand]:!text-emerald-300 [&>p.text-accent-rose]:!text-rose-300">
          {deltaChip}
        </div>
      )}
      {sublabel && (
        <p className="mt-2 text-xs text-white/50">{sublabel}</p>
      )}
      {buttonLabel && onButtonClick && (
        <button
          onClick={onButtonClick}
          className="mt-4 flex items-center gap-1.5 rounded-lg bg-white/10 px-3.5 py-2 text-xs font-semibold text-white/80 transition-all hover:bg-white/20 hover:text-white"
        >
          {buttonLabel}
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
          </svg>
        </button>
      )}
    </div>
  );
}
