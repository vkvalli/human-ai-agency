import {
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function AgencyTrendChart({ data }) {
  return (
    <div className="h-64 min-w-0 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 10, right: 10, left: -18, bottom: 0 }}
        >
          <defs>
            <linearGradient id="agencyTrendFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.28} />
              <stop offset="95%" stopColor="#22d3ee" stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <CartesianGrid
            vertical={false}
            stroke="#e2e8f0"
            strokeDasharray="4 4"
          />
          <XAxis
            dataKey="day"
            tickLine={false}
            axisLine={false}
            tick={{ fill: "#64748b", fontSize: 12 }}
          />
          <YAxis
            domain={[50, 100]}
            tickCount={6}
            tickLine={false}
            axisLine={false}
            tick={{ fill: "#94a3b8", fontSize: 12 }}
          />
          <Tooltip
            cursor={{ stroke: "#67e8f9", strokeOpacity: 0.3 }}
            contentStyle={{
              borderRadius: "16px",
              border: "1px solid #bae6fd",
              boxShadow: "0 10px 25px rgba(14, 165, 233, 0.12)",
            }}
          />
          <Area
            type="monotone"
            dataKey="score"
            stroke="#06b6d4"
            strokeWidth={3}
            fill="url(#agencyTrendFill)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
