import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CONDITIONS, CONDITION_IDS } from "../conditions";

export default function ConditionHub() {
  const navigate = useNavigate();
  const [pid, setPid] = useState("");
  const [error, setError] = useState(null);

  function goToCondition(id) {
    const cleanPid = pid.trim();
    if (!cleanPid) {
      setError("Enter a participant ID first.");
      return;
    }
    setError(null);
    navigate(`/${id}/${encodeURIComponent(cleanPid)}`);
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-200 px-6 py-3">
        <span className="font-semibold text-gray-800">CSR Simulator</span>
      </header>

      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md space-y-8">
          <div className="space-y-2 text-center">
            <h1 className="text-2xl font-bold text-gray-900">Select a condition</h1>
            <p className="text-sm text-gray-600">
              Enter a participant ID, then choose a study condition. Data is stored under that ID.
            </p>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Participant ID</label>
            <input
              type="text"
              value={pid}
              onChange={(e) => {
                setPid(e.target.value);
                if (error) setError(null);
              }}
              placeholder="e.g. P001"
              autoFocus
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {error && <p className="text-sm text-red-500">{error}</p>}
          </div>

          <nav className="space-y-3">
            {CONDITION_IDS.map((id) => {
              const cond = CONDITIONS[id];
              const preview = pid.trim() ? `/${id}/${pid.trim()}` : `/${id}/:pid`;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => goToCondition(id)}
                  className="flex items-center justify-between w-full bg-white border border-gray-200 rounded-lg px-5 py-4 text-left hover:border-blue-400 hover:bg-blue-50 transition"
                >
                  <span className="font-medium text-gray-800">{cond.label}</span>
                  <span className="text-sm text-gray-400">{preview}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </main>
    </div>
  );
}
