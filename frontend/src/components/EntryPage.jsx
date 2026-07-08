import { useState, useEffect } from "react";
import axios from "axios";
import API_BASE_URL from "../config";

export default function EntryPage({ onParticipantJoin, onResearcherLogin, onBack, message }) {
  const [pid, setPid] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Support ?pid=P001 URL parameter for future automated entry
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlPid = params.get("pid");
    if (urlPid) {
      joinWithPid(urlPid);
    }
  }, []);

  async function joinWithPid(participantId) {
    const cleanPid = participantId.trim();
    if (!cleanPid) return;
    setLoading(true);
    setError(null);
    try {
      const res = await axios.post(`${API_BASE_URL}/participant/join`, { pid: cleanPid });
      onParticipantJoin(res.data.access_token, res.data.name, res.data.name, res.data.role);
    } catch (err) {
      setError(err.response?.data?.detail || "Unable to continue. Please try again.");
      setLoading(false);
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    joinWithPid(pid);
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-10 w-full max-w-sm space-y-8">
        {onBack && (
          <button
            onClick={onBack}
            className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-700 transition"
          >
            ← Back
          </button>
        )}
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">CSR Simulator</h1>
        </div>

        {message && (
          <div className="bg-amber-50 border border-amber-300 text-amber-800 text-sm rounded-lg px-4 py-3 text-center">
            {message}
          </div>
        )}

        {/* Participant section */}
        <div className="space-y-4">
          <h2 className="text-base font-semibold text-gray-800">Participant Study</h2>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">Participant ID</label>
              <input
                type="text"
                value={pid}
                onChange={e => setPid(e.target.value)}
                placeholder="e.g. P001"
                required
                autoFocus
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <button
              type="submit"
              disabled={loading || !pid.trim()}
              className="w-full bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition disabled:opacity-50"
            >
              {loading ? "Continuing..." : "Continue"}
            </button>
          </form>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="flex-1 border-t border-gray-200" />
          <span className="text-xs text-gray-400">or</span>
          <div className="flex-1 border-t border-gray-200" />
        </div>

        {/* Researcher section */}
        <button
          onClick={onResearcherLogin}
          className="w-full border border-gray-300 text-gray-700 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition"
        >
          Researcher Login
        </button>
      </div>
    </div>
  );
}
