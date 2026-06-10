import { useState } from "react";
import ActionButton from "../ActionButton";
import WrongAction from "../WrongAction";

const CARD_COLORS = {
  green:  "bg-green-50  border-green-200  text-green-800",
  red:    "bg-red-50    border-red-200    text-red-800",
  blue:   "bg-blue-50   border-blue-200   text-blue-800",
  orange: "bg-orange-50 border-orange-200 text-orange-800",
  gray:   "bg-gray-50   border-gray-200   text-gray-700",
};

export default function RefundPolicy({ workflow, onAdvance, workflowData, updateData }) {
  const [wrong, setWrong] = useState(false);
  const cfg = workflow.screenConfigs[3];
  const decision = workflowData.resolution;

  return (
    <div className="space-y-4">
      <h2 className="text-base font-semibold text-gray-800">{cfg.title}</h2>

      <div className="space-y-2">
        {cfg.policyCards.map(card => (
          <div key={card.label} className={`rounded-lg border p-3 ${CARD_COLORS[card.color] ?? CARD_COLORS.gray}`}>
            <p className="text-xs font-semibold uppercase tracking-wide mb-1.5 opacity-75">{card.label}</p>
            <ul className="space-y-1">
              {card.items.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <span className="mt-1.5 w-1 h-1 rounded-full bg-current flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div>
        <p className="text-sm font-semibold text-gray-700 mb-2">Select what applies:</p>
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
