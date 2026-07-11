import { useState, useEffect, useRef } from 'react';
import axios from "axios";
import API_BASE_URL from "./config";
import WelcomePage from "./components/WelcomePage";
import ChatWindow from "./components/ChatWindow";
import ReportPage from "./components/ReportPage";
import ProfilePage from "./components/ProfilePage";
import NavBar from "./components/NavBar";

export default function ParticipantApp() {
  const [token, setToken] = useState(() => sessionStorage.getItem("token"));
  const [username, setUsername] = useState(() => sessionStorage.getItem("username"));
  const [displayName, setDisplayName] = useState(() => sessionStorage.getItem("displayName"));
  const [role, setRole] = useState(() => sessionStorage.getItem("role") || "participant");
  const [provisionError, setProvisionError] = useState(null);
  const provisioning = useRef(false);

  const [sessionConfig, setSessionConfig] = useState(() => {
    try {
      const id = sessionStorage.getItem("sessionId");
      const raw = sessionStorage.getItem("sessionConfig");
      return (id && raw) ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });
  const [view, setView] = useState(() =>
    (sessionStorage.getItem("sessionId") && sessionStorage.getItem("sessionConfig")) ? "chat" : "landing"
  );
  const [report, setReport] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError] = useState(null);
  const [sessionExpiredMessage, setSessionExpiredMessage] = useState(null);

  // Auto-provision a participant session on first load. Refreshing the page
  // does not re-run this because `token` is already populated from
  // sessionStorage by the time this effect checks it.
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
        const existingPid = urlPid ? urlPid.trim() : sessionStorage.getItem("username");
        const res = existingPid
          ? await axios.post(`${API_BASE_URL}/participant/join`, { pid: existingPid })
          : await axios.post(`${API_BASE_URL}/participant/new`);

        sessionStorage.setItem("token", res.data.access_token);
        sessionStorage.setItem("username", res.data.pid || res.data.name);
        sessionStorage.setItem("displayName", res.data.name);
        sessionStorage.setItem("role", res.data.role);
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
    const sessionId = sessionStorage.getItem("sessionId");
    if (sessionId) sessionStorage.removeItem(`messages_${sessionId}`);
    sessionStorage.removeItem("sessionId");
    sessionStorage.removeItem("sessionConfig");
  }

  function handleLogout() {
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("username");
    sessionStorage.removeItem("displayName");
    sessionStorage.removeItem("role");
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
    sessionStorage.removeItem("token");
    setToken(null);
    setSessionConfig(null);
    setReport(null);
    setSessionExpiredMessage("Reconnecting...");
  }

  // The backend assigns scenario/persona/mode (see /start) — this just
  // records what it decided so refreshes and /report can use the same
  // values without re-asking the backend or letting the frontend choose.
  function handleSessionAssigned(config) {
    sessionStorage.setItem("sessionConfig", JSON.stringify(config));
    setSessionConfig(config);
  }

  function handleSessionStarted(id) {
    sessionStorage.setItem("sessionId", String(id));
  }

  function handleSessionRestoreFailed() {
    sessionStorage.removeItem("sessionId");
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
        onStart={() => setView("chat")}
        navProps={navProps}
      />
    );
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
      // sessionConfig is null until the backend assigns scenario/persona/mode
      // (see onSessionAssigned) — there's only one entry point into chat now,
      // so a stable key is enough; no need to key off scenario/persona/mode.
      key="active-session"
      sessionConfig={sessionConfig}
      token={token}
      navProps={navProps}
      onEndSession={handleEndSession}
      onAuthExpired={handleAuthExpired}
      onSessionAssigned={handleSessionAssigned}
      storedSessionId={sessionStorage.getItem("sessionId")}
      onSessionStarted={handleSessionStarted}
      onSessionRestoreFailed={handleSessionRestoreFailed}
    />
  );
}
