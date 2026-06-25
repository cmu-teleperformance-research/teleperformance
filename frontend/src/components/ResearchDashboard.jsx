import { useState, useEffect } from "react";
import axios from "axios";
import API_BASE_URL from "../config";
import NavBar from "./NavBar";
import { TurnFeedbackCard } from "./FeedbackPanel";

const PERSONA_EMOJIS = {
  angry: "😡",
  confused: "😕",
  demanding: "😤",
  anxious: "😰",
};

function SessionDetail({ session, onBack }) {
  const { messages = [], report } = session;
  const coaching = report?.session_coaching;
  const modeLabel = session.training ? "Explicit Feedback" : "Implicit Feedback";

  const turns = [];
  let i = 0;
  let turnNum = 1;
  while (i < messages.length) {
    const turn = { num: turnNum };
    if (i < messages.length && messages[i].role === "assistant") {
      turn.customer = messages[i].content;
      i++;
    }
    if (i < messages.length && messages[i].role === "user") {
      turn.csr = messages[i].content;
      turn.feedback = messages[i].feedback;
      i++;
    }
    if (turn.customer || turn.csr) {
      turns.push(turn);
      turnNum++;
    }
  }

  return (
    <div className="space-y-6">
      <button onClick={onBack} className="text-sm text-blue-600 hover:underline">
        ← Back to sessions
      </button>

      {/* Session overview */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Session Overview</h2>
        <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
          <div><span className="text-gray-500">Session ID:</span> <span className="font-medium text-gray-800">{session.id}</span></div>
          <div><span className="text-gray-500">Participant:</span> <span className="font-medium text-gray-800">{session.display_name} (@{session.username})</span></div>
          <div><span className="text-gray-500">Scenario:</span> <span className="font-medium text-gray-800">{session.scenario_label}</span></div>
          <div><span className="text-gray-500">Persona:</span> <span className="font-medium text-gray-800">{PERSONA_EMOJIS[session.persona]} {session.persona}</span></div>
          <div><span className="text-gray-500">Mode:</span> <span className="font-medium text-gray-800">{modeLabel}</span></div>
          <div><span className="text-gray-500">Date:</span> <span className="font-medium text-gray-800">{new Date(session.created_at).toLocaleString()}</span></div>
        </div>
      </div>

      {/* Session coaching */}
      {coaching && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <h3 className="font-semibold text-gray-800">Session Coaching</h3>
          {coaching.overallPerformance && (
            <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3">{coaching.overallPerformance}</p>
          )}
          {coaching.keepDoing && (
            <div>
              <p className="text-xs font-semibold text-green-700 uppercase tracking-wide mb-1">Keep Doing</p>
              <p className="text-sm text-gray-700 bg-green-50 rounded-lg p-3">{coaching.keepDoing}</p>
            </div>
          )}
          {coaching.keyPatternToImprove && (
            <div>
              <p className="text-xs font-semibold text-yellow-700 uppercase tracking-wide mb-1">Pattern to Improve</p>
              <p className="text-sm text-gray-700 bg-yellow-50 rounded-lg p-3">{coaching.keyPatternToImprove}</p>
            </div>
          )}
          {coaching.actionableImprovement && (
            <div>
              <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-1">Actionable Improvement</p>
              <p className="text-sm text-gray-700 bg-blue-50 rounded-lg p-3">{coaching.actionableImprovement}</p>
            </div>
          )}
          {coaching.encouragement && (
            <p className="text-sm text-gray-500 italic">{coaching.encouragement}</p>
          )}
        </div>
      )}

      {/* Conversation timeline */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-800 mb-6">Conversation Timeline</h3>
        <div className="space-y-6">
          {turns.map((turn) => (
            <div key={turn.num} className="border border-gray-100 rounded-xl overflow-hidden">
              <div className="bg-gray-50 px-4 py-2 border-b border-gray-100">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Turn {turn.num}
                </span>
              </div>

              {turn.customer && (
                <div className="px-4 py-3 border-b border-gray-100">
                  <p className="text-xs font-semibold text-gray-500 mb-1">Customer</p>
                  <p className="text-sm text-gray-800">{turn.customer}</p>
                </div>
              )}

              {turn.csr && (
                <div className="px-4 py-3 bg-blue-50 border-b border-gray-100">
                  <p className="text-xs font-semibold text-blue-600 mb-1">CSR</p>
                  <p className="text-sm text-gray-800">{turn.csr}</p>
                </div>
              )}

              {turn.feedback && (
                <div className="px-4 py-3 bg-amber-50/50">
                  <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-3">
                    Turn Feedback
                  </p>
                  <TurnFeedbackCard feedback={turn.feedback} />
                </div>
              )}

              {turn.csr && !turn.feedback && (
                <div className="px-4 py-3 bg-gray-50">
                  <p className="text-xs text-gray-400 italic">No feedback recorded for this turn.</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function ResearchDashboard({ token, navProps, onBack }) {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    axios.get(`${API_BASE_URL}/research/sessions`, { headers })
      .then(r => setSessions(r.data))
      .finally(() => setLoading(false));
  }, []);

  async function loadSession(id) {
    setDetailLoading(true);
    setSelectedId(id);
    try {
      const r = await axios.get(`${API_BASE_URL}/research/sessions/${id}`, { headers });
      setDetail(r.data);
    } finally {
      setDetailLoading(false);
    }
  }

  if (detail && selectedId) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="text-sm text-gray-500 hover:text-gray-800 transition">← Back</button>
            <h1 className="font-bold text-gray-900 text-lg">Research Dashboard</h1>
          </div>
          <NavBar {...navProps} />
        </header>
        <div className="max-w-3xl mx-auto p-8">
          <SessionDetail session={detail} onBack={() => { setSelectedId(null); setDetail(null); }} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="text-sm text-gray-500 hover:text-gray-800 transition">← Back</button>
          <h1 className="font-bold text-gray-900 text-lg">Research Dashboard</h1>
        </div>
        <NavBar {...navProps} />
      </header>

      <div className="max-w-4xl mx-auto p-8">
        <p className="text-sm text-gray-500 mb-6">
          All sessions across participants. Select a session to view the full conversation and turn-level evaluations.
        </p>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : sessions.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-12">No sessions found.</p>
        ) : (
          <div className="space-y-3">
            {sessions.map(s => (
              <button
                key={s.id}
                onClick={() => loadSession(s.id)}
                className="w-full bg-white rounded-xl border border-gray-200 p-5 text-left hover:border-blue-300 hover:shadow-sm transition flex items-center gap-4"
              >
                <span className="text-2xl flex-shrink-0">{PERSONA_EMOJIS[s.persona]}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900">
                    {s.scenario_label}
                    <span className="ml-2 text-xs font-normal text-gray-400">#{s.id}</span>
                  </p>
                  <p className="text-sm text-gray-500">
                    {s.display_name} (@{s.username})
                    {" · "}
                    {s.persona}
                    {" · "}
                    {s.training ? "Explicit Feedback" : "Implicit Feedback"}
                    {" · "}
                    {new Date(s.created_at).toLocaleDateString()}
                  </p>
                </div>
                {s.has_report ? (
                  <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full flex-shrink-0">Report</span>
                ) : (
                  <span className="text-xs text-gray-400 flex-shrink-0">No report</span>
                )}
                {detailLoading && selectedId === s.id && (
                  <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin flex-shrink-0" />
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
