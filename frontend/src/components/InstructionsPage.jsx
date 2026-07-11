import { useState, useEffect, useRef } from "react";
import axios from "axios";
import API_BASE_URL from "../config";
import NavBar from "./NavBar";

const SCENARIO_LABELS = {
  flight_cancellation: "Flight Cancellation",
  baggage_delay: "Lost Baggage",
  refund_request: "Refund Request",
};

// Matches the wording already used for these modes in ModeSelector.jsx.
const MODE_INFO = {
  training: {
    label: "Training Mode",
    explanation: "You'll receive explicit coaching feedback after each customer interaction, to support skill development and reflection as you go.",
  },
  evaluation: {
    label: "Evaluation Mode",
    explanation: "You won't get turn-by-turn coaching during the conversation — feedback is provided afterward, in your final report, to support reflection on your overall performance.",
  },
};

const SCENARIO_INSTRUCTIONS = {
  flight_cancellation:
    "You'll be speaking with a customer whose flight was cancelled due to weather. Practice de-escalating their frustration while navigating rebooking options and the compensation policy toward a resolution.",
  baggage_delay:
    "You'll be speaking with a customer whose checked bag has been missing for two days. Practice de-escalating their frustration while tracing the bag and arranging appropriate interim expenses.",
  refund_request:
    "You'll be speaking with a customer requesting a refund for a defected item. Practice de-escalating their urgency while setting clear expectations toward a resolution.",
};

export default function InstructionsPage({ token, navProps, onBegin, onAuthExpired }) {
  // Holds the full /start response once assignment resolves — nothing below
  // reads scenario/persona/training until this is non-null.
  const [assignment, setAssignment] = useState(null);
  const [error, setError] = useState(null);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    const controller = new AbortController();

    async function assign() {
      try {
        const response = await axios.post(
          `${API_BASE_URL}/start`,
          {},
          { headers: { "X-App-Token": token }, signal: controller.signal }
        );
        setAssignment({
          scenario: response.data.scenario,
          persona: response.data.persona,
          training: response.data.training,
          sessionId: response.data.session_id,
          customerResponse: response.data.customer_response,
        });
      } catch (err) {
        if (axios.isCancel(err)) return;
        if (err.response?.status === 401) { onAuthExpired(); return; }
        setError("Unable to start a session. Please try again.");
      }
    }
    assign();
    return () => controller.abort();
  }, []);

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4 p-8">
        <p className="text-red-500 text-sm text-center max-w-sm">{error}</p>
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4 p-8">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-500 text-sm">Preparing your session...</p>
      </div>
    );
  }

  const { scenario, training } = assignment;
  const scenarioLabel = SCENARIO_LABELS[scenario] || scenario;
  const mode = training ? MODE_INFO.training : MODE_INFO.evaluation;
  const scenarioInstructions = SCENARIO_INSTRUCTIONS[scenario] || "";

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
        <span className="font-semibold text-gray-800">CSR Simulator</span>
        {navProps && <NavBar {...navProps} />}
      </header>

      <main className="flex-1 flex items-center justify-center p-8">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-10 w-full max-w-lg space-y-6">
          <div className="text-center space-y-1">
            <h1 className="text-2xl font-bold text-gray-900">Your Session</h1>
            <p className="text-sm text-gray-500">Here's what to expect</p>
          </div>

          <div className="space-y-5">
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Scenario</p>
              <p className="text-base font-medium text-gray-800">{scenarioLabel}</p>
            </div>

            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Mode</p>
              <p className="text-base font-medium text-gray-800">{mode.label}</p>
              <p className="text-sm text-gray-600 mt-1 leading-relaxed">{mode.explanation}</p>
            </div>

            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">What you'll practice</p>
              <p className="text-sm text-gray-600 leading-relaxed">{scenarioInstructions}</p>
            </div>
          </div>

          <button
            onClick={() => onBegin(assignment)}
            className="w-full bg-blue-600 text-white py-3 rounded-lg text-sm font-medium hover:bg-blue-700 transition"
          >
            Begin
          </button>
        </div>
      </main>
    </div>
  );
}
