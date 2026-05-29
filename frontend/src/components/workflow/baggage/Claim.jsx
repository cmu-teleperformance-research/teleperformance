import { useState } from "react";
import ActionButton from "../ActionButton";
import WrongAction from "../WrongAction";

export default function Claim({ onAdvance, workflow }) {
  const [wrong, setWrong] = useState(false);
  const { customer, trace, screens } = workflow;

  return (
    <div className="space-y-4">
      <h2 className="text-base font-semibold text-gray-800">Baggage Claim Detail — PIR# {customer.pirRef}</h2>
      <div className="grid grid-cols-2 gap-3 text-sm border border-gray-200 rounded-xl p-4 bg-white">
        {[
          ["Passenger", customer.name],
          ["Bag Tag", customer.bagTag],
          ["PIR Reference", customer.pirRef],
          ["Flight", customer.flight],
          ["Route", customer.route],
          ["Travel Date", customer.travelDate],
          ["Days Missing", String(trace.daysMissing)],
          ["Status", trace.status],
        ].map(([k, v]) => (
          <div key={k}>
            <span className="text-gray-400">{k}: </span>
            <span className="font-medium text-gray-800">{v}</span>
          </div>
        ))}
      </div>
      <div className="text-sm border border-amber-200 bg-amber-50 rounded-xl p-3">
        <span className="font-semibold text-amber-800">Declared contents: </span>
        <span className="text-amber-700">{trace.contents}</span>
      </div>
      {wrong && <WrongAction onDismiss={() => setWrong(false)} />}
      <div className="flex gap-2 flex-wrap">
        <ActionButton label="Check WorldTracer Status →" variant="primary" onClick={onAdvance} />
        {screens.claim.wrongButtons.map(label => (
          <ActionButton key={label} label={label} onClick={() => setWrong(true)} />
        ))}
      </div>
    </div>
  );
}
