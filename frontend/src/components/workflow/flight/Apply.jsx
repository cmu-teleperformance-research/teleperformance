import { useState } from "react";
import ActionButton from "../ActionButton";
import WrongAction from "../WrongAction";

export default function FlightApply({ onAdvance, workflow }) {
  const [wrong, setWrong] = useState(false);
  const sc = workflow.screens.apply;

  return (
    <div className="space-y-4">
      <h2 className="text-base font-semibold text-gray-800">Confirm Actions</h2>
      <div className="border border-gray-200 rounded-xl p-4 bg-gray-50 text-sm space-y-2">
        {sc.confirmData.map(([k, v]) => (
          <div key={k}>
            <span className="text-gray-500">{k}:</span>{" "}
            <strong className={k === "Compensation" ? "text-green-700" : ""}>{v}</strong>
          </div>
        ))}
      </div>
      {wrong && <WrongAction onDismiss={() => setWrong(false)} />}
      <div className="flex gap-2">
        <ActionButton label="Confirm Rebooking + Issue Voucher →" variant="primary" onClick={onAdvance} />
        {sc.wrongButtons.map(label => (
          <ActionButton key={label} label={label} onClick={() => setWrong(true)} />
        ))}
      </div>
    </div>
  );
}
