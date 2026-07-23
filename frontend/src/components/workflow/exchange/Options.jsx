import { useState } from "react";
import ActionButton from "../ActionButton";
import WrongAction from "../WrongAction";

export default function ExchangeOptions({ onAdvance, workflowData, updateData, workflow }) {
  const [wrong, setWrong] = useState(false);
  const { exchangeOptions, policy, screens } = workflow;
  const decision = workflowData.resolution;
  const sc = screens.options;

  return (
    <div className="space-y-4">
      <h2 className="text-base font-semibold text-gray-800">Exchange Options</h2>

      <div className="grid grid-cols-2 gap-3">
        {exchangeOptions.map(o => (
          <div key={o.id} className="border border-gray-200 rounded-xl p-3 bg-gray-50 text-sm">
            <p className="font-semibold text-gray-800">{o.label}</p>
            <p className="text-gray-500 mt-0.5">{o.price}</p>
            <p className="text-gray-400 text-xs mt-0.5">{o.timeline}</p>
          </div>
        ))}
      </div>

      <pre className="text-sm bg-gray-50 border border-gray-200 rounded-xl p-4 whitespace-pre-wrap font-mono leading-relaxed">
        {policy}
      </pre>

      <div>
        <div className="flex gap-2 flex-wrap">
          <ActionButton
            label={sc.correctLabel}
            variant={decision === sc.correctValue ? "primary" : "default"}
            onClick={() => { updateData("resolution", sc.correctValue); setWrong(false); }}
          />
          {sc.wrongButtons.map(label => (
            <ActionButton key={label} label={label} onClick={() => setWrong(true)} />
          ))}
        </div>
        {wrong && <WrongAction onDismiss={() => setWrong(false)} />}
      </div>

      {decision === sc.correctValue && (
        <div className="bg-green-50 border border-green-300 rounded-xl p-4 space-y-2">
          <p className="text-sm font-semibold text-green-800">{sc.correctMessage}</p>
          <ActionButton label="Complete Exchange →" variant="primary" onClick={onAdvance} />
        </div>
      )}
    </div>
  );
}
