import { useTracking } from "../../src/context/TrackingContext";

export default function TrackingSimulator() {
  const { addEvent, clearEvents, metrics } = useTracking();

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_10px_35px_rgba(15,23,42,0.08)]">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">Simulation Controls</p>
          <h3 className="mt-1 text-xl font-bold text-slate-900">
            Browser Activity Simulator
          </h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Simulate the same signals your browser extension would later send.
          </p>
        </div>

        <button
          onClick={clearEvents}
          className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          Reset Events
        </button>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <button
          onClick={() =>
            addEvent({
              type: "ai_accept",
              app: "ChatGPT",
              page: "rewrite-request",
              confidence: 2,
              intentMatch: "not_sure",
              revisionDepth: "low",
            })
          }
          className="rounded-2xl bg-amber-100 px-4 py-4 text-left font-semibold text-amber-800 hover:bg-amber-200"
        >
          + AI Accept
        </button>

        <button
          onClick={() =>
            addEvent({
              type: "manual_edit",
              app: "Google Docs",
              page: "project-report",
              confidence: 5,
              intentMatch: "yes",
              revisionDepth: "high",
            })
          }
          className="rounded-2xl bg-emerald-100 px-4 py-4 text-left font-semibold text-emerald-800 hover:bg-emerald-200"
        >
          + Manual Edit
        </button>

        <button
          onClick={() =>
            addEvent({
              type: "tab_switch",
              app: "Chrome",
              page: "multiple-tabs",
            })
          }
          className="rounded-2xl bg-sky-100 px-4 py-4 text-left font-semibold text-sky-800 hover:bg-sky-200"
        >
          + Tab Switch
        </button>

        <button
          onClick={() =>
            addEvent({
              type: "deadline_trigger",
              app: "Calendar",
              page: "submission-deadline",
            })
          }
          className="rounded-2xl bg-rose-100 px-4 py-4 text-left font-semibold text-rose-800 hover:bg-rose-200"
        >
          + Deadline Trigger
        </button>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Metric label="Agency Score" value={metrics.score} />
        <Metric label="Autonomous %" value={metrics.autonomous} />
        <Metric label="AI-led %" value={metrics.aiLed} />
        <Metric label="Tab Switches" value={metrics.tabSwitches} />
      </div>
    </div>
  );
}

function Metric({ label, value }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4">
      <p className="text-sm text-slate-500">{label}</p>
      <h4 className="mt-2 text-2xl font-bold text-slate-900">{value}</h4>
    </div>
  );
}