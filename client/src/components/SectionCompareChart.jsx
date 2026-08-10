import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export default function SectionCompareChart({
  mainSeries,
  compareSeries,
  mainLabel,
  compareLabel,
  mainColor,
  compareColor,
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
    <div className="h-full w-full">
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
            cursor={{ fill: 'rgba(255,255,255,0.05)' }}
            contentStyle={{
              fontSize: 12,
              borderRadius: 8,
              border: '1px solid rgba(255,255,255,0.15)',
              backgroundColor: 'rgba(19, 26, 21, 0.95)',
              color: '#FFFFFF',
              padding: '8px 10px',
            }}
            labelStyle={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, marginBottom: 4 }}
            itemStyle={{ color: '#FFFFFF' }}
            labelFormatter={(day) => `Day ${day}`}
            formatter={(value, name) => [value, name === 'main' ? mainLabel : compareLabel]}
          />
          <Legend
            wrapperStyle={{ fontSize: 11, color: 'rgba(255,255,255,0.8)' }}
            formatter={(name) => (name === 'main' ? mainLabel : compareLabel)}
            iconSize={8}
          />
          <Bar
            dataKey="main"
            fill={mainColor}
            fillOpacity={1}
            radius={[2, 2, 0, 0]}
            isAnimationActive={false}
          />
          <Bar
            dataKey="compare"
            fill={compareColor}
            fillOpacity={1}
            radius={[2, 2, 0, 0]}
            isAnimationActive={false}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
