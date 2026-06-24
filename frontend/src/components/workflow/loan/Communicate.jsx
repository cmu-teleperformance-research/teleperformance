import CaseOutcomeSelector from "../CaseOutcomeSelector";

export default function LoanCommunicate({ onAdvance, workflow, workflowData, updateData }) {
  const cfg = workflow.screenConfigs[5];
  const outcome = workflowData.caseOutcome;
  const resolved = outcome === "resolved";

  const title = "Communicate to Customer";

  const status = resolved ? "Resolved" : "Awaiting Follow-Up";
  const statusColor = resolved ? "text-green-700" : "text-amber-600";

  function handleSelect(val) {
    updateData("caseOutcome", val);
    if (!outcome) onAdvance();
  }

  return (
    <div className="space-y-4">
      <h2 className="text-base font-semibold text-gray-800">{title}</h2>

      <CaseOutcomeSelector
        outcome={outcome}
        onSelect={handleSelect}
      />

      {outcome && (
        <div className="bg-white border border-gray-200 rounded-xl p-4 text-sm text-gray-600">
          <p className="font-semibold text-gray-700 mb-1">Case Summary</p>
          <p>
            Case #: <strong>{cfg.caseRef}</strong> | Status:{" "}
            <span className={`font-semibold ${statusColor}`}>{status}</span>
          </p>
          {resolved && <p>Resolution: {cfg.resolution}</p>}
        </div>
      )}
    </div>
  );
}
