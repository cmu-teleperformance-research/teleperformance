export default function LoanCommunicate({ workflow, onReset }) {
  const cfg = workflow.screenConfigs[5];
  const firstName = cfg.customerName;
  const script = cfg.script;

  return (
    <div className="space-y-4">
      <h2 className="text-base font-semibold text-gray-800">{cfg.title}</h2>
      <div className="bg-amber-50 border-2 border-amber-400 rounded-xl p-5 space-y-3">
        <p className="text-xs font-bold uppercase tracking-wide text-amber-600">
          ↩ Switch to Chat tab — say this to {firstName}:
        </p>
        <p className="text-sm text-gray-800 leading-relaxed italic" style={{ whiteSpace: "pre-line" }}>
          {script}
        </p>
      </div>
      <div className="bg-white border border-gray-200 rounded-xl p-4 text-sm text-gray-600">
        <p className="font-semibold text-gray-700 mb-1">Case Summary</p>
        <p>
          Case #: <strong>{cfg.caseRef}</strong> | Status:{" "}
          <span className={`font-semibold ${cfg.caseStatus === "Closed" ? "text-green-700" : "text-yellow-600"}`}>
            {cfg.caseStatus}
          </span>
        </p>
        <p>Resolution: {cfg.resolution}</p>
      </div>
      <button onClick={onReset} className="text-sm text-blue-600 hover:underline">↺ Start New Case</button>
    </div>
  );
}
