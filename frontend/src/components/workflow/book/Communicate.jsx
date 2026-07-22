import CaseOutcomeSelector from "../CaseOutcomeSelector";

export default function BookCommunicate({ onAdvance, workflow, workflowData, updateData }) {
  const sc = workflow.screens.communicate;
  const { booking } = workflow;
  const outcome = workflowData.caseOutcome;
  const resolved = outcome === "resolved";

  const status = resolved ? "Closed" : "Escalated";
  const statusColor = resolved ? "text-green-700" : "text-amber-600";

  function handleSelect(val) {
    updateData("caseOutcome", val);
    if (!outcome) onAdvance();
  }

  return (
    <div className="space-y-4">
      <h2 className="text-base font-semibold text-gray-800">Communicate to Passenger</h2>

      <div className="border border-green-200 bg-green-50 rounded-xl p-4 text-sm space-y-1">
        <div><span className="text-gray-500">Confirmation Number: </span><strong>{booking.confirmationNumber}</strong></div>
        <div><span className="text-gray-500">Ticket Number: </span><strong>{booking.ticketNumber}</strong></div>
      </div>

      <CaseOutcomeSelector
        outcome={outcome}
        onSelect={handleSelect}
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
    </div>
  );
}
