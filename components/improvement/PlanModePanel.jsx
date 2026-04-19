import { useState } from "react";
import Card from "../common/Card";
import SectionHeader from "../common/SectionHeader";
import {
  endDashboardSession,
  getActiveDashboardSession,
  startDashboardSession,
} from "../../src/utils/extensionSessionBridge";

function FieldCard({
  label,
  children,
  className = "",
}) {
  return (
    <label
      className={`block rounded-[1rem] border border-slate-200 bg-white p-2.5 shadow-sm shadow-cyan-100/40 sm:p-3 ${className}`}
    >
      <div className="mb-1.5">
        <span className="text-xs font-semibold text-slate-900">{label}</span>
      </div>
      {children}
    </label>
  );
}

const fieldClassName =
  "min-h-[58px] w-full resize-none rounded-[0.75rem] border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs leading-5 text-slate-700 outline-none transition focus:border-cyan-400 focus:bg-white";

const emptyPlan = {
  intent: "",
  mustKeepPoints: "",
  scope: "",
  deadline: "",
  aiScope: "",
};

export default function PlanModePanel({ plan, agencyGoalTarget = 70 }) {
  const storedSession = getActiveDashboardSession();
  const initialSession =
    storedSession && storedSession.sessionId ? storedSession : null;

  const [form, setForm] = useState(emptyPlan);
  const [activeSession, setActiveSession] = useState(initialSession);
  const [statusText, setStatusText] = useState(
    initialSession
      ? `Session active (${String(initialSession.sessionId).slice(0, 8)}...)`
      : "No active bridge session."
  );
  const [pendingAction, setPendingAction] = useState("");

  function updateField(key, value) {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  }

  function resetToSuggestedPlan() {
    setForm(plan);
  }

  function clearPlan() {
    setForm(emptyPlan);
  }

  async function startSession() {
    if (pendingAction) return;
    setPendingAction("start");
    setStatusText("Starting session bridge...");

    try {
      const session = await startDashboardSession({
        intentText: form.intent || plan.intent || "",
        agencyGoal: Number(agencyGoalTarget || 70),
        taskType: "study",
        deadlineActive: Boolean((form.deadline || "").trim()),
      });
      setActiveSession(session);
      setStatusText(
        `Session started (${String(session.sessionId).slice(0, 8)}...) via ${session.source}.`
      );
    } catch {
      setStatusText("Could not start a session bridge.");
    } finally {
      setPendingAction("");
    }
  }

  function endSession() {
    if (pendingAction || !activeSession) return;
    setPendingAction("end");
    const closedSession = endDashboardSession(activeSession);
    if (closedSession) {
      setStatusText(`Session ended (${String(closedSession.sessionId).slice(0, 8)}...).`);
    } else {
      setStatusText("No active session to end.");
    }
    setActiveSession(null);
    setPendingAction("");
  }

  return (
    <Card id="plan-mode-panel">
      <div className="p-6 sm:p-7">
        <SectionHeader
          title="Plan Mode"
          description="Set the human-owned plan first, then define exactly where AI is allowed to help."
        />

        <div className="rounded-[1.75rem] border border-cyan-200 bg-gradient-to-br from-sky-50 via-cyan-50 to-white p-5 sm:p-6">
          <div className="flex flex-col gap-3 border-b border-cyan-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-cyan-700">
                Planning canvas
              </p>
              <h3 className="mt-1 text-xl font-bold tracking-tight text-slate-900">
                Human-first project setup
              </h3>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={resetToSuggestedPlan}
                className="rounded-full bg-cyan-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-cyan-700"
              >
                Use suggested plan
              </button>

              <button
                type="button"
                onClick={clearPlan}
                className="rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Clear fields
              </button>

              <button
                type="button"
                onClick={startSession}
                disabled={Boolean(pendingAction || activeSession)}
                className="rounded-full border border-emerald-200 bg-emerald-50 px-5 py-2.5 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {pendingAction === "start" ? "Starting..." : "Start session"}
              </button>

              <button
                type="button"
                onClick={endSession}
                disabled={Boolean(pendingAction || !activeSession)}
                className="rounded-full border border-rose-200 bg-rose-50 px-5 py-2.5 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {pendingAction === "end" ? "Ending..." : "End session"}
              </button>
            </div>
          </div>

          <p className="mt-4 text-xs font-medium text-slate-600">{statusText}</p>

          <div className="mt-5 grid gap-3 xl:grid-cols-[minmax(0,1.2fr)_minmax(18rem,0.85fr)]">
            <div className="space-y-3">
              <FieldCard label="My intent">
                <textarea
                  value={form.intent}
                  onChange={(e) => updateField("intent", e.target.value)}
                  className={fieldClassName}
                />
              </FieldCard>

              <FieldCard label="Must keep points">
                <textarea
                  value={form.mustKeepPoints}
                  onChange={(e) =>
                    updateField("mustKeepPoints", e.target.value)
                  }
                  className={fieldClassName}
                />
              </FieldCard>

              <FieldCard label="My scope">
                <textarea
                  value={form.scope}
                  onChange={(e) => updateField("scope", e.target.value)}
                  className={fieldClassName}
                />
              </FieldCard>
            </div>

            <div className="space-y-3">
              <FieldCard label="Deadline">
                <input
                  type="text"
                  value={form.deadline}
                  onChange={(e) => updateField("deadline", e.target.value)}
                  className="w-full rounded-[0.75rem] border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs leading-5 text-slate-700 outline-none transition focus:border-cyan-400 focus:bg-white"
                />
              </FieldCard>

              <FieldCard label="AI scope">
                <textarea
                  value={form.aiScope}
                  onChange={(e) => updateField("aiScope", e.target.value)}
                  className={`${fieldClassName} min-h-[96px] xl:min-h-[124px]`}
                />
              </FieldCard>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
