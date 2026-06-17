export default function CaseOutcomeSelector({ outcome, onSelect }) {
  return (
    <div className="border border-gray-200 rounded-xl p-4 bg-gray-50 space-y-3">
      <p className="text-sm font-semibold text-gray-700">Case Outcome</p>
      <div className="flex gap-3">
        <button
          onClick={() => onSelect("resolved")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition ${
            outcome === "resolved"
              ? "bg-green-50 border-green-400 text-green-800"
              : "bg-white border-gray-300 text-gray-700 hover:border-gray-400"
          }`}
        >
          ✅ Resolved
        </button>
        <button
          onClick={() => onSelect("not_resolved")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition ${
            outcome === "not_resolved"
              ? "bg-red-50 border-red-400 text-red-800"
              : "bg-white border-gray-300 text-gray-700 hover:border-gray-400"
          }`}
        >
          ❌ Not Resolved
        </button>
      </div>
    </div>
  );
}
