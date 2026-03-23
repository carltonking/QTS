import {
  CartesianGrid,
  Line,
  LineChart as RechartsLineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

type Point = {
  x: string | number;
  y: number;
};

type LineChartProps = {
  data: Point[];
  xLabel?: string;
  yLabel?: string;
};

export function LineChart({ data, xLabel, yLabel }: LineChartProps) {
  return (
    <div
      style={{
        width: '100%',
        height: 280,
        border: '1px solid var(--border)',
        background: 'var(--bg)',
        padding: '0.75rem',
      }}
    >
      <ResponsiveContainer width="100%" height="100%">
        <RechartsLineChart data={data}>
          <CartesianGrid stroke="var(--border)" vertical={false} />
          <XAxis
            dataKey="x"
            stroke="var(--text-1)"
            tick={{ fill: 'var(--text-1)', fontFamily: 'var(--font-mono)', fontSize: 12 }}
            label={
              xLabel
                ? {
                    value: xLabel,
                    position: 'insideBottom',
                    offset: -4,
                    fill: 'var(--text-1)',
                  }
                : undefined
            }
          />
          <YAxis
            stroke="var(--text-1)"
            tick={{ fill: 'var(--text-1)', fontFamily: 'var(--font-mono)', fontSize: 12 }}
            label={
              yLabel
                ? {
                    value: yLabel,
                    angle: -90,
                    position: 'insideLeft',
                    fill: 'var(--text-1)',
                  }
                : undefined
            }
          />
          <Tooltip
            contentStyle={{
              background: 'var(--bg)',
              border: '1px solid var(--text-1)',
              borderRadius: 0,
              color: 'var(--text-1)',
              fontFamily: 'var(--font-mono)',
            }}
            labelStyle={{ color: 'var(--text-1)' }}
          />
          <Line
            type="monotone"
            dataKey="y"
            stroke="var(--text-1)"
            strokeWidth={2}
            dot={
              data.length === 1 ? { r: 4, fill: 'var(--text-1)', stroke: 'var(--bg)' } : false
            }
            activeDot={{ r: 4, fill: 'var(--text-1)', stroke: 'var(--bg)' }}
          />
        </RechartsLineChart>
      </ResponsiveContainer>
    </div>
  );
}
