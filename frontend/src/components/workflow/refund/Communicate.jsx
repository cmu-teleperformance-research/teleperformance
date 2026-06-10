export default function RefundCommunicate({ workflow, persona, onReset }) {
  const cfg = workflow.screenConfigs[5];
  const portalPersona = workflow.personas?.[persona];

  let customerName, script, caseRef, resolution;

  if (portalPersona) {
    const { firstName, transaction, details } = portalPersona;
    const transactionId = `ORD-${transaction.orderId}`;
    customerName = firstName;
    script = `"${firstName}, I've reviewed your order and confirmed the return request for the ${transaction.product} — order ${transactionId}. Based on the issue reported, you qualify for a full refund of ${transaction.amount} to your original credit card.\n\nI've initiated the refund now. You should see ${transaction.amount} returned to your card within ${details.estimatedReturn}.\n\nIs there anything else I can help you with today?"`;
    caseRef = `REFUND-${transactionId}`;
    resolution = `Full refund of ${transaction.amount} initiated to original credit card. Customer informed. ETA ${details.estimatedReturn}.`;
  } else {
    customerName = cfg.customerName;
    script = cfg.script;
    caseRef = cfg.caseRef;
    resolution = cfg.resolution;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-base font-semibold text-gray-800">{cfg.title}</h2>
      <div className="bg-amber-50 border-2 border-amber-400 rounded-xl p-5 space-y-3">
        <p className="text-xs font-bold uppercase tracking-wide text-amber-600">
          ↩ Switch to Chat tab — say this to {customerName}:
        </p>
        <p className="text-sm text-gray-800 leading-relaxed italic" style={{ whiteSpace: "pre-line" }}>
          {script}
        </p>
      </div>
      <div className="bg-white border border-gray-200 rounded-xl p-4 text-sm text-gray-600">
        <p className="font-semibold text-gray-700 mb-1">Case Summary</p>
        <p>
          Case #: <strong>{caseRef}</strong> | Status:{" "}
          <span className={`font-semibold ${cfg.caseStatus === "Closed" ? "text-green-700" : "text-yellow-600"}`}>
            {cfg.caseStatus}
          </span>
        </p>
        <p>Resolution: {resolution}</p>
      </div>
      <button onClick={onReset} className="text-sm text-blue-600 hover:underline">↺ Start New Case</button>
    </div>
  );
}
