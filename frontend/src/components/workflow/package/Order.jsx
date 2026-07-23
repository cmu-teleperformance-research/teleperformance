import { useState } from "react";
import ActionButton from "../ActionButton";
import WrongAction from "../WrongAction";

export default function PackageOrder({ onAdvance, workflow }) {
  const [wrong, setWrong] = useState(false);
  const { order, items, screens } = workflow;

  return (
    <div className="space-y-4">
      <h2 className="text-base font-semibold text-gray-800">Order Details — {order.orderNumber}</h2>
      <div className="border border-gray-200 bg-gray-50 rounded-xl p-4 text-sm space-y-2">
        {[
          ["Order Number", order.orderNumber],
          ["Purchase Date", order.purchaseDate],
          ["Order Total", order.total],
          ["Payment Method", order.paymentMethod],
          ["Shipping Address", order.shippingAddress],
        ].map(([k, v]) => (
          <div key={k}><span className="text-gray-500">{k}: </span><strong>{v}</strong></div>
        ))}
      </div>
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Items Purchased</p>
        <div className="border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-100">
          {items.map(item => (
            <div key={item.name} className="flex justify-between px-4 py-2.5 text-sm bg-white">
              <span className="text-gray-700">{item.name}</span>
              <strong className="text-gray-800">${item.price}</strong>
            </div>
          ))}
        </div>
      </div>
      {wrong && <WrongAction onDismiss={() => setWrong(false)} />}
      <div className="flex gap-2 flex-wrap">
        <ActionButton label="View Shipment Tracking →" variant="primary" onClick={onAdvance} />
        {screens.order.wrongButtons.map(label => (
          <ActionButton key={label} label={label} onClick={() => setWrong(true)} />
        ))}
      </div>
    </div>
  );
}
