import { LineChart, Line, XAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export default function SectionCompareChart({
  mainSeries,
  compareSeries,
  mainLabel,
  compareLabel,
  mainColor,
  compareColor,
}) {
  const length = Math.min(mainSeries.length, compareSeries.length);
  if (length === 0) return null;

  const data = Array.from({ length }, (_, i) => ({
    day: i + 1,
    main: mainSeries[i]?.count ?? 0,
    compare: compareSeries[i]?.count ?? 0,
  }));

  function TooltipContent({ active, payload, label }) {
    if (!active || !payload || payload.length === 0) return null;
    const main = payload.find((p) => p.dataKey === 'main')?.value ?? 0;
    const compare = payload.find((p) => p.dataKey === 'compare')?.value ?? 0;
    const delta = main - compare;
    const pct = compare === 0 ? null : Math.round((delta / compare) * 100);
    const arrow = delta > 0 ? '▲' : delta < 0 ? '▼' : '→';
    const sign = delta > 0 ? '+' : delta < 0 ? '−' : '';
    const deltaColor =
      delta > 0 ? '#059669' : delta < 0 ? '#DC2626' : 'rgba(0,0,0,0.5)';

    return (
      <div
        style={{
          background: '#FFFFFF',
          border: '1px solid rgba(0,0,0,0.08)',
          borderRadius: 8,
          padding: '8px 10px',
          fontSize: 12,
          color: '#111827',
          minWidth: 140,
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
        }}
      >
        <div style={{ color: 'rgba(0,0,0,0.5)', fontSize: 11, marginBottom: 4 }}>
          Day {label}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
          <span style={{ color: mainColor }}>{mainLabel}</span>
          <span>{main}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, opacity: 0.85 }}>
          <span style={{ color: compareColor }}>{compareLabel}</span>
          <span>{compare}</span>
        </div>
        <div style={{ color: deltaColor, marginTop: 4, fontWeight: 500 }}>
          {arrow} {sign}
          {Math.abs(delta)}
          {pct !== null && ` (${sign}${Math.abs(pct)}%)`}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 12, left: 4, bottom: 4 }}>
          <XAxis
            dataKey="day"
            tick={{ fontSize: 10, fill: '#9CA3AF' }}
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
          />
          <Tooltip
            cursor={{ stroke: 'rgba(0,0,0,0.15)', strokeWidth: 1 }}
            content={<TooltipContent />}
          />
          <Legend
            wrapperStyle={{ fontSize: 11, color: '#4B5563' }}
            formatter={(name) => (name === 'main' ? mainLabel : compareLabel)}
            iconSize={8}
          />
          {/* Compare rendered first (dashed, lighter) so main solid line paints on top */}
          <Line
            type="monotone"
            dataKey="compare"
            stroke={compareColor}
            strokeWidth={1.75}
            strokeDasharray="4 3"
            strokeOpacity={0.75}
            dot={false}
            isAnimationActive={false}
          />
          <Line
            type="monotone"
            dataKey="main"
            stroke={mainColor}
            strokeWidth={2.25}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
