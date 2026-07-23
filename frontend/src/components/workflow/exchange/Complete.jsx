import { useState } from "react";
import ActionButton from "../ActionButton";
import WrongAction from "../WrongAction";

export default function ExchangeComplete({ onAdvance, workflowData, workflow }) {
  const [wrong, setWrong] = useState(false);
  const { customer, inventory, exchangeRecord, screens } = workflow;

  const selectedSize = inventory.find(s => s.id === workflowData.delayReason);

  const confirmData = [
    ["Customer", customer.name],
    ["New Size", selectedSize.size],
    ["Exchange Confirmation Number", exchangeRecord.exchangeConfirmationNumber],
    ["New Order Number", exchangeRecord.newOrderNumber],
    ["Return Label", exchangeRecord.returnLabel],
    ["Estimated Delivery", exchangeRecord.estimatedDeliveryDate],
  ];

  return (
    <div className="space-y-4">
      <h2 className="text-base font-semibold text-gray-800">Complete Exchange</h2>
      <div className="border border-gray-200 rounded-xl p-4 bg-gray-50 text-sm space-y-2">
        {confirmData.map(([k, v]) => (
          <div key={k}>
            <span className="text-gray-500">{k}:</span>{" "}
            <strong className={k === "Exchange Confirmation Number" ? "text-green-700" : ""}>{v}</strong>
          </div>
        ))}
      </div>
      {wrong && <WrongAction onDismiss={() => setWrong(false)} />}
      <div className="flex gap-2">
        <ActionButton label="Confirm & Issue Exchange →" variant="primary" onClick={onAdvance} />
        {screens.complete.wrongButtons.map(label => (
          <ActionButton key={label} label={label} onClick={() => setWrong(true)} />
        ))}
      </div>
    </div>
  );
}
