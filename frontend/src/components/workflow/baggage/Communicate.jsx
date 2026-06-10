export default function BaggageCommunicate({ onReset, workflow }) {
  const sc = workflow.screens.communicate;
  const statusColor = sc.caseStatus === "Closed" ? "text-green-700" : "text-yellow-600";

  return (
    <div className="space-y-4">
      <h2 className="text-base font-semibold text-gray-800">Case Updated — Communicate to Passenger</h2>

      <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Cover in your response</p>
        <ul className="space-y-2">
          {sc.coaching.items.map((item, i) => (
            <li key={i} className="flex items-start gap-2.5 text-sm text-gray-700">
              <span className="mt-0.5 w-4 h-4 flex-shrink-0 rounded border-2 border-gray-300" />
              {item}
            </li>
          ))}
        </ul>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
        <p className="text-xs font-medium text-blue-700">
          ↩ Return to Chat — respond in your own words using the points above.
        </p>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-4 text-sm text-gray-600">
        <p className="font-semibold text-gray-700 mb-1">Case Summary</p>
        <p>
          Case #: <strong>{sc.caseNumber}</strong> | Status:{" "}
          <span className={`font-semibold ${statusColor}`}>{sc.caseStatus}</span>
        </p>
        <p>Resolution: {sc.resolution}</p>
      </div>

      <button onClick={onReset} className="text-sm text-blue-600 hover:underline">↺ Start New Case</button>
    </div>
  );
}
