import { useState } from "react";
import ActionButton from "../ActionButton";
import WrongAction from "../WrongAction";

export default function LoanStatus({ workflow, onAdvance, workflowData, updateData }) {
  const [wrong, setWrong] = useState(false);
  const cfg = workflow.screenConfigs[2];
  const done = workflowData.delayReason === "done";

  return (
    <div className="space-y-4">
      <h2 className="text-base font-semibold text-gray-800">{cfg.title}</h2>
      <div className={`border rounded-xl p-4 text-sm space-y-2 ${
        cfg.badgeGood ? "border-green-200 bg-green-50" : "border-amber-200 bg-amber-50"
      }`}>
        <div className={`flex items-center gap-2 font-bold text-base ${
          cfg.badgeGood ? "text-green-700" : "text-amber-700"
        }`}>
          <span>{cfg.badgeGood ? "✓" : "⚠"}</span> {cfg.statusBadge}
        </div>
        <p className={cfg.badgeGood ? "text-green-800" : "text-amber-800"}>{cfg.statusText}</p>
      </div>
      {wrong && <WrongAction onDismiss={() => setWrong(false)} />}
      <div className="flex gap-2 flex-wrap">
        <ActionButton
          label={done ? `✓ ${cfg.action} Sent` : cfg.advanceLabel}
          variant={done ? "primary" : "default"}
          onClick={() => { updateData("delayReason", "done"); setWrong(false); }}
        />
        {cfg.wrongButtons.map(label => (
          <ActionButton key={label} label={label} onClick={() => setWrong(true)} />
        ))}
      </div>
      {done && (
        <div className="bg-green-50 border border-green-300 rounded-xl p-4 space-y-2">
          <ActionButton label="Review Options →" variant="primary" onClick={onAdvance} />
        </div>
      )}
    </div>
  );
}
