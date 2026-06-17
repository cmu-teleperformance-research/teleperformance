import { useState } from "react";
import ActionButton from "../ActionButton";
import WrongAction from "../WrongAction";

export default function Trace({ onAdvance, workflowData, updateData, workflow }) {
  const [wrong, setWrong] = useState(false);
  const { customer, trace, screens } = workflow;
  const sc = screens.trace;
  const flagged = workflowData.delayReason === sc.correctValue;

  return (
    <div className="space-y-4">
      <h2 className="text-base font-semibold text-gray-800">WorldTracer Status — {customer.bagTag}</h2>
      <div className="border border-gray-200 rounded-xl p-4 bg-gray-50 text-sm space-y-2">
        {[
          ["Trace Status", trace.status],
          ["Last Scanned", trace.lastScan],
          ["Days Missing", `${trace.daysMissing} days`],
          ["PIR Filed", trace.pirFiled],
          ["Est. Resolution", trace.estimatedResolution],
        ].map(([k, v]) => (
          <div key={k}><span className="text-gray-500">{k}: </span><strong>{v}</strong></div>
        ))}
      </div>
      <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-800">
        {sc.medicalAlert}
      </div>
      <div>
        <div className="flex gap-2 flex-wrap">
          <ActionButton
            label={flagged ? sc.correctFlaggedLabel : sc.correctLabel}
            variant={flagged ? "primary" : "default"}
            onClick={() => { updateData("delayReason", sc.correctValue); setWrong(false); }}
          />
          {sc.wrongButtons.map(label => (
            <ActionButton key={label} label={label} onClick={() => setWrong(true)} />
          ))}
        </div>
        {wrong && <WrongAction onDismiss={() => setWrong(false)} />}
      </div>
      {flagged && (
        <div className="bg-green-50 border border-green-300 rounded-xl p-4 space-y-2">
          <p className="text-sm font-semibold text-green-800">{sc.correctMessage}</p>
          <ActionButton label="Review Interim Expenses Policy →" variant="primary" onClick={onAdvance} />
        </div>
      )}
    </div>
  );
}
