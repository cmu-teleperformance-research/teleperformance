import CaseOutcomeSelector from "../CaseOutcomeSelector";

export default function FlightCommunicate({ onReset, workflow, workflowData, updateData }) {
  const sc = workflow.screens.communicate;
  const outcome = workflowData.caseOutcome;
  const resolved = outcome === "resolved";

  const title = !outcome
    ? "Case Outcome"
    : resolved
    ? "Case Resolved — Communicate to Customer"
    : "Case Not Resolved — Communicate to Customer";

  const status = resolved ? "Closed" : "Escalated";
  const statusColor = resolved ? "text-green-700" : "text-amber-600";

  return (
    <div className="space-y-4">
      <h2 className="text-base font-semibold text-gray-800">{title}</h2>

      <CaseOutcomeSelector
        outcome={outcome}
        onSelect={(val) => updateData("caseOutcome", val)}
      />

      {outcome && (
        <div className="bg-white border border-gray-200 rounded-xl p-4 text-sm text-gray-600">
          <p className="font-semibold text-gray-700 mb-1">Case Summary</p>
          <p>
            Case #: <strong>{sc.caseNumber}</strong> | Status:{" "}
            <span className={`font-semibold ${statusColor}`}>{status}</span>
          </p>
          {resolved && <p>Resolution: {sc.resolution}</p>}
        </div>
      )}

      <button onClick={onReset} className="text-sm text-blue-600 hover:underline">↺ Start New Case</button>
    </div>
  );
}
