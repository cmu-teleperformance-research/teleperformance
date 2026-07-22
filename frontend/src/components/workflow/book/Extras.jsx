import { useState } from "react";
import ActionButton from "../ActionButton";
import WrongAction from "../WrongAction";

export default function BookExtras({ onAdvance, workflowData, updateData, workflow }) {
  const [wrong, setWrong] = useState(false);
  const { extras, screens } = workflow;
  const selected = workflowData.extrasSelected || {};

  function toggle(id) {
    updateData("extrasSelected", { ...selected, [id]: !selected[id] });
  }

  const carryOn = extras.find(e => e.id === "carry_on");
  const toggleable = extras.filter(e => e.id !== "carry_on");

  return (
    <div className="space-y-4">
      <h2 className="text-base font-semibold text-gray-800">Extras & Baggage</h2>

      {carryOn && (
        <div className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-600 bg-gray-50">
          {carryOn.label}
        </div>
      )}

      <div className="space-y-2">
        {toggleable.map(extra => (
          <div
            key={extra.id}
            onClick={() => toggle(extra.id)}
            className={`border rounded-xl px-4 py-3 flex items-center justify-between cursor-pointer transition text-sm ${
              selected[extra.id]
                ? "border-blue-400 bg-blue-50"
                : "border-gray-200 bg-white hover:border-gray-300"
            }`}
          >
            <span className="text-gray-800">{extra.label}</span>
            <span className="flex items-center gap-3">
              <span className="text-gray-500">{extra.price > 0 ? `$${extra.price}` : "Free"}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                selected[extra.id] ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-500"
              }`}>
                {selected[extra.id] ? "Added" : "Add"}
              </span>
            </span>
          </div>
        ))}
      </div>

      {wrong && <WrongAction onDismiss={() => setWrong(false)} />}

      <div className="flex gap-2">
        <ActionButton label={screens.extras.advanceLabel} variant="primary" onClick={onAdvance} />
        {screens.extras.wrongButtons.map(label => (
          <ActionButton key={label} label={label} onClick={() => setWrong(true)} />
        ))}
      </div>
    </div>
  );
}
