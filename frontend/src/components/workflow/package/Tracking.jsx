import { useState } from "react";
import ActionButton from "../ActionButton";
import WrongAction from "../WrongAction";

export default function PackageTracking({ onAdvance, workflow }) {
  const [wrong, setWrong] = useState(false);
  const { tracking, screens } = workflow;

  return (
    <div className="space-y-4">
      <h2 className="text-base font-semibold text-gray-800">Shipment Tracking — {tracking.trackingNumber}</h2>
      <p className="text-sm text-gray-500">Carrier: {tracking.carrier} &nbsp;·&nbsp; Expected Delivery: {tracking.expectedDelivery}</p>

      <div className="border border-gray-200 rounded-xl p-4 bg-gray-50 space-y-3">
        {tracking.timeline.map((t, i) => (
          <div key={i} className="flex gap-3 text-sm">
            <span className="w-16 text-gray-400 flex-shrink-0">{t.date}</span>
            <div>
              <p className={`font-medium ${t.event === "Delivered" ? "text-red-600" : "text-gray-800"}`}>{t.event}</p>
              {t.detail && <p className="text-gray-500 text-xs mt-0.5">{t.detail}</p>}
            </div>
          </div>
        ))}
      </div>

      <div className="border border-red-200 bg-red-50 rounded-xl p-4 text-sm space-y-2">
        <div className="flex items-center gap-2 font-bold text-red-700">
          <span>⚠</span> Marked delivered — customer reports package never arrived
        </div>
        <div><span className="text-gray-500">GPS Delivery Scan: </span><strong>{tracking.gpsScan}</strong></div>
        <div><span className="text-gray-500">Delivery Photo: </span><strong>{tracking.deliveryPhoto}</strong></div>
        <div><span className="text-gray-500">Driver Notes: </span><strong>{tracking.driverNotes}</strong></div>
        <div><span className="text-gray-500">Signature Required: </span><strong>{tracking.signatureRequired}</strong></div>
      </div>

      {wrong && <WrongAction onDismiss={() => setWrong(false)} />}
      <div className="flex gap-2 flex-wrap">
        <ActionButton label={screens.tracking.advanceLabel} variant="primary" onClick={onAdvance} />
        {screens.tracking.wrongButtons.map(label => (
          <ActionButton key={label} label={label} onClick={() => setWrong(true)} />
        ))}
      </div>
    </div>
  );
}
