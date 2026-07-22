import { useState } from "react";
import ActionButton from "../ActionButton";
import WrongAction from "../WrongAction";

export default function BookFlights({ onAdvance, workflowData, updateData, workflow }) {
  const [wrong, setWrong] = useState(false);
  const { customer, flights, screens } = workflow;
  const selected = workflowData.delayReason
    ? (flights.find(f => f.id === workflowData.delayReason) ?? null)
    : null;

  return (
    <div className="space-y-4">
      <h2 className="text-base font-semibold text-gray-800">
        Available Flights — {customer.origin} → {customer.destination}
      </h2>
      <div className="space-y-3">
        {flights.map(f => (
          <div
            key={f.id}
            onClick={() => updateData("delayReason", f.id)}
            className={`border rounded-xl p-4 cursor-pointer transition text-sm ${
              selected?.id === f.id
                ? "border-blue-400 bg-blue-50"
                : "border-gray-200 bg-white hover:border-gray-300"
            }`}
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="font-semibold text-gray-800">{f.flightNumber} &nbsp;·&nbsp; {f.route}</p>
                <p className="text-gray-500 mt-0.5">Departs {f.departure} → Arrives {f.arrival}</p>
                <p className="text-gray-400 text-xs mt-1">{f.stops} &nbsp;·&nbsp; {f.duration} &nbsp;·&nbsp; {f.aircraft}</p>
              </div>
              <div className="text-right">
                <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-green-100 text-green-700">
                  {f.seatsRemaining} left
                </span>
                <p className="text-gray-700 mt-1.5">Economy <strong>${f.fareEconomy}</strong></p>
                <p className="text-gray-400 text-xs">Business ${f.fareBusiness}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
      {wrong && <WrongAction onDismiss={() => setWrong(false)} />}
      {selected && (
        <div className="flex gap-2">
          <ActionButton label={screens.flights.advanceLabel} variant="primary" onClick={onAdvance} />
          {screens.flights.wrongButtons.map(label => (
            <ActionButton key={label} label={label} onClick={() => setWrong(true)} />
          ))}
        </div>
      )}
    </div>
  );
}
