import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
  } from "recharts";
  
  export default function AgencyTrendChart({ data }) {
    return (
      <div className="h-64 w-full">
        <ResponsiveContainer>
          <AreaChart data={data}>
            <XAxis dataKey="day" />
            <YAxis domain={[50, 100]} />
            <Tooltip />
            <Area
              type="monotone"
              dataKey="score"
              stroke="#22d3ee"
              fill="#22d3ee"
              fillOpacity={0.2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    );
  }