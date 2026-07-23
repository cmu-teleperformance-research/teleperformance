import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import App from "./App";
import ConditionHub from "./components/ConditionHub";
import { CONDITION_IDS } from "./conditions";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ConditionHub />} />
        {CONDITION_IDS.map((id) => (
          <Route key={id} path={`/${id}`} element={<App conditionId={id} />} />
        ))}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
