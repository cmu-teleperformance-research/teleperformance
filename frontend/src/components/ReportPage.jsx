import { useState } from "react";
import axios from "axios";
import NavBar from "./NavBar";
import API_BASE_URL from "../config";
import { getAttentionCheck } from "../attentionChecks";

const SCENARIO_LABELS = {
  flight_cancellation: "Flight Cancellation",
  baggage_delay: "Lost Baggage",
  book_flight: "Book Flight",
  refund_request: "Refund Request",
  package_never_arrived: "Package Never Arrived",
  exchange_item: "Exchange Item",
  loan_delay: "Loan Delay",
};

const SIGNAL_COLORS = {
  "Strong": "bg-green-100 text-green-700",
  "Developing": "bg-yellow-100 text-yellow-700",
  "Needs Work": "bg-red-100 text-red-600",
};

function CoachingField({ label, value, colorClass = "bg-gray-50" }) {
  if (!value) return null;
  return (
    <div>
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">{label}</p>
      <p className={`text-sm text-gray-700 rounded-lg px-3 py-2 ${colorClass}`}>{value}</p>
    </div>
  );
}

function SignalBadge({ label, value }) {
  const colorClass = SIGNAL_COLORS[value] ?? "bg-gray-100 text-gray-500";
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-gray-500 w-28 flex-shrink-0">{label}</span>
      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${colorClass}`}>
        {value || "—"}
      </span>
    </div>
  );
}

function TurnCard({ turn }) {
  return (
    <div className="border border-gray-100 rounded-lg overflow-hidden">
      <div className="bg-blue-50 px-4 py-3">
        <p className="text-xs font-semibold text-blue-600 mb-1">CSR — Turn {turn.turn}</p>
        <p className="text-sm text-gray-800">{turn.csr_message}</p>
      </div>
      <div className="bg-gray-50 px-4 py-3 border-t border-gray-100 space-y-2">
        <SignalBadge label="Empathy First" value={turn.empathyFirst} />
        <SignalBadge label="Active Listening" value={turn.activeListening} />
        {turn.nextStep && (
          <p className="text-xs text-gray-600 italic pt-1">Next step: {turn.nextStep}</p>
        )}
      </div>
    </div>
  );
}

function AttentionCheckCard({ check, selectedId, submitting, onSelect }) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-blue-100">
      <div className="flex items-center gap-3 mb-4 pb-2 border-b border-gray-200">
        <h2 className="text-lg font-bold text-gray-800 uppercase tracking-wide">Quick Check</h2>
      </div>
      <p className="text-sm text-gray-700 mb-4">{check.prompt}</p>
      <div className="space-y-2">
        {check.options.map((option) => {
          const selected = selectedId === option.id;
          return (
            <button
              key={option.id}
              type="button"
              disabled={Boolean(selectedId) || submitting}
              onClick={() => onSelect(option.id)}
              className={[
                "w-full text-left text-sm px-4 py-3 rounded-lg border transition",
                selected
                  ? "border-blue-500 bg-blue-50 text-blue-900"
                  : "border-gray-200 bg-white text-gray-800 hover:border-blue-300 hover:bg-blue-50/40",
                (selectedId || submitting) && !selected ? "opacity-60" : "",
              ].join(" ")}
            >
              {option.label}
            </button>
          );
        })}
      </div>
      {!selectedId && (
        <p className="text-xs text-gray-400 mt-3">
          Answer to continue to the next step.
        </p>
      )}
    </div>
  );
}

export default function ReportPage({
  report,
  sessionConfig,
  navProps,
  pathIndex = 0,
  pathTotal = 1,
  hasNextSession = false,
  onContinue,
  sessionId,
  token,
  onAuthExpired,
  conditionId,
}) {
  const { scenario, training, scenarioLabel, condition } = sessionConfig ?? {};
  const activeCondition = conditionId || condition;
  const modeLabel = training ? "Training" : "Evaluation";
  const label = scenarioLabel || SCENARIO_LABELS[scenario] || scenario;
  const sessionLabel = `${modeLabel} — ${label}`; //TODO: remove the label for production so that its not a cheat for the attention check
  const progressLabel = pathTotal > 1
    ? `Scenario ${pathIndex + 1} of ${pathTotal}`
    : null;

  const hideCoaching = activeCondition === "cond1" || activeCondition === "cond3";
  const coaching = hideCoaching ? false : report?.session_coaching;

  // console.log("activeCondition", activeCondition);
  // console.log("hideCoaching", hideCoaching);
  // console.log("coaching", coaching);

  const turns = report?.turn_by_turn ?? [];

  const [attentionCheck] = useState(() => getAttentionCheck(scenario));
  const [selectedId, setSelectedId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const requiresCheck = Boolean(attentionCheck);
  const canContinue = !requiresCheck || Boolean(selectedId);

  async function handleSelect(optionId) {
    if (selectedId || submitting) return;
    setSelectedId(optionId);
    if (!sessionId || !token) return;

    setSubmitting(true);
    try {
      await axios.post(
        `${API_BASE_URL}/sessions/${sessionId}/attention-check`,
        { selected_id: optionId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (err) {
      if (err.response?.status === 401) {
        onAuthExpired?.();
        return;
      }
      // Still allow continue if save fails; answer is kept locally for this view.
      console.error("Failed to save attention check:", err);
    } finally {
      setSubmitting(false);
    }
  }

  const continueLabel = hasNextSession ? "Continue to Next Scenario" : "Finish Path";

  return (
    <>
      {/* Top bar */}
      <div className="bg-white border-b border-gray-200 px-8 py-3 flex items-center justify-between sticky top-0 z-10">
        <div>
          <span className="font-semibold text-gray-800">Session Report</span>
          <span className="ml-3 text-sm text-gray-400">{sessionLabel}</span>
          {progressLabel && (
            <span className="ml-2 text-sm text-gray-300">· {progressLabel}</span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={onContinue}
            disabled={!canContinue}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {continueLabel}
          </button>
          <NavBar {...navProps} />
        </div>
      </div>

      {/* Report body */}
      <div className="bg-gray-50 min-h-screen py-8 px-6">
        <div className="max-w-2xl mx-auto space-y-6">

          {/* Title */}
          <div className="text-center pb-2">
            <h1 className="text-3xl font-bold text-gray-900">Performance Report</h1>
            <p className="text-gray-500 mt-1">{sessionLabel}</p>
            {progressLabel && (
              <p className="text-sm text-gray-400 mt-1">{progressLabel} complete</p>
            )}
          </div>

          {attentionCheck && (
            <AttentionCheckCard
              check={attentionCheck}
              selectedId={selectedId}
              submitting={submitting}
              onSelect={handleSelect}
            />
          )}

          {/* Session Coaching — hidden for cond1 (baseline) and cond3 (implicit) */}
          {coaching && (
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-6 pb-2 border-b-2 border-gray-800">
                <h2 className="text-lg font-bold text-gray-800 uppercase tracking-wide">Session Coaching</h2>
              </div>
              <div className="space-y-4">
                <CoachingField label="Overall Performance" value={coaching.overallPerformance} colorClass="bg-gray-50" />
                <CoachingField label="Keep Doing" value={coaching.keepDoing} colorClass="bg-green-50" />
                <CoachingField label="Key Pattern to Improve" value={coaching.keyPatternToImprove} colorClass="bg-yellow-50" />
                <CoachingField label="Actionable Improvement" value={coaching.actionableImprovement} colorClass="bg-blue-50" />
                <CoachingField label="Encouragement" value={coaching.encouragement} colorClass="bg-gray-50" />
              </div>
            </div>
          )}

          {/* Turn-by-Turn Feedback */}
          {turns.length > 0 && !hideCoaching && (
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-6 pb-2 border-b-2 border-gray-800">
                <h2 className="text-lg font-bold text-gray-800 uppercase tracking-wide">Turn-by-Turn Feedback</h2>
              </div>
              <div className="space-y-4">
                {turns.map((turn) => (
                  <TurnCard key={turn.turn} turn={turn} />
                ))}
              </div>
            </div>
          )}

          {/* Bottom CTA */}
          <div className="text-center pt-2 pb-8">
            <button
              onClick={onContinue}
              disabled={!canContinue}
              className="bg-blue-600 text-white px-8 py-3 rounded-lg text-sm font-medium hover:bg-blue-700 transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {continueLabel}
            </button>
            {!canContinue && (
              <p className="text-xs text-gray-400 mt-2">
                Complete the quick check above to continue.
              </p>
            )}
            {canContinue && hasNextSession && (
              <p className="text-xs text-gray-400 mt-2">
                Next up: scenario {pathIndex + 2} of {pathTotal}
              </p>
            )}
          </div>

        </div>
      </div>
    </>
  );
}
