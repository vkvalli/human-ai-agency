import SectionHeader from "../common/SectionHeader";
import Card from "../common/Card";

export default function DecisionTable({ rows }) {
  return (
    <Card>
      <SectionHeader
        title="Decision Information Table"
        description="A structured view of how decisions were made and reviewed."
      />

      {!rows || rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">
          No tracked decision events yet. Use the simulator to generate activity.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-left">
            <thead>
              <tr className="border-b border-slate-200 text-sm text-slate-500">
                <th className="px-3 py-3 font-medium">Task</th>
                <th className="px-3 py-3 font-medium">Source</th>
                <th className="px-3 py-3 font-medium">Confidence</th>
                <th className="px-3 py-3 font-medium">Intent Match</th>
                <th className="px-3 py-3 font-medium">Revision Depth</th>
                <th className="px-3 py-3 font-medium">Time</th>
              </tr>
            </thead>

            <tbody>
              {rows.map((row, index) => (
                <tr
                  key={index}
                  className="border-b border-slate-100 text-sm text-slate-700 last:border-b-0"
                >
                  <td className="px-3 py-4 font-medium text-slate-900">{row.task}</td>
                  <td className="px-3 py-4">{row.source}</td>
                  <td className="px-3 py-4">{row.confidence}</td>
                  <td className="px-3 py-4">{row.intentMatch}</td>
                  <td className="px-3 py-4">{row.revisionDepth}</td>
                  <td className="px-3 py-4">{row.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}