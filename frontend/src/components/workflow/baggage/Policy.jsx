import { useState } from "react";
import ActionButton from "../ActionButton";
import WrongAction from "../WrongAction";

export default function BaggagePolicy({ onAdvance, workflowData, updateData, workflow }) {
  const [wrong, setWrong] = useState(false);
  const { policy, screens } = workflow;
  const decision = workflowData.resolution;
  const sc = screens.policy;

  return (
    <div className="space-y-4">
      <h2 className="text-base font-semibold text-gray-800">Interim Expenses Policy</h2>
      <pre className="text-sm bg-gray-50 border border-gray-200 rounded-xl p-4 whitespace-pre-wrap font-mono leading-relaxed">
        {policy}
      </pre>
      <div>
        <p className="text-sm font-semibold text-gray-700 mb-2">Select what applies to this passenger:</p>
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
          <ActionButton label="Apply & Confirm →" variant="primary" onClick={onAdvance} />
        </div>
      )}
    </div>
  );
}
