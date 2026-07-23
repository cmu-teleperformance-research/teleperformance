import { useState } from "react";
import ActionButton from "../ActionButton";
import WrongAction from "../WrongAction";

export default function PackageResolution({ onAdvance, workflowData, updateData, workflow }) {
  const [wrong, setWrong] = useState(false);
  const { resolutionOptions, policy, screens } = workflow;
  const decision = workflowData.resolution;
  const sc = screens.resolution;

  return (
    <div className="space-y-4">
      <h2 className="text-base font-semibold text-gray-800">Replacement / Refund Options</h2>

      <div className="border border-gray-200 rounded-xl p-4 bg-gray-50 text-sm space-y-2">
        {[
          ["Replacement Eligible", resolutionOptions.replacementEligible ? "Yes" : "No"],
          ["Refund Eligible", resolutionOptions.refundEligible ? "Yes" : "No"],
          ["Reship Option", resolutionOptions.reshipOption],
          ["Store Credit", resolutionOptions.storeCredit],
          ["Investigation Timeline", resolutionOptions.investigationTimeline],
          ["Premium Member Benefits", resolutionOptions.premiumBenefits],
        ].map(([k, v]) => (
          <div key={k}><span className="text-gray-500">{k}: </span><strong>{v}</strong></div>
        ))}
      </div>

      <pre className="text-sm bg-gray-50 border border-gray-200 rounded-xl p-4 whitespace-pre-wrap font-mono leading-relaxed">
        {policy}
      </pre>

      <div>
        <div className="flex gap-2 flex-wrap">
          <ActionButton
            label={sc.correctLabel}
            variant={decision === sc.correctValue ? "primary" : "default"}
            onClick={() => { updateData("resolution", sc.correctValue); setWrong(false); }}
          />
          {sc.wrongButtons.map(label => (
            <ActionButton key={label} label={label} onClick={() => setWrong(true)} />
          ))}
        </div>
        {wrong && <WrongAction onDismiss={() => setWrong(false)} />}
      </div>

      {decision === sc.correctValue && (
        <div className="bg-green-50 border border-green-300 rounded-xl p-4 space-y-2">
          <p className="text-sm font-semibold text-green-800">{sc.correctMessage}</p>
          <ActionButton label="Finalize Resolution →" variant="primary" onClick={onAdvance} />
        </div>
      )}
    </div>
  );
}
