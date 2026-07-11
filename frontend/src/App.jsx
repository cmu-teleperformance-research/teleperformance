import { BrowserRouter, Routes, Route } from "react-router-dom";
import ParticipantApp from "./ParticipantApp";
import ResearchApp from "./ResearchApp";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/research/*" element={<ResearchApp />} />
        <Route path="/*" element={<ParticipantApp />} />
      </Routes>
    </BrowserRouter>
  );
}
