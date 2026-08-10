import { LineChart, Line, XAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export default function SectionCompareChart({
  mainSeries,
  compareSeries,
  mainLabel,
  compareLabel,
  accentColor,
}) {
  // Truncate to overlap length so both lines cover the same x-range.
  const length = Math.min(mainSeries.length, compareSeries.length);
  if (length === 0) return null;

  const data = Array.from({ length }, (_, i) => ({
    day: i + 1,
    main: mainSeries[i]?.count ?? 0,
    compare: compareSeries[i]?.count ?? 0,
  }));

  return (
    <div className="mb-5 h-32 w-full rounded-xl border border-surface-border bg-surface-card p-3">
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
            contentStyle={{
              fontSize: 12,
              borderRadius: 8,
              border: '1px solid #E8E5E0',
              backgroundColor: '#FFFFFF',
            }}
            labelFormatter={(day) => `Day ${day}`}
            formatter={(value, name) => [value, name === 'main' ? mainLabel : compareLabel]}
          />
          <Legend
            wrapperStyle={{ fontSize: 11 }}
            formatter={(name) => (name === 'main' ? mainLabel : compareLabel)}
            iconSize={8}
          />
          <Line
            type="monotone"
            dataKey="compare"
            stroke={accentColor}
            strokeOpacity={0.25}
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
          <Line
            type="monotone"
            dataKey="main"
            stroke={accentColor}
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
