export default function RefundCommunicate({ workflow, onReset }) {
  const cfg = workflow.screenConfigs[5];
  const statusColor = cfg.caseStatus === "Closed" ? "text-green-700" : "text-yellow-600";

  return (
    <div className="space-y-4">
      <h2 className="text-base font-semibold text-gray-800">Communicate to Customer</h2>

      <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Cover in your response</p>
        <ul className="space-y-2">
          {cfg.coaching.items.map((item, i) => (
            <li key={i} className="flex items-start gap-2.5 text-sm text-gray-700">
              <span className="mt-0.5 w-4 h-4 flex-shrink-0 rounded border-2 border-gray-300" />
              {item}
            </li>
          ))}
        </ul>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
        <p className="text-xs font-medium text-blue-700">
          ↩ Return to Chat — formulate your own response using the points above.
        </p>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-4 text-sm text-gray-600">
        <p className="font-semibold text-gray-700 mb-1">Case Summary</p>
        <p>
          Case #: <strong>{cfg.caseRef}</strong> | Status:{" "}
          <span className={`font-semibold ${statusColor}`}>{cfg.caseStatus}</span>
        </p>
        <p>Resolution: {cfg.resolution}</p>
      </div>

      <button onClick={onReset} className="text-sm text-blue-600 hover:underline">↺ Start New Case</button>
    </div>
  );
}
