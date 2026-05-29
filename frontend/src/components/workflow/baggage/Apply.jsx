import { useState } from "react";
import ActionButton from "../ActionButton";
import WrongAction from "../WrongAction";

export default function BaggageApply({ onAdvance, workflow }) {
  const [wrong, setWrong] = useState(false);
  const { customer, screens } = workflow;
  const sc = screens.apply;

  return (
    <div className="space-y-4">
      <h2 className="text-base font-semibold text-gray-800">Confirm Resolution Actions</h2>
      <div className="border border-gray-200 rounded-xl p-4 bg-gray-50 text-sm space-y-2">
        <div><span className="text-gray-500">Bag Tag:</span> <strong>{customer.bagTag}</strong></div>
        <div><span className="text-gray-500">Priority Flag:</span> <strong className="text-red-700">{sc.priorityFlag}</strong></div>
        <div><span className="text-gray-500">Trace Status:</span> <strong>{sc.traceStatus}</strong></div>
        <div><span className="text-gray-500">Interim Expenses:</span> <strong className="text-green-700">{sc.interimExpenses}</strong></div>
        <div><span className="text-gray-500">Medication Reimbursement:</span> <strong className="text-green-700">{sc.medicationReimbursement}</strong></div>
        <div><span className="text-gray-500">Submission Deadline:</span> <strong>{sc.submissionDeadline}</strong></div>
      </div>
      {wrong && <WrongAction onDismiss={() => setWrong(false)} />}
      <div className="flex gap-2 flex-wrap">
        <ActionButton label="Confirm & Send Reimbursement Form →" variant="primary" onClick={onAdvance} />
        {sc.wrongButtons.map(label => (
          <ActionButton key={label} label={label} onClick={() => setWrong(true)} />
        ))}
      </div>
    </div>
  );
}
