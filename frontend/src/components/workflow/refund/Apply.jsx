import { useState } from "react";
import ActionButton from "../ActionButton";
import WrongAction from "../WrongAction";

export default function RefundApply({ workflow, persona, onAdvance, workflowData, updateData }) {
  const [wrong, setWrong] = useState(false);
  const cfg = workflow.screenConfigs[4];
  const note = workflowData.caseNote;

  const portalPersona = workflow.personas?.[persona];
  let summary = cfg.summary;
  let notePlaceholder = cfg.notePlaceholder;

  if (portalPersona) {
    const transactionId = `ORD-${portalPersona.transaction.orderId}`;
    summary = cfg.summary.map(([label, value]) => {
      if (label === "Customer") return [label, portalPersona.name];
      if (label === "Transaction ID") return [label, transactionId];
      if (label === "Refund Amount") return [label, portalPersona.transaction.amount];
      return [label, value];
    });
    notePlaceholder = `e.g. Customer called re: defective ${transactionId}. ${portalPersona.transaction.product} — ${portalPersona.details.failureCode}. Full refund of ${portalPersona.transaction.amount} initiated to original credit card. ETA ${portalPersona.details.estimatedReturn}.`;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-base font-semibold text-gray-800">{cfg.title}</h2>
      <div className="border border-gray-200 rounded-xl p-4 bg-gray-50 text-sm space-y-2">
        {summary.map(([k, v]) => (
          <div key={k}><span className="text-gray-500">{k}:</span> <strong>{v}</strong></div>
        ))}
      </div>
      <div>
        <label className="text-sm font-medium text-gray-700 block mb-1">Case Note (required)</label>
        <textarea
          rows={3}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder={notePlaceholder}
          value={note}
          onChange={e => updateData("caseNote", e.target.value)}
        />
      </div>
      {wrong && <WrongAction onDismiss={() => setWrong(false)} />}
      <div className="flex gap-2">
        <ActionButton
          label={cfg.advanceLabel}
          variant="primary"
          onClick={() => note.trim() ? onAdvance() : setWrong(true)}
        />
        {cfg.wrongButtons.map(label => (
          <ActionButton key={label} label={label} onClick={() => setWrong(true)} />
        ))}
      </div>
      {!note.trim() && wrong && (
        <p className="text-xs text-red-500">Please enter a case note before confirming.</p>
      )}
    </div>
  );
}
