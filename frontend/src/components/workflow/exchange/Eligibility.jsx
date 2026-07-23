import { useState } from "react";
import ActionButton from "../ActionButton";
import WrongAction from "../WrongAction";

export default function ExchangeEligibility({ onAdvance, workflow }) {
  const [wrong, setWrong] = useState(false);
  const { eligibility, screens } = workflow;

  return (
    <div className="space-y-4">
      <h2 className="text-base font-semibold text-gray-800">Item Eligibility</h2>
      <div className="border border-green-200 bg-green-50 rounded-xl p-4 text-sm space-y-2">
        {[
          ["Return Window", eligibility.returnWindow],
          ["Item Condition Required", eligibility.itemConditionRequired],
          ["Item Condition", eligibility.itemConditionConfirmed],
          ["Exchange Eligible", eligibility.exchangeEligible],
          ["Return Label", eligibility.returnLabel],
        ].map(([k, v]) => (
          <div key={k}><span className="text-gray-500">{k}: </span><strong className="text-green-800">{v}</strong></div>
        ))}
      </div>
      {wrong && <WrongAction onDismiss={() => setWrong(false)} />}
      <div className="flex gap-2 flex-wrap">
        <ActionButton label={screens.eligibility.advanceLabel} variant="primary" onClick={onAdvance} />
        {screens.eligibility.wrongButtons.map(label => (
          <ActionButton key={label} label={label} onClick={() => setWrong(true)} />
        ))}
      </div>
    </div>
  );
}
