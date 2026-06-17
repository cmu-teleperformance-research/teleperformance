import { useState } from "react";
import ActionButton from "../ActionButton";
import WrongAction from "../WrongAction";

export default function Rebook({ onAdvance, workflowData, updateData, workflow }) {
  const [wrong, setWrong] = useState(false);
  const { customer, rebooking, screens } = workflow;
  const selected = workflowData.delayReason
    ? (rebooking.find(f => f.id === workflowData.delayReason) ?? null)
    : null;

  return (
    <div className="space-y-4">
      <h2 className="text-base font-semibold text-gray-800">Rebooking Options — {customer.name}</h2>
      <div className="space-y-3">
        {rebooking.map(f => (
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
                <p className="font-semibold text-gray-800">{f.flight} &nbsp;·&nbsp; {f.route}</p>
                <p className="text-gray-500 mt-0.5">Departs {f.dep} → Arrives {f.arr}</p>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                f.type === "partner" ? "bg-yellow-100 text-yellow-700" : "bg-green-100 text-green-700"
              }`}>{f.seats}</span>
            </div>
            {f.type === "partner" && (
              <p className="text-xs text-yellow-700 mt-1">⚠ Partner airline — requires supervisor approval</p>
            )}
          </div>
        ))}
      </div>
      {wrong && <WrongAction onDismiss={() => setWrong(false)} />}
      {selected && (
        <div className="flex gap-2">
          {selected.type === "partner"
            ? <ActionButton label="Select This Flight" variant="primary" onClick={() => setWrong(true)} />
            : <ActionButton label={screens.rebook.advanceLabel} variant="primary" onClick={onAdvance} />
          }
          {screens.rebook.wrongButtons.map(label => (
            <ActionButton key={label} label={label} onClick={() => setWrong(true)} />
          ))}
        </div>
      )}
    </div>
  );
}
