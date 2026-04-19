import { useTracking } from "../../src/context/TrackingContext";

const simulatorActions = [
  {
    title: "+ AI Accept",
    description: "Capture a quick AI-led approval with minimal review.",
    className: "border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100",
    buildEvent: () => ({
      type: "ai_accept",
      app: "ChatGPT",
      page: "rewrite-request",
      confidence: 2,
      intentMatch: "not_sure",
      revisionDepth: "low",
    }),
  },
  {
    title: "+ Manual Edit",
    description: "Record a human revision pass before finalizing the work.",
    className:
      "border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100",
    buildEvent: () => ({
      type: "manual_edit",
      app: "Google Docs",
      page: "project-report",
      confidence: 5,
      intentMatch: "yes",
      revisionDepth: "high",
    }),
  },
  {
    title: "+ Tab Switch",
    description: "Track a context switch that may fragment decision focus.",
    className: "border-sky-200 bg-sky-50 text-sky-800 hover:bg-sky-100",
    buildEvent: () => ({
      type: "tab_switch",
      app: "Chrome",
      page: "multiple-tabs",
    }),
  },
  {
    title: "+ Deadline Trigger",
    description: "Simulate a pressure-heavy moment near a final action.",
    className: "border-rose-200 bg-rose-50 text-rose-800 hover:bg-rose-100",
    buildEvent: () => ({
      type: "deadline_trigger",
      app: "Calendar",
      page: "submission-deadline",
    }),
  },
];

export default function TrackingSimulator() {
  const { addEvent, clearEvents, metrics } = useTracking();

  return (
    <div className="rounded-3xl border border-sky-100/80 bg-white/90 p-5 shadow-[0_18px_44px_rgba(4,42,74,0.16)] backdrop-blur-xl sm:p-6">
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
          className="rounded-full border border-sky-100 bg-white/70 px-4 py-2 text-sm font-semibold text-slate-700 backdrop-blur-lg hover:bg-white"
        >
          Reset Events
        </button>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {simulatorActions.map((action) => (
          <button
            key={action.title}
            onClick={() => addEvent(action.buildEvent())}
            className={`rounded-[1.35rem] border px-4 py-4 text-left transition ${action.className}`}
          >
            <p className="text-sm font-semibold">{action.title}</p>
            <p className="mt-1 text-xs leading-5 opacity-80">
              {action.description}
            </p>
          </button>
        ))}
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
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
    <div className="rounded-[1.35rem] border border-sky-100 bg-white/72 p-4 backdrop-blur-lg">
      <p className="text-sm text-slate-500">{label}</p>
      <h4 className="mt-2 text-2xl font-bold text-slate-900">{value}</h4>
    </div>
  );
}
