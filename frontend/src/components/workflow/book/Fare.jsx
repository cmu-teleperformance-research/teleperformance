import { useState } from "react";
import ActionButton from "../ActionButton";
import WrongAction from "../WrongAction";

const EXTRA_LINE_IDS = ["priority_boarding", "wifi", "insurance", "special_assistance"];

export default function BookFare({ onAdvance, workflowData, workflow }) {
  const [wrong, setWrong] = useState(false);
  const { flights, extras, pricing, policy, screens } = workflow;

  const selectedFlight = workflowData.delayReason
    ? flights.find(f => f.id === workflowData.delayReason)
    : null;
  const selectedSeat = workflowData.selectedSeat || null;
  const extrasSelected = workflowData.extrasSelected || {};

  if (!selectedFlight || !selectedSeat) {
    return (
      <div className="space-y-4">
        <h2 className="text-base font-semibold text-gray-800">Fare Summary</h2>
        <div className="border border-amber-200 bg-amber-50 rounded-xl px-4 py-3 text-sm text-amber-700">
          Select a flight and a seat before reviewing the fare summary.
        </div>
      </div>
    );
  }

  const byId = id => extras.find(e => e.id === id);
  const baseFare = selectedFlight.fareEconomy;
  const taxes = pricing.taxes;
  const seatFee = selectedSeat.fee;
  const bagsCost = extrasSelected.checked_bag ? byId("checked_bag").price : 0;
  const extrasCost = EXTRA_LINE_IDS.reduce((sum, id) => sum + (extrasSelected[id] ? byId(id).price : 0), 0);
  const total = baseFare + taxes + seatFee + bagsCost + extrasCost;

  return (
    <div className="space-y-4">
      <h2 className="text-base font-semibold text-gray-800">Fare Summary — {selectedFlight.flightNumber}</h2>

      <div className="border border-gray-200 rounded-xl p-4 bg-gray-50 text-sm space-y-2">
        <div className="flex justify-between"><span className="text-gray-500">Base Fare</span><strong>${baseFare}</strong></div>
        <div className="flex justify-between"><span className="text-gray-500">Taxes</span><strong>${taxes}</strong></div>
        <div className="flex justify-between"><span className="text-gray-500">Seat Fee ({selectedSeat.id})</span><strong>${seatFee}</strong></div>
        <div className="flex justify-between"><span className="text-gray-500">Bags</span><strong>${bagsCost}</strong></div>
        <div className="flex justify-between"><span className="text-gray-500">Extras</span><strong>${extrasCost}</strong></div>
        <div className="flex justify-between border-t border-gray-200 pt-2 mt-1 text-base">
          <span className="text-gray-700 font-semibold">Total</span>
          <span className="font-bold text-green-700">${total}</span>
        </div>
      </div>

      <details className="text-sm">
        <summary className="cursor-pointer text-gray-500 font-medium">Refund / Change Policy</summary>
        <pre className="mt-2 text-xs bg-gray-50 border border-gray-200 rounded-xl p-4 whitespace-pre-wrap font-mono leading-relaxed">
          {policy}
        </pre>
      </details>

      {wrong && <WrongAction onDismiss={() => setWrong(false)} />}

      <div className="flex gap-2">
        <ActionButton label={screens.fare.advanceLabel} variant="primary" onClick={onAdvance} />
        {screens.fare.wrongButtons.map(label => (
          <ActionButton key={label} label={label} onClick={() => setWrong(true)} />
        ))}
      </div>
    </div>
  );
}
