import { useState } from "react";
import ActionButton from "../ActionButton";
import WrongAction from "../WrongAction";

export default function LoanPolicy({ workflow, onAdvance, workflowData, updateData }) {
  const [wrong, setWrong] = useState(false);
  const cfg = workflow.screenConfigs[3];
  const decision = workflowData.resolution;

  return (
    <div className="space-y-4">
      <h2 className="text-base font-semibold text-gray-800">{cfg.title}</h2>
      <pre className="text-sm bg-gray-50 border border-gray-200 rounded-xl p-4 whitespace-pre-wrap font-mono leading-relaxed">
        {cfg.policy}
      </pre>
      <div>
        <div className="flex gap-2 flex-wrap">
          <ActionButton
            label={cfg.correctLabel}
            variant={decision === "correct" ? "primary" : "default"}
            onClick={() => { updateData("resolution", "correct"); setWrong(false); }}
          />
          {cfg.wrongButtons.map(label => (
            <ActionButton key={label} label={label} onClick={() => setWrong(true)} />
          ))}
        </div>
        {wrong && <WrongAction onDismiss={() => setWrong(false)} />}
      </div>
      {decision === "correct" && (
        <div className="bg-green-50 border border-green-300 rounded-xl p-4 space-y-2">
          <p className="text-sm font-semibold text-green-800">{cfg.correctMessage}</p>
          <ActionButton label="Apply & Confirm →" variant="primary" onClick={onAdvance} />
        </div>
      )}
    </div>
  );
}
