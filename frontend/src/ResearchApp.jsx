import { useState } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import LoginPage from "./components/LoginPage";
import ResearchDashboard from "./components/ResearchDashboard";

// Fully independent from ParticipantApp's auth state — separate localStorage
// keys so a researcher session never collides with a participant session in
// the same browser.
export default function ResearchApp() {
  const [token, setToken] = useState(() => localStorage.getItem("researcherToken"));
  const [role, setRole] = useState(() => localStorage.getItem("researcherRole"));
  const [displayName, setDisplayName] = useState(() => localStorage.getItem("researcherDisplayName"));
  const [loginMessage, setLoginMessage] = useState(null);
  const navigate = useNavigate();

  function handleLogin(accessToken, user, name, userRole) {
    if (userRole !== "researcher") {
      setLoginMessage("This account does not have researcher access.");
      return;
    }
    localStorage.setItem("researcherToken", accessToken);
    localStorage.setItem("researcherRole", userRole);
    localStorage.setItem("researcherDisplayName", name);
    setToken(accessToken);
    setRole(userRole);
    setDisplayName(name);
    setLoginMessage(null);
    navigate("/research");
  }

  function handleLogout() {
    localStorage.removeItem("researcherToken");
    localStorage.removeItem("researcherRole");
    localStorage.removeItem("researcherDisplayName");
    setToken(null);
    setRole(null);
    setDisplayName(null);
    navigate("/research/login");
  }

  const isResearcher = Boolean(token && role === "researcher");

  return (
    <Routes>
      <Route
        path="login"
        element={
          isResearcher
            ? <Navigate to="/research" replace />
            : <LoginPage onLogin={handleLogin} message={loginMessage} />
        }
      />
      <Route
        path=""
        element={
          isResearcher
            ? (
              <ResearchDashboard
                token={token}
                navProps={{ displayName, onLogout: handleLogout }}
                onBack={handleLogout}
              />
            )
            : <Navigate to="/research/login" replace />
        }
      />
      <Route path="*" element={<Navigate to="/research" replace />} />
    </Routes>
  );
}
