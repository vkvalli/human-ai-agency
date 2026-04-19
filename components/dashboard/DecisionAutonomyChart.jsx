import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

const COLORS = ["#22d3ee", "#22c55e", "#3b82f6"];

export default function DecisionAutonomyChart({ data }) {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_11rem] lg:items-center">
      <div className="h-64 min-w-0 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              innerRadius={58}
              outerRadius={90}
              paddingAngle={3}
              cornerRadius={10}
              dataKey="value"
              cy="50%"
            >
              {data.map((entry, index) => (
                <Cell key={entry.name} fill={COLORS[index]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                borderRadius: "16px",
                border: "1px solid #bae6fd",
                boxShadow: "0 10px 25px rgba(14, 165, 233, 0.12)",
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="space-y-3">
        {data.map((item, index) => {
          const share = total === 0 ? 0 : Math.round((item.value / total) * 100);

          return (
            <div
              key={item.name}
              className="rounded-2xl border border-slate-200 bg-slate-50 p-3"
            >
              <div className="flex items-center gap-2">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: COLORS[index] }}
                />
                <p className="text-sm font-medium text-slate-700">{item.name}</p>
              </div>
              <p className="mt-2 text-lg font-semibold text-slate-900">
                {item.value}%
              </p>
              <p className="text-xs text-slate-500">{share}% of total decisions</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
