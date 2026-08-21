import { useState, useEffect } from 'react';
import axios from "axios";
import API_BASE_URL from "./config";
import WelcomePage from "./components/WelcomePage";
import { buildPathForDomain } from "./components/ModeSelector";
import PathOverview from "./components/PathOverview";
import InstructionsModal from "./components/InstructionsModal";
import ChatWindow from "./components/ChatWindow";
import ReportPage from "./components/ReportPage";
import CompletionPage from "./components/CompletionPage";
import ProfilePage from "./components/ProfilePage";
import ResearchDashboard from "./components/ResearchDashboard";
import NavBar from "./components/NavBar";
import { CONDITIONS } from "./conditions";

function identityMatchesPid(pid) {
  return Boolean(pid && localStorage.getItem("username") === pid && localStorage.getItem("token"));
}

function readStoredSession(conditionId) {
  try {
    const id = localStorage.getItem("sessionId");
    const raw = localStorage.getItem("sessionConfig");
    if (!(id && raw)) return null;
    const parsed = JSON.parse(raw);
    // Drop sessions started under a different experimental condition
    if (conditionId && parsed.condition !== conditionId) {
      localStorage.removeItem(`messages_${id}`);
      localStorage.removeItem("sessionId");
      localStorage.removeItem("sessionConfig");
      localStorage.removeItem("trainingPath");
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function readStoredPath(conditionId) {
  try {
    const raw = localStorage.getItem("trainingPath");
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (conditionId && parsed.condition && parsed.condition !== conditionId) {
      localStorage.removeItem("trainingPath");
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function sessionConfigFromPath(path, index, conditionId) {
  const session = path.sessions[index];
  return {
    ...session,
    domain: path.domain,
    domainLabel: path.domainLabel,
    pathIndex: index,
    pathTotal: path.sessions.length,
    ...(conditionId ? { condition: conditionId } : {}),
  };
}

const joinInflight = { pid: null, promise: null };

export default function App({ conditionId = null, pid = null }) {
  const condition = conditionId ? CONDITIONS[conditionId] : null;
  const participantId = pid?.trim() || null;
  const knownParticipant = identityMatchesPid(participantId);

  const [token, setToken] = useState(() => (knownParticipant ? localStorage.getItem("token") : null));
  const [username, setUsername] = useState(() => (knownParticipant ? participantId : null));
  const [displayName, setDisplayName] = useState(() =>
    knownParticipant ? localStorage.getItem("displayName") || participantId : null
  );
  const [role, setRole] = useState(() =>
    knownParticipant ? localStorage.getItem("role") || "participant" : "participant"
  );
  const [sessionConfig, setSessionConfig] = useState(() =>
    knownParticipant ? readStoredSession(conditionId) : null
  );
  const [trainingPath, setTrainingPath] = useState(() =>
    knownParticipant ? readStoredPath(conditionId) : null
  );
  const [view, setView] = useState(() => {
    if (!knownParticipant) return "landing";
    const stored = readStoredSession(conditionId);
    return stored ? "chat" : "landing";
  });
  const [joining, setJoining] = useState(() => !knownParticipant);
  const [joinError, setJoinError] = useState(null);
  const [report, setReport] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError] = useState(null);
  const [reportSessionId, setReportSessionId] = useState(null);
  const [completion, setCompletion] = useState(null);
  const [completionLoading, setCompletionLoading] = useState(false);
  const [completionError, setCompletionError] = useState(null);
  const [assigning, setAssigning] = useState(false);
  const [assignError, setAssignError] = useState(null);
  const [showInstructions, setShowInstructions] = useState(false);

  // Persist experimental condition from the URL so it survives refresh
  useEffect(() => {
    if (conditionId) {
      localStorage.setItem("condition", conditionId);
    }
  }, [conditionId]);

  // Switching condition URLs should not resume a session from another condition
  useEffect(() => {
    try {
      const raw = localStorage.getItem("sessionConfig");
      if (!raw || !conditionId) return;
      const parsed = JSON.parse(raw);
      if (parsed.condition && parsed.condition !== conditionId) {
        const sessionId = localStorage.getItem("sessionId");
        if (sessionId) localStorage.removeItem(`messages_${sessionId}`);
        localStorage.removeItem("sessionId");
        localStorage.removeItem("sessionConfig");
        localStorage.removeItem("trainingPath");
        setSessionConfig(null);
        setTrainingPath(null);
        setReport(null);
        setReportSessionId(null);
        setReportError(null);
        setView("landing");
      }
    } catch {
      // ignore corrupt storage
    }
  }, [conditionId]);

  function applyIdentity(accessToken, user, name, userRole = "participant") {
    localStorage.setItem("token", accessToken);
    localStorage.setItem("username", user);
    localStorage.setItem("displayName", name);
    localStorage.setItem("role", userRole);
    setToken(accessToken);
    setUsername(user);
    setDisplayName(name);
    setRole(userRole);
  }

  function clearStoredChat() {
    const sessionId = localStorage.getItem("sessionId");
    if (sessionId) localStorage.removeItem(`messages_${sessionId}`);
    localStorage.removeItem("sessionId");
    localStorage.removeItem("sessionConfig");
  }

  function clearTrainingPath() {
    localStorage.removeItem("trainingPath");
    setTrainingPath(null);
  }

  function clearStoredSession() {
    clearStoredChat();
    clearTrainingPath();
  }

  async function joinWithPid(cleanPid) {
    if (joinInflight.pid === cleanPid && joinInflight.promise) {
      return joinInflight.promise;
    }
    const promise = axios
      .post(`${API_BASE_URL}/participant/join`, { pid: cleanPid })
      .then((res) => ({
        accessToken: res.data.access_token,
        name: res.data.name,
        role: res.data.role,
      }))
      .finally(() => {
        if (joinInflight.promise === promise) {
          joinInflight.pid = null;
          joinInflight.promise = null;
        }
      });
    joinInflight.pid = cleanPid;
    joinInflight.promise = promise;
    return promise;
  }

  function handleAuthExpired() {
    if (!participantId) return;
    joinWithPid(participantId)
      .then(({ accessToken, name, role: userRole }) => {
        applyIdentity(accessToken, participantId, name, userRole);
      })
      .catch(() => {
        setToken(null);
        setJoining(false);
        setJoinError("Session expired. Reload the page to continue.");
      });
  }

  function startPathSession(path, index) {
    const config = sessionConfigFromPath(path, index, conditionId);
    localStorage.setItem("sessionConfig", JSON.stringify(config));
    setSessionConfig(config);
    setView("chat");
  }

  function handleModeSelect({ domain, domainLabel, sessions }) {
    clearStoredChat();
    const path = {
      domain,
      domainLabel,
      sessions,
      index: 0,
      ...(conditionId ? { condition: conditionId } : {}),
    };
    localStorage.setItem("trainingPath", JSON.stringify(path));
    setTrainingPath(path);
    setReport(null);
    setReportSessionId(null);
    setReportError(null);
    setShowInstructions(false);
    setView("path-overview");
  }

  async function handleStartTraining() {
    setAssignError(null);
    setAssigning(true);
    try {
      const res = await axios.post(
        `${API_BASE_URL}/assign-domain`,
        { condition: conditionId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      handleModeSelect(buildPathForDomain(res.data.domain));
    } catch (err) {
      if (err.response?.status === 401) {
        handleAuthExpired();
        return;
      }
      const detail = err.response?.data?.detail;
      setAssignError(typeof detail === "string" ? detail : "Could not assign a domain. Please try again.");
    } finally {
      setAssigning(false);
    }
  }

  function handleSessionStarted(id) {
    localStorage.setItem("sessionId", String(id));
  }

  function handleSessionRestoreFailed() {
    localStorage.removeItem("sessionId");
  }

  async function handleEndSession(messages, sessionId) {
    // Clear chat restore keys; keep React sessionConfig + trainingPath for the report / continue flow
    const sid = sessionId || localStorage.getItem("sessionId");
    if (sid) localStorage.removeItem(`messages_${sid}`);
    localStorage.removeItem("sessionId");
    localStorage.removeItem("sessionConfig");
    setReportSessionId(sid || null);
    setReportLoading(true);
    setReportError(null);
    setView("report");
    try {
      const response = await axios.post(
        `${API_BASE_URL}/report`,
        {
          scenario: sessionConfig.scenario,
          persona: sessionConfig.persona,
          training: sessionConfig.training,
          history: messages,
          session_id: sid,
          ...(conditionId ? { condition: conditionId } : {}),
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setReport(response.data);
    } catch (err) {
      if (err.response?.status === 401) {
        handleAuthExpired();
        return;
      }
      setReportError("Failed to generate report. Please try again.");
    } finally {
      setReportLoading(false);
    }
  }

  function handleContinuePath() {
    if (!trainingPath) {
      handleFinishPath();
      return;
    }
    const nextIndex = (trainingPath.index ?? 0) + 1;
    if (nextIndex >= trainingPath.sessions.length) {
      handleFinishPath();
      return;
    }
    const updated = { ...trainingPath, index: nextIndex };
    localStorage.setItem("trainingPath", JSON.stringify(updated));
    setTrainingPath(updated);
    setReport(null);
    setReportSessionId(null);
    setReportError(null);
    clearStoredChat();
    startPathSession(updated, nextIndex);
  }

  async function handleFinishPath() {
    const domain = trainingPath?.domain ?? sessionConfig?.domain ?? null;
    clearStoredSession();
    setSessionConfig(null);
    setReport(null);
    setReportSessionId(null);
    setReportError(null);
    setCompletion(null);
    setCompletionError(null);
    setCompletionLoading(true);
    setView("completion");

    try {
      const response = await axios.post(
        `${API_BASE_URL}/complete-path`,
        {
          ...(conditionId ? { condition: conditionId } : {}),
          ...(domain ? { domain } : {}),
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setCompletion(response.data);
    } catch (err) {
      if (err.response?.status === 401) {
        handleAuthExpired();
        return;
      }
      const detail = err.response?.data?.detail;
      setCompletionError(
        typeof detail === "string"
          ? detail
          : "Could not generate a completion code. Please try again or contact the research team."
      );
    } finally {
      setCompletionLoading(false);
    }
  }

  function handleGoHome() {
    clearStoredSession();
    setSessionConfig(null);
    setTrainingPath(null);
    setReport(null);
    setReportSessionId(null);
    setReportError(null);
    setCompletion(null);
    setCompletionError(null);
    setCompletionLoading(false);
    setShowInstructions(false);
    setView("landing");
  }

  function handleCompletionDone() {
    handleGoHome();
  }

  useEffect(() => {
    if (!participantId) {
      setJoining(false);
      setJoinError("A participant ID is required in the URL.");
      return;
    }

    if (identityMatchesPid(participantId)) {
      setJoining(false);
      setJoinError(null);
      return;
    }

    let cancelled = false;
    clearStoredSession();
    setSessionConfig(null);
    setReport(null);
    setReportSessionId(null);
    setView("landing");
    setJoining(true);
    setJoinError(null);

    joinWithPid(participantId)
      .then(({ accessToken, name, role: userRole }) => {
        if (cancelled) return;
        applyIdentity(accessToken, participantId, name, userRole);
        setView("landing");
      })
      .catch((err) => {
        if (cancelled) return;
        const detail = err.response?.data?.detail;
        setJoinError(typeof detail === "string" ? detail : "Unable to start. Please try again.");
      })
      .finally(() => {
        if (!cancelled) setJoining(false);
      });

    return () => {
      cancelled = true;
    };
  }, [participantId]);

  if (!token) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4 px-6">
        {joining && !joinError && (
          <>
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-600 font-medium">
              Starting session{participantId ? ` for ${participantId}` : ""}...
            </p>
          </>
        )}
        {joinError && (
          <div className="text-center space-y-4 max-w-sm">
            <p className="text-red-500">{joinError}</p>
            {participantId && (
              <button
                type="button"
                onClick={() => {
                  setJoining(true);
                  setJoinError(null);
                  joinWithPid(participantId)
                    .then(({ accessToken, name, role: userRole }) => {
                      applyIdentity(accessToken, participantId, name, userRole);
                      setView("landing");
                    })
                    .catch((err) => {
                      const detail = err.response?.data?.detail;
                      setJoinError(typeof detail === "string" ? detail : "Unable to start. Please try again.");
                    })
                    .finally(() => setJoining(false));
                }}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
              >
                Try again
              </button>
            )}
          </div>
        )}
      </div>
    );
  }

  const isResearcher = role === "researcher";
  const navProps = {
    displayName: displayName || username || participantId,
    onProfile: () => setView("profile"),
    onResearch: isResearcher ? () => setView("research") : undefined,
  };

  if (view === "landing") {
    return (
      <WelcomePage
        onStart={handleStartTraining}
        navProps={navProps}
        title={condition?.title}
        description={condition?.description}
        what_to_expect={condition?.what_to_expect}
        startLoading={assigning}
        startError={assignError}
      />
    );
  }

  if (view === "path-overview" && trainingPath) {
    return (
      <>
        <PathOverview
          domainLabel={trainingPath.domainLabel}
          sessions={trainingPath.sessions}
          navProps={navProps}
          onNext={() => setShowInstructions(true)}
        />
        {showInstructions && (
          <InstructionsModal
            onBegin={() => {
              setShowInstructions(false);
              startPathSession(trainingPath, 0);
            }}
          />
        )}
      </>
    );
  }

  if (view === "completion") {
    return (
      <CompletionPage
        completion={completion}
        error={completionError}
        loading={completionLoading}
        navProps={navProps}
        onDone={handleCompletionDone}
      />
    );
  }

  if (view === "profile") {
    return <ProfilePage token={token} role={role} navProps={navProps} onBack={() => setView("landing")} />;
  }

  if (view === "research") {
    if (role !== "researcher") {
      setView("landing");
      return null;
    }
    return <ResearchDashboard token={token} navProps={navProps} onBack={() => setView("landing")} />;
  }

  if (view === "report") {
    if (reportLoading) {
      return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
          <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
            <span className="font-semibold text-gray-800">CSR Simulator</span>
            <NavBar {...navProps} />
          </header>
          <div className="flex-1 flex flex-col items-center justify-center gap-4">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-600 font-medium">Generating your performance report...</p>
            <p className="text-sm text-gray-400">This may take 15–20 seconds</p>
          </div>
        </div>
      );
    }
    if (reportError) {
      const hasNext = trainingPath && (trainingPath.index ?? 0) + 1 < trainingPath.sessions.length;
      return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
          <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
            <span className="font-semibold text-gray-800">CSR Simulator</span>
            <NavBar {...navProps} />
          </header>
          <div className="flex-1 flex flex-col items-center justify-center gap-4">
            <p className="text-red-500">{reportError}</p>
            <button
              onClick={hasNext ? handleContinuePath : handleGoHome}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
            >
              {hasNext ? "Continue to Next Scenario" : "Back to Home"}
            </button>
          </div>
        </div>
      );
    }
    const pathIndex = trainingPath?.index ?? sessionConfig?.pathIndex ?? 0;
    const pathTotal = trainingPath?.sessions?.length ?? sessionConfig?.pathTotal ?? 1;
    const hasNextSession = pathIndex + 1 < pathTotal;
    return (
      <ReportPage
        key={reportSessionId || `${sessionConfig?.scenario}-${pathIndex}`}
        report={report}
        sessionConfig={sessionConfig}
        navProps={navProps}
        pathIndex={pathIndex}
        pathTotal={pathTotal}
        hasNextSession={hasNextSession}
        onContinue={hasNextSession ? handleContinuePath : handleFinishPath}
        sessionId={reportSessionId}
        token={token}
        onAuthExpired={handleAuthExpired}
        conditionId={conditionId}
      />
    );
  }

  const chatConfig = conditionId
    ? { ...sessionConfig, condition: conditionId }
    : sessionConfig;

  return (
    <ChatWindow
      key={`${chatConfig.condition}-${chatConfig.pathIndex}-${chatConfig.scenario}-${chatConfig.persona}-${chatConfig.training}`}
      sessionConfig={chatConfig}
      token={token}
      navProps={navProps}
      onEndSession={handleEndSession}
      onAuthExpired={handleAuthExpired}
      storedSessionId={localStorage.getItem("sessionId")}
      onSessionStarted={handleSessionStarted}
      onSessionRestoreFailed={handleSessionRestoreFailed}
    />
  );
}
