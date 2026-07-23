import { useState } from "react";
import ActionButton from "../ActionButton";
import WrongAction from "../WrongAction";

export default function PackageFinalize({ onAdvance, workflow }) {
  const [wrong, setWrong] = useState(false);
  const { resolutionRecord, confirmationEmail, screens } = workflow;

  const confirmData = [
    ["Replacement Order Number", resolutionRecord.replacementOrderNumber],
    ["Refund Confirmation", resolutionRecord.refundConfirmation],
    ["Investigation Case Number", resolutionRecord.investigationCaseNumber],
    ["Confirmation Email", `Sent to ${confirmationEmail}`],
    ["Resolution Summary", screens.communicate.resolution],
  ];

  return (
    <div className="space-y-4">
      <h2 className="text-base font-semibold text-gray-800">Finalize Resolution</h2>
      <div className="border border-gray-200 rounded-xl p-4 bg-gray-50 text-sm space-y-2">
        {confirmData.map(([k, v]) => (
          <div key={k}>
            <span className="text-gray-500">{k}:</span>{" "}
            <strong className={k === "Replacement Order Number" ? "text-green-700" : ""}>{v}</strong>
          </div>
        ))}
      </div>
      {wrong && <WrongAction onDismiss={() => setWrong(false)} />}
      <div className="flex gap-2">
        <ActionButton label="Confirm Resolution →" variant="primary" onClick={onAdvance} />
        {screens.finalize.wrongButtons.map(label => (
          <ActionButton key={label} label={label} onClick={() => setWrong(true)} />
        ))}
      </div>
    </div>
  );
}
