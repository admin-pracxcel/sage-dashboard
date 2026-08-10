export default function DeltaChip({ current, previous, compareLabel }) {
  // Both zero — muted placeholder.
  if (previous === 0 && current === 0) {
    return (
      <p className="mt-2 text-xs text-gray-400">— vs {compareLabel}</p>
    );
  }

  // No prior data but current has something — direction-only, no "(new)" label.
  if (previous === 0 && current > 0) {
    return (
      <p className="mt-2 text-xs font-medium text-brand">
        ↑ {current} vs {compareLabel}
      </p>
    );
  }

  const delta = current - previous;
  const pct = Math.round((delta / previous) * 100);
  const arrow = delta > 0 ? '↑' : delta < 0 ? '↓' : '→';
  const pctSign = delta > 0 ? '+' : delta < 0 ? '−' : '';
  const absDelta = Math.abs(delta);
  const absPct = Math.abs(pct);

  let tone;
  if (delta === 0) tone = 'text-gray-400';
  else tone = delta > 0 ? 'text-brand' : 'text-accent-rose';

  return (
    <p className={`mt-2 text-xs font-medium ${tone}`}>
      {arrow} {absDelta} ({pctSign}{absPct}%) vs {compareLabel}
    </p>
  );
}
