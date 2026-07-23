import { useState } from "react";
import ActionButton from "../ActionButton";
import WrongAction from "../WrongAction";

export default function ExchangeInventory({ onAdvance, workflowData, updateData, workflow }) {
  const [wrong, setWrong] = useState(false);
  const { customer, order, inventory, screens } = workflow;
  const selected = workflowData.delayReason
    ? (inventory.find(s => s.id === workflowData.delayReason) ?? null)
    : null;

  const STATUS_STYLES = {
    "Out of Stock": "bg-gray-100 text-gray-500",
    "Current Purchase": "bg-blue-100 text-blue-700",
    "In Stock": "bg-green-100 text-green-700",
  };

  function styleFor(status) {
    return STATUS_STYLES[status] ?? "bg-amber-100 text-amber-700";
  }

  return (
    <div className="space-y-4">
      <h2 className="text-base font-semibold text-gray-800">Inventory Availability — {order.item}</h2>
      <div className="space-y-2">
        {inventory.map(s => (
          <div
            key={s.id}
            onClick={() => s.selectable && updateData("delayReason", s.id)}
            className={`border rounded-xl p-3 flex items-center justify-between text-sm transition ${
              !s.selectable
                ? "border-gray-100 bg-gray-50 cursor-not-allowed"
                : selected?.id === s.id
                ? "border-blue-400 bg-blue-50 cursor-pointer"
                : "border-gray-200 bg-white hover:border-gray-300 cursor-pointer"
            }`}
          >
            <span className="font-medium text-gray-800">{s.size}</span>
            <span className="flex items-center gap-3">
              {s.shipEstimate && <span className="text-gray-400 text-xs">{s.shipEstimate}</span>}
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${styleFor(s.status)}`}>{s.status}</span>
            </span>
          </div>
        ))}
      </div>
      {wrong && <WrongAction onDismiss={() => setWrong(false)} />}
      {selected && (
        <div className="flex gap-2">
          <ActionButton label={screens.inventory.advanceLabel} variant="primary" onClick={onAdvance} />
          {screens.inventory.wrongButtons.map(label => (
            <ActionButton key={label} label={label} onClick={() => setWrong(true)} />
          ))}
        </div>
      )}
    </div>
  );
}
