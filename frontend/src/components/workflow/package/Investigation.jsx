import { useState } from "react";
import ActionButton from "../ActionButton";
import WrongAction from "../WrongAction";

export default function PackageInvestigation({ onAdvance, workflowData, updateData, workflow }) {
  const [wrong, setWrong] = useState(false);
  const { investigation, screens } = workflow;
  const sc = screens.investigation;
  const submitted = workflowData.delayReason === sc.correctValue;

  return (
    <div className="space-y-4">
      <h2 className="text-base font-semibold text-gray-800">Carrier Investigation</h2>
      <div className="border border-gray-200 rounded-xl p-4 bg-gray-50 text-sm space-y-2">
        {[
          ["Last GPS Location", investigation.lastGpsLocation],
          ["Driver Notes", investigation.driverNotes],
          ["Delivery Confidence", investigation.deliveryConfidence],
          ["Neighbor Delivery Check", investigation.neighborDeliveryCheck],
          ["Package Locker Check", investigation.packageLockerCheck],
          ["Escalation Status", investigation.escalationStatus],
        ].map(([k, v]) => (
          <div key={k}><span className="text-gray-500">{k}: </span><strong>{v}</strong></div>
        ))}
      </div>

      <div>
        <div className="flex gap-2 flex-wrap">
          <ActionButton
            label={sc.correctLabel}
            variant={submitted ? "primary" : "default"}
            onClick={() => { updateData("delayReason", sc.correctValue); setWrong(false); }}
          />
          {sc.wrongButtons.map(label => (
            <ActionButton key={label} label={label} onClick={() => setWrong(true)} />
          ))}
        </div>
        {wrong && <WrongAction onDismiss={() => setWrong(false)} />}
      </div>

      {submitted && (
        <div className="bg-green-50 border border-green-300 rounded-xl p-4 space-y-2">
          <p className="text-sm font-semibold text-green-800">{sc.correctMessage}</p>
          <ActionButton label="Review Replacement / Refund Options →" variant="primary" onClick={onAdvance} />
        </div>
      )}
    </div>
  );
}
