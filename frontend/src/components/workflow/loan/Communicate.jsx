export default function LoanCommunicate({ workflow, onReset }) {
  const cfg = workflow.screenConfigs[5];
  const statusColor = cfg.caseStatus === "Closed" ? "text-green-700" : "text-yellow-600";

  return (
    <div className="space-y-4">
      <h2 className="text-base font-semibold text-gray-800">{cfg.title}</h2>

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
