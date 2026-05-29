import { useState } from "react";
import ActionButton from "../ActionButton";
import WrongAction from "../WrongAction";

export default function Flight({ onAdvance, workflow }) {
  const [wrong, setWrong] = useState(false);
  const { customer, screens } = workflow;

  return (
    <div className="space-y-4">
      <h2 className="text-base font-semibold text-gray-800">Flight Detail — {customer.flight}</h2>
      <div className="border border-red-200 bg-red-50 rounded-xl p-4 text-sm space-y-2">
        <div className="flex items-center gap-2 font-bold text-red-700 text-base">
          <span>⚠</span> FLIGHT CANCELLED
        </div>
        {[
          ["Flight", customer.flight],
          ["Route", customer.route],
          ["Original Departure", customer.depTime],
          ["Cancellation Reason", customer.reason],
          ["Details", customer.status],
        ].map(([k, v]) => (
          <div key={k}><span className="text-gray-500">{k}: </span><strong>{v}</strong></div>
        ))}
      </div>
      {wrong && <WrongAction onDismiss={() => setWrong(false)} />}
      <div className="flex gap-2 flex-wrap">
        <ActionButton label="View Rebooking Options →" variant="primary" onClick={onAdvance} />
        {screens.flight.wrongButtons.map(label => (
          <ActionButton key={label} label={label} onClick={() => setWrong(true)} />
        ))}
      </div>
    </div>
  );
}
