import { useState, useEffect, useRef } from 'react';
import axios from "axios";
import API_BASE_URL from "./config";
import WelcomePage from "./components/WelcomePage";
import ModeSelector from "./components/ModeSelector";
import ChatWindow from "./components/ChatWindow";
import ReportPage from "./components/ReportPage";
import ProfilePage from "./components/ProfilePage";
import NavBar from "./components/NavBar";

export default function ParticipantApp() {
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [username, setUsername] = useState(() => localStorage.getItem("username"));
  const [displayName, setDisplayName] = useState(() => localStorage.getItem("displayName"));
  const [role, setRole] = useState(() => localStorage.getItem("role") || "participant");
  const [provisionError, setProvisionError] = useState(null);
  const provisioning = useRef(false);

  const [sessionConfig, setSessionConfig] = useState(() => {
    try {
      const id = localStorage.getItem("sessionId");
      const raw = localStorage.getItem("sessionConfig");
      return (id && raw) ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });
  const [view, setView] = useState(() =>
    (localStorage.getItem("sessionId") && localStorage.getItem("sessionConfig")) ? "chat" : "landing"
  );
  const [report, setReport] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError] = useState(null);
  const [sessionExpiredMessage, setSessionExpiredMessage] = useState(null);

  // Auto-provision a participant session on first load. Refreshing the page
  // does not re-run this because `token` is already populated from
  // localStorage by the time this effect checks it.
  useEffect(() => {
    if (token || provisioning.current) return;
    provisioning.current = true;

    async function provision() {
      try {
        const params = new URLSearchParams(window.location.search);
        const urlPid = params.get("pid");
        // Reuse the existing PID (e.g. after a token expiry) rather than
        // minting a new one, so a participant's identity survives across
        // the same browser session even once the JWT itself has expired.
        const existingPid = urlPid ? urlPid.trim() : localStorage.getItem("username");
        const res = existingPid
          ? await axios.post(`${API_BASE_URL}/participant/join`, { pid: existingPid })
          : await axios.post(`${API_BASE_URL}/participant/new`);

        localStorage.setItem("token", res.data.access_token);
        localStorage.setItem("username", res.data.pid || res.data.name);
        localStorage.setItem("displayName", res.data.name);
        localStorage.setItem("role", res.data.role);
        setToken(res.data.access_token);
        setUsername(res.data.pid || res.data.name);
        setDisplayName(res.data.name);
        setRole(res.data.role);
        setSessionExpiredMessage(null);
      } catch (err) {
        setProvisionError("Unable to start a session. Please refresh the page to try again.");
      } finally {
        provisioning.current = false;
      }
    }
    provision();
  }, [token]);

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
  }

  function handleAuthExpired() {
    // Only clear the token, not the PID (username/displayName/role) — the
    // provisioning effect will silently re-join with the same PID to get a
    // fresh token, since a participant's identity has no password to re-enter.
    localStorage.removeItem("token");
    setToken(null);
    setSessionConfig(null);
    setReport(null);
    setSessionExpiredMessage("Reconnecting...");
  }

  function handleModeSelect(config) {
    clearStoredSession();
    localStorage.setItem("sessionConfig", JSON.stringify(config));
    setSessionConfig(config);
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
        },
        { headers: { "X-App-Token": token } }
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
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4 p-8">
        {provisionError ? (
          <p className="text-red-500 text-sm text-center max-w-sm">{provisionError}</p>
        ) : (
          <>
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-500 text-sm">{sessionExpiredMessage || "Starting your session..."}</p>
          </>
        )}
      </div>
    );
  }

  const navProps = {
    displayName: displayName || username,
    onProfile: () => setView("profile"),
    // Sign out is intentionally not wired here — participants are
    // auto-provisioned by PID, there's no session to sign out of.
  };

  if (view === "landing") {
    return (
      <WelcomePage
        onStart={() => setView("mode-select")}
        navProps={navProps}
      />
    );
  }

  if (view === "mode-select") {
    return <ModeSelector onSelect={handleModeSelect} navProps={navProps} />;
  }

  if (view === "profile") {
    return <ProfilePage token={token} role={role} navProps={navProps} onBack={() => setView("landing")} />;
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

  return (
    <ChatWindow
      key={`${sessionConfig.scenario}-${sessionConfig.persona}-${sessionConfig.training}`}
      sessionConfig={sessionConfig}
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
