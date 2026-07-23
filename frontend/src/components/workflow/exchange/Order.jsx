import { useState } from "react";
import ActionButton from "../ActionButton";
import WrongAction from "../WrongAction";

export default function ExchangeOrder({ onAdvance, workflow }) {
  const [wrong, setWrong] = useState(false);
  const { order, screens } = workflow;

  return (
    <div className="space-y-4">
      <h2 className="text-base font-semibold text-gray-800">Order Details — {order.orderNumber}</h2>
      <div className="border border-gray-200 bg-gray-50 rounded-xl p-4 text-sm space-y-2">
        {[
          ["Order Number", order.orderNumber],
          ["Purchase Date", order.purchaseDate],
          ["Item Purchased", order.item],
          ["Size", order.size],
          ["Color", order.color],
          ["Payment Method", order.paymentMethod],
          ["Shipping Address", order.shippingAddress],
          ["Return Window Status", order.returnWindowStatus],
        ].map(([k, v]) => (
          <div key={k}><span className="text-gray-500">{k}: </span><strong>{v}</strong></div>
        ))}
      </div>
      {wrong && <WrongAction onDismiss={() => setWrong(false)} />}
      <div className="flex gap-2 flex-wrap">
        <ActionButton label="Check Item Eligibility →" variant="primary" onClick={onAdvance} />
        {screens.order.wrongButtons.map(label => (
          <ActionButton key={label} label={label} onClick={() => setWrong(true)} />
        ))}
      </div>
    </div>
  );
}
