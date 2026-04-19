import SectionHeader from "../common/SectionHeader";
import Card from "../common/Card";

function sourceStyles(source) {
  if (source === "Autonomous") {
    return "bg-emerald-100 text-emerald-700";
  }

  if (source === "AI-led") {
    return "bg-amber-100 text-amber-700";
  }

  if (source === "Mixed") {
    return "bg-sky-100 text-sky-700";
  }

  return "bg-slate-100 text-slate-700";
}

export default function DecisionTable({ rows }) {
  return (
    <Card className="relative overflow-hidden border-cyan-100/80 bg-[linear-gradient(170deg,rgba(240,250,255,0.92),rgba(206,237,255,0.84)_55%,rgba(186,228,252,0.8)_100%)] p-6 shadow-[0_22px_54px_rgba(3,54,89,0.16)] sm:p-7">
      <div className="absolute inset-x-0 top-0 h-24 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.72),rgba(186,230,253,0.48)_42%,transparent_78%)]" />
      <div className="absolute right-8 top-6 h-16 w-16 rounded-full border border-white/60 bg-white/20 blur-2xl" />
      <SectionHeader
        title="Decision Information Table"
        description="A structured view of how decisions were made and reviewed."
      />

      {!rows || rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-sky-100 bg-white/68 p-6 text-sm text-slate-600 backdrop-blur-lg">
          No tracked decision events yet. Use the simulator to generate activity.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-[1.5rem] border border-sky-100/90 bg-[linear-gradient(180deg,rgba(255,255,255,0.9),rgba(240,249,255,0.84))] shadow-inner shadow-cyan-100/50">
          <table className="min-w-full text-left">
            <thead>
              <tr className="border-b border-sky-100 bg-white/78 text-sm text-slate-600 backdrop-blur-lg">
                <th className="px-4 py-3.5 font-medium">Task</th>
                <th className="px-4 py-3.5 font-medium">Source</th>
                <th className="px-4 py-3.5 font-medium">Confidence</th>
                <th className="px-4 py-3.5 font-medium">Intent Match</th>
                <th className="px-4 py-3.5 font-medium">Revision Depth</th>
                <th className="px-4 py-3.5 font-medium">Time</th>
              </tr>
            </thead>

            <tbody>
              {rows.map((row, index) => (
                <tr
                  key={index}
                  className="border-b border-sky-100/70 text-sm text-slate-700 last:border-b-0 odd:bg-white/44 even:bg-cyan-50/44"
                >
                  <td className="px-4 py-4 font-medium text-slate-950">
                    {row.task}
                  </td>
                  <td className="px-4 py-4">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${sourceStyles(row.source)}`}
                    >
                      {row.source}
                    </span>
                  </td>
                  <td className="px-4 py-4">{row.confidence}</td>
                  <td className="px-4 py-4">{row.intentMatch}</td>
                  <td className="px-4 py-4">{row.revisionDepth}</td>
                  <td className="px-4 py-4 whitespace-nowrap">{row.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
