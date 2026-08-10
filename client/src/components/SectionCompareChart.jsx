import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export default function SectionCompareChart({
  mainSeries,
  compareSeries,
  mainLabel,
  compareLabel,
  accentColor,
}) {
  // Truncate to overlap length so both bars cover the same x-range.
  const length = Math.min(mainSeries.length, compareSeries.length);
  if (length === 0) return null;

  const data = Array.from({ length }, (_, i) => ({
    day: i + 1,
    main: mainSeries[i]?.count ?? 0,
    compare: compareSeries[i]?.count ?? 0,
  }));

  return (
    <div className="mb-5 h-40 w-full rounded-xl p-3">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 12, left: 4, bottom: 4 }}>
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
          <Bar
            dataKey="main"
            fill={accentColor}
            fillOpacity={1}
            radius={[2, 2, 0, 0]}
            isAnimationActive={false}
          />
          <Bar
            dataKey="compare"
            fill={accentColor}
            fillOpacity={0.3}
            radius={[2, 2, 0, 0]}
            isAnimationActive={false}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
