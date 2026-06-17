export default function FlightCommunicate({ onReset, workflow }) {
  const sc = workflow.screens.communicate;
  const statusColor = sc.caseStatus === "Closed" ? "text-green-700" : "text-yellow-600";

  return (
    <div className="space-y-4">
      <h2 className="text-base font-semibold text-gray-800">Case Resolved</h2>

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
