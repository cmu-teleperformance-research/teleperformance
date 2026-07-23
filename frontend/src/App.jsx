import { useState, useEffect } from 'react';
import axios from "axios";
import API_BASE_URL from "./config";
import EntryPage from "./components/EntryPage";
import LoginPage from "./components/LoginPage";
import WelcomePage from "./components/WelcomePage";
import ModeSelector from "./components/ModeSelector";
import ChatWindow from "./components/ChatWindow";
import ReportPage from "./components/ReportPage";
import ProfilePage from "./components/ProfilePage";
import ResearchDashboard from "./components/ResearchDashboard";
import NavBar from "./components/NavBar";
import { CONDITIONS } from "./conditions";

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
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export default function App({ conditionId = null }) {
  const condition = conditionId ? CONDITIONS[conditionId] : null;

  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [username, setUsername] = useState(() => localStorage.getItem("username"));
  const [displayName, setDisplayName] = useState(() => localStorage.getItem("displayName"));
  const [role, setRole] = useState(() => localStorage.getItem("role") || "participant");
  const [sessionConfig, setSessionConfig] = useState(() => readStoredSession(conditionId));
  const [view, setView] = useState(() => {
    const stored = readStoredSession(conditionId);
    return stored ? "chat" : "landing";
  });
  const [preLoginView, setPreLoginView] = useState("welcome");
  const [report, setReport] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError] = useState(null);
  const [sessionExpiredMessage, setSessionExpiredMessage] = useState(null);

  // Persist experimental condition from the URL so it survives login / refresh
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
        setSessionConfig(null);
        setReport(null);
        setReportError(null);
        setView("landing");
      }
    } catch {
      // ignore corrupt storage
    }
  }, [conditionId]);

  function handleLogin(accessToken, user, name, userRole = "participant") {
    console.log("[DEBUG handleLogin] raw userRole arg:", userRole, "(undefined means caller dropped it)");
    localStorage.setItem("token", accessToken);
    localStorage.setItem("username", user);
    localStorage.setItem("displayName", name);
    localStorage.setItem("role", userRole);
    console.log("[DEBUG handleLogin] stored user:", { username: user, displayName: name, role: userRole });
    setToken(accessToken);
    setUsername(user);
    setDisplayName(name);
    setRole(userRole);
    // Condition routes land on the condition-specific WelcomePage first;
    // the default / route still goes straight to mode select after login.
    setView(conditionId ? "landing" : "mode-select");
  }

  function clearStoredSession() {
    const sessionId = localStorage.getItem("sessionId");
    if (sessionId) localStorage.removeItem(`messages_${sessionId}`);
    localStorage.removeItem("sessionId");
    localStorage.removeItem("sessionConfig");
  }

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    localStorage.removeItem("displayName");
    localStorage.removeItem("role");
    clearStoredSession();
    setToken(null);
    setUsername(null);
    setDisplayName(null);
    setRole("participant");
    setView("landing");
    setSessionConfig(null);
    setReport(null);
    setPreLoginView("welcome");
  }

  function handleAuthExpired() {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    localStorage.removeItem("displayName");
    localStorage.removeItem("role");
    // Keep sessionId + sessionConfig so session can be restored after re-login
    setToken(null);
    setUsername(null);
    setDisplayName(null);
    setRole("participant");
    setSessionConfig(null);
    setReport(null);
    setSessionExpiredMessage("Session expired. Please log in again.");
  }

  function handleModeSelect(config) {
    clearStoredSession();
    const configWithCondition = conditionId
      ? { ...config, condition: conditionId }
      : config;
    localStorage.setItem("sessionConfig", JSON.stringify(configWithCondition));
    setSessionConfig(configWithCondition);
    setView("chat");
  }

  function handleSessionStarted(id) {
    localStorage.setItem("sessionId", String(id));
  }

  function handleSessionRestoreFailed() {
    localStorage.removeItem("sessionId");
  }

  async function handleEndSession(messages, sessionId) {
    clearStoredSession();
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
          session_id: sessionId,
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

  function handleNewSession() {
    clearStoredSession();
    setSessionConfig(null);
    setReport(null);
    setReportError(null);
    setView("landing");
  }

  if (!token) {
    if (preLoginView === "welcome") {
      return (
        <WelcomePage
          onStart={() => setPreLoginView("entry")}
          title={condition?.title}
          description={condition?.description}
          what_to_expect={condition?.what_to_expect}
        />
      );
    }
    if (preLoginView === "login") {
      return (
        <LoginPage
          onLogin={(accessToken, user, name, roleArg) => {
            console.log("[DEBUG LoginPage onLogin callback] user:", user, "roleArg received:", roleArg, "roleArg passed to handleLogin:", roleArg);
            setSessionExpiredMessage(null);
            handleLogin(accessToken, user, name, roleArg);
          }}
          message={sessionExpiredMessage}
          onBack={() => setPreLoginView("entry")}
        />
      );
    }
    // preLoginView === "entry"
    return (
      <EntryPage
        onParticipantJoin={(accessToken, user, name, roleArg) => {
          setSessionExpiredMessage(null);
          handleLogin(accessToken, user, name, roleArg);
        }}
        onResearcherLogin={() => setPreLoginView("login")}
        onBack={() => setPreLoginView("welcome")}
        message={sessionExpiredMessage}
      />
    );
  }

  const isResearcher = role === "researcher";
  console.log("[DEBUG navProps] role:", role, "  isResearcher:", isResearcher, "  → Research button rendered:", isResearcher);
  const navProps = {
    displayName: displayName || username,
    onProfile: () => setView("profile"),
    onResearch: isResearcher ? () => setView("research") : undefined,
    onLogout: handleLogout,
  };

  if (view === "landing") {
    return (
      <WelcomePage
        onStart={() => setView("mode-select")}
        navProps={navProps}
        title={condition?.title}
        description={condition?.description}
        what_to_expect={condition?.what_to_expect}
      />
    );
  }

  if (view === "mode-select") {
    return <ModeSelector onSelect={handleModeSelect} navProps={navProps} />;
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
      return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
          <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
            <span className="font-semibold text-gray-800">CSR Simulator</span>
            <NavBar {...navProps} />
          </header>
          <div className="flex-1 flex flex-col items-center justify-center gap-4">
            <p className="text-red-500">{reportError}</p>
            <button
              onClick={handleNewSession}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
            >
              Back to Home
            </button>
          </div>
        </div>
      );
    }
    return (
      <ReportPage
        report={report}
        sessionConfig={sessionConfig}
        navProps={navProps}
        onNewSession={handleNewSession}
      />
    );
  }

  const chatConfig = conditionId
    ? { ...sessionConfig, condition: conditionId }
    : sessionConfig;

  return (
    <ChatWindow
      key={`${chatConfig.condition}-${chatConfig.scenario}-${chatConfig.persona}-${chatConfig.training}`}
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
