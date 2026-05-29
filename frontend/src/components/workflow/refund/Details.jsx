import { useState } from "react";
import ActionButton from "../ActionButton";
import WrongAction from "../WrongAction";

export default function RefundDetails({ workflow, persona, onAdvance }) {
  const [wrong, setWrong] = useState(false);
  const cfg = workflow.screenConfigs[1];

  const portalPersona = workflow.personas?.[persona];
  const data = portalPersona
    ? { ...portalPersona.details, processorRef: `ORD-${portalPersona.transaction.orderId}` }
    : cfg.data;

  return (
    <div className="space-y-4">
      <h2 className="text-base font-semibold text-gray-800">{cfg.title}</h2>
      <div className="border border-gray-200 rounded-xl p-4 bg-gray-50 text-sm space-y-2">
        {Object.entries(data).map(([k, v]) => (
          <div key={k}>
            <span className="text-gray-500 capitalize">{k.replace(/([A-Z])/g, " $1")}: </span>
            <strong>{v}</strong>
          </div>
        ))}
      </div>
      {wrong && <WrongAction onDismiss={() => setWrong(false)} />}
      <div className="flex gap-2 flex-wrap">
        <ActionButton label={cfg.advanceLabel} variant="primary" onClick={onAdvance} />
        {cfg.wrongButtons.map(label => (
          <ActionButton key={label} label={label} onClick={() => setWrong(true)} />
        ))}
      </div>
    </div>
  );
}
