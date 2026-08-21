import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate, useParams } from "react-router-dom";
import App from "./App";
import ConditionHub from "./components/ConditionHub";
import { CONDITION_IDS } from "./conditions";
import "./index.css";

function ConditionApp({ conditionId }) {
  const { pid } = useParams();
  return <App conditionId={conditionId} pid={pid} />;
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ConditionHub />} />
        {CONDITION_IDS.map((id) => (
          <Route key={id} path={`/${id}/:pid`} element={<ConditionApp conditionId={id} />} />
        ))}
        {CONDITION_IDS.map((id) => (
          <Route key={`${id}-nopid`} path={`/${id}`} element={<Navigate to="/" replace />} />
        ))}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
