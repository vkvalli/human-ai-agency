import { useMemo, useState } from "react";
import Card from "../common/Card";
import SectionHeader from "../common/SectionHeader";
import {
  endDashboardSession,
  getActiveDashboardSession,
  startDashboardSession,
} from "../../src/utils/extensionSessionBridge";

function StatusBadge({ status }) {
  const styles = {
    "In Progress": "bg-amber-100 text-amber-700",
    Planned: "bg-sky-100 text-sky-700",
    "Needs Review": "bg-rose-100 text-rose-700",
    Ongoing: "bg-emerald-100 text-emerald-700",
  };

  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-semibold ${
        styles[status] || "bg-slate-100 text-slate-700"
      }`}
    >
      {status}
    </span>
  );
}

function buildWorkflowTitle(tasks) {
  const titles = tasks.map((task) => task.title);

  if (titles.includes("Recovery Planning Session")) {
    return "Recovery-focused workflow";
  }

  if (titles.includes("Manual-First Draft Plan")) {
    return "Manual-first workflow";
  }

  if (titles.includes("Add Pre-Submit Review Checkpoint")) {
    return "Deadline-aware workflow";
  }

  if (titles.includes("Focus Block Setup")) {
    return "Focus-preserving workflow";
  }

  return "Adaptive workflow guidance";
}

function buildImportedScheduleItems(tasks) {
  const items = [];

  const titles = tasks.map((task) => task.title);

  if (titles.includes("Recovery Planning Session")) {
    items.push({
      id: `import-${Date.now()}-1`,
      title: "Recovery reflection checkpoint",
      datetime: "Today · 5:30 PM",
      type: "Recovery",
    });
  }

  if (titles.includes("Add Pre-Submit Review Checkpoint")) {
    items.push({
      id: `import-${Date.now()}-2`,
      title: "Pre-submit manual review",
      datetime: "Before final submission",
      type: "Review",
    });
  }

  if (titles.includes("Focus Block Setup")) {
    items.push({
      id: `import-${Date.now()}-3`,
      title: "Focused work block",
      datetime: "Tomorrow · 10:00 AM",
      type: "Focus",
    });
  }

  if (titles.includes("Manual-First Draft Plan")) {
    items.push({
      id: `import-${Date.now()}-4`,
      title: "Manual-first draft session",
      datetime: "Next creative task",
      type: "Drafting",
    });
  }

  if (items.length === 0) {
    items.push({
      id: `import-${Date.now()}-default`,
      title: "General planning checkpoint",
      datetime: "This week",
      type: "Planning",
    });
  }

  return items;
}

export default function PlanModePanel({ tasks, tips, agencyGoalTarget = 70 }) {
  const initialSession = getActiveDashboardSession();
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [scheduleItems, setScheduleItems] = useState([]);
  const [importedIntentMap, setImportedIntentMap] = useState(false);
  const [activeSession, setActiveSession] = useState(
    initialSession && initialSession.sessionId ? initialSession : null
  );
  const [sessionAction, setSessionAction] = useState("");
  const [sessionStatus, setSessionStatus] = useState(
    initialSession && initialSession.sessionId
      ? `Session active (${String(initialSession.sessionId).slice(0, 8)}...)`
      : "No active extension bridge session."
  );

  const [scheduleTitle, setScheduleTitle] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");
  const [scheduleType, setScheduleType] = useState("Planning");

  const workflowTitle = useMemo(() => buildWorkflowTitle(tasks), [tasks]);

  const derivedIntentText = useMemo(() => {
    const firstTip = tips && tips.length ? tips[0] : "";
    return `${workflowTitle}. ${firstTip}`.trim();
  }, [tips, workflowTitle]);

  const derivedDeadlineActive = useMemo(
    () =>
      tasks.some(
        (task) =>
          task.title.toLowerCase().includes("deadline") ||
          task.due.toLowerCase().includes("deadline")
      ),
    [tasks]
  );

  function handleAddSchedule() {
    if (!scheduleTitle.trim() || !scheduleTime.trim()) {
      return;
    }

    const newItem = {
      id: Date.now(),
      title: scheduleTitle.trim(),
      datetime: scheduleTime.trim(),
      type: scheduleType,
    };

    setScheduleItems((prev) => [...prev, newItem]);
    setScheduleTitle("");
    setScheduleTime("");
    setScheduleType("Planning");
    setShowScheduleForm(false);
  }

  function handleImportIntentMap() {
    const importedItems = buildImportedScheduleItems(tasks);

    setScheduleItems((prev) => {
      const existingTitles = new Set(prev.map((item) => item.title));
      const filtered = importedItems.filter(
        (item) => !existingTitles.has(item.title)
      );
      return [...prev, ...filtered];
    });

    setImportedIntentMap(true);
  }

  async function handleStartSession() {
    if (sessionAction || activeSession) return;
    setSessionAction("start");
    setSessionStatus("Starting backend session...");

    try {
      const session = await startDashboardSession({
        intentText: derivedIntentText,
        agencyGoal: agencyGoalTarget,
        taskType: "study",
        deadlineActive: derivedDeadlineActive,
      });
      setActiveSession(session);
      setSessionStatus(
        `Session started (${String(session.sessionId).slice(0, 8)}...) via ${session.source}.`
      );
    } catch {
      setSessionStatus("Could not start a session.");
    } finally {
      setSessionAction("");
    }
  }

  function handleEndSession() {
    if (sessionAction || !activeSession) return;
    setSessionAction("end");

    const ended = endDashboardSession(activeSession);
    setActiveSession(null);
    if (ended) {
      setSessionStatus(`Session ended (${String(ended.sessionId).slice(0, 8)}...).`);
    } else {
      setSessionStatus("No session to end.");
    }
    setSessionAction("");
  }

  return (
    <Card id="plan-mode-panel">
      <SectionHeader
        title="Plan Mode"
        description="Plan specific projects, add scheduling, and adapt execution guidance from live agency behavior."
      />

      {importedIntentMap && (
        <div className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
          Intent Map imported into Plan Mode. Recommended checkpoints have been added to the schedule.
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-4">
          {tasks.map((task) => (
            <div
              key={task.title}
              className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4"
            >
              <div>
                <h3 className="text-lg font-semibold text-slate-900">
                  {task.title}
                </h3>
                <p className="mt-1 text-sm text-slate-500">{task.due}</p>
              </div>

              <StatusBadge status={task.status} />
            </div>
          ))}

          <div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-indigo-700">
                  Schedule Planner
                </p>
                <h4 className="mt-1 text-lg font-semibold text-slate-900">
                  Planned checkpoints
                </h4>
              </div>

              <button
                onClick={() => setShowScheduleForm((prev) => !prev)}
                className="rounded-full border border-indigo-200 bg-white px-4 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-50"
              >
                {showScheduleForm ? "Cancel" : "Add Schedule"}
              </button>
            </div>

            {showScheduleForm && (
              <div className="mt-4 rounded-2xl bg-white p-4 shadow-sm">
                <div className="grid gap-3">
                  <input
                    type="text"
                    placeholder="Schedule title"
                    value={scheduleTitle}
                    onChange={(e) => setScheduleTitle(e.target.value)}
                    className="rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-indigo-400"
                  />

                  <input
                    type="text"
                    placeholder="When? e.g. Today · 6:00 PM"
                    value={scheduleTime}
                    onChange={(e) => setScheduleTime(e.target.value)}
                    className="rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-indigo-400"
                  />

                  <select
                    value={scheduleType}
                    onChange={(e) => setScheduleType(e.target.value)}
                    className="rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-indigo-400"
                  >
                    <option>Planning</option>
                    <option>Review</option>
                    <option>Focus</option>
                    <option>Recovery</option>
                    <option>Drafting</option>
                  </select>

                  <button
                    onClick={handleAddSchedule}
                    className="rounded-full bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700"
                  >
                    Save Schedule
                  </button>
                </div>
              </div>
            )}

            <div className="mt-4 space-y-3">
              {scheduleItems.length === 0 ? (
                <div className="rounded-xl border border-dashed border-indigo-200 bg-white p-4 text-sm text-slate-500">
                  No schedule items yet. Add one manually or import recommendations from the Intent Map.
                </div>
              ) : (
                scheduleItems.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-xl bg-white p-3 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium text-slate-900">{item.title}</p>
                        <p className="mt-1 text-sm text-slate-500">
                          {item.datetime}
                        </p>
                      </div>

                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                        {item.type}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5">
          <p className="text-sm font-medium text-slate-500">Planning tips</p>
          <h3 className="mt-2 text-2xl font-bold text-slate-900">
            {workflowTitle}
          </h3>

          <ul className="mt-5 space-y-3 text-sm leading-6 text-slate-600">
            {tips.map((tip) => (
              <li
                key={tip}
                className="rounded-2xl bg-slate-50 px-4 py-3"
              >
                {tip}
              </li>
            ))}
          </ul>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              onClick={handleImportIntentMap}
              className="rounded-full bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700"
            >
              Import Intent Map
            </button>

            <button
              onClick={() => setShowScheduleForm(true)}
              className="rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Add Schedule
            </button>

            <button
              onClick={handleStartSession}
              disabled={Boolean(sessionAction || activeSession)}
              className="rounded-full border border-emerald-200 bg-emerald-50 px-5 py-2.5 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {sessionAction === "start" ? "Starting..." : "Start session"}
            </button>

            <button
              onClick={handleEndSession}
              disabled={Boolean(sessionAction || !activeSession)}
              className="rounded-full border border-rose-200 bg-rose-50 px-5 py-2.5 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {sessionAction === "end" ? "Ending..." : "End session"}
            </button>
          </div>

          <p className="mt-4 text-xs font-medium text-slate-600">{sessionStatus}</p>
        </div>
      </div>
    </Card>
  );
}
