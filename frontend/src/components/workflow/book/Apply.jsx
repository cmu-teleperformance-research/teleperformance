import { useState } from "react";
import ActionButton from "../ActionButton";
import WrongAction from "../WrongAction";

const EXTRA_LINE_IDS = ["priority_boarding", "wifi", "insurance", "special_assistance"];

export default function BookApply({ onAdvance, workflowData, workflow }) {
  const [wrong, setWrong] = useState(false);
  const { customer, flights, extras, pricing, booking, screens } = workflow;

  const selectedFlight = flights.find(f => f.id === workflowData.delayReason);
  const selectedSeat = workflowData.selectedSeat;
  const extrasSelected = workflowData.extrasSelected || {};
  const byId = id => extras.find(e => e.id === id);

  const addedExtras = [...EXTRA_LINE_IDS, "checked_bag"]
    .filter(id => extrasSelected[id])
    .map(id => byId(id).label);

  const baseFare = selectedFlight.fareEconomy;
  const taxes = pricing.taxes;
  const seatFee = selectedSeat.fee;
  const bagsCost = extrasSelected.checked_bag ? byId("checked_bag").price : 0;
  const extrasCost = EXTRA_LINE_IDS.reduce((sum, id) => sum + (extrasSelected[id] ? byId(id).price : 0), 0);
  const total = baseFare + taxes + seatFee + bagsCost + extrasCost;

  const confirmData = [
    ["Passenger", customer.name],
    ["Flight", `${selectedFlight.flightNumber} — ${selectedFlight.route}`],
    ["Departs / Arrives", `${selectedFlight.departure} → ${selectedFlight.arrival}`],
    ["Seat", `${selectedSeat.id}`],
    ["Extras", addedExtras.length ? addedExtras.join(", ") : "None"],
    ["Total Price", `$${total}`],
  ];

  return (
    <div className="space-y-4">
      <h2 className="text-base font-semibold text-gray-800">Complete Booking</h2>
      <div className="border border-gray-200 rounded-xl p-4 bg-gray-50 text-sm space-y-2">
        {confirmData.map(([k, v]) => (
          <div key={k}>
            <span className="text-gray-500">{k}:</span>{" "}
            <strong className={k === "Total Price" ? "text-green-700" : ""}>{v}</strong>
          </div>
        ))}
      </div>
      {wrong && <WrongAction onDismiss={() => setWrong(false)} />}
      <div className="flex gap-2">
        <ActionButton label="Confirm & Issue Booking →" variant="primary" onClick={onAdvance} />
        {screens.apply.wrongButtons.map(label => (
          <ActionButton key={label} label={label} onClick={() => setWrong(true)} />
        ))}
      </div>
    </div>
  );
}
