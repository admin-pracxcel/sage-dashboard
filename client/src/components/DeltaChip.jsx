export default function DeltaChip({ current, previous, compareLabel, hideCompareLabel = false }) {
  let tone;
  let text;

  if (previous === 0 && current === 0) {
    tone = 'text-gray-400';
    text = hideCompareLabel ? '—' : `— vs ${compareLabel}`;
  } else if (previous === 0 && current > 0) {
    tone = 'text-[#00a700]';
    text = `↑ ${current}${hideCompareLabel ? '' : ` vs ${compareLabel}`}`;
  } else {
    const delta = current - previous;
    const pct = Math.round((delta / previous) * 100);
    const arrow = delta > 0 ? '↑' : delta < 0 ? '↓' : '→';
    const pctSign = delta > 0 ? '+' : delta < 0 ? '−' : '';
    tone = delta === 0 ? 'text-gray-400' : delta > 0 ? 'text-[#00a700]' : 'text-accent-rose';
    text = `${arrow} ${Math.abs(delta)} (${pctSign}${Math.abs(pct)}%)${hideCompareLabel ? '' : ` vs ${compareLabel}`}`;
  }

  if (hideCompareLabel) {
    return <span className={`text-xs font-medium ${tone}`}>{text}</span>;
  }
  return <p className={`mt-2 text-xs font-medium ${tone}`}>{text}</p>;
}
