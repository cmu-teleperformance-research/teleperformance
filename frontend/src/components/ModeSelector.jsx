import { useState } from "react";
import NavBar from "./NavBar";

// ─── DOMAIN / SCENARIO CONFIG ─────────────────────────────────────────────────
const DOMAINS = [
  {
    id: "travel",
    label: "Travel",
    icon: "✈️",
    available: true,
    scenarios: [
      {
        id: "flight_cancellation",
        label: "Flight Cancellation",
        description: "Handle a passenger whose flight was cancelled due to weather. Navigate rebooking options and compensation policy.",
      },
      {
        id: "baggage_delay",
        label: "Lost Baggage",
        description: "Assist a passenger whose checked bag has been missing for two days. Trace the bag and arrange interim expenses.",
      },
      {
        id: "book_flight",
        label: "Book Flight",
        description: "Help a customer search available flights, compare options, choose seats, add baggage, and complete a new booking while answering questions about pricing and travel policies.",
      },
    ],
  },
  {
    id: "retail",
    label: "Retail",
    icon: "💰",
    available: true,
    scenarios: [
      {
        id: "refund_request",
        label: "Refund Request",
        description: "Help a customer requesting a refund for a failed or incorrect financial transaction. Address urgency and set expectations.",
      },
      {
        id: "package_never_arrived",
        label: "Package Never Arrived",
        description: "Help a customer whose package shows as delivered or has been delayed but never arrived. Investigate shipment status, verify delivery details, explain replacement and refund policies, and resolve the issue.",
      },
      {
        id: "exchange_item",
        label: "Exchange Item",
        description: "Help a customer exchange a recently purchased item for a different size, color, or model while explaining eligibility, inventory availability, shipping timelines, and exchange policies.",
      },
    ],
  },
  {
    id: "services",
    label: "Services",
    icon: "🛠️",
    available: false,
    scenarios: [],
    comingSoon: true,
  },
];

const PERSONAS = [
  {
    id: "angry",
    label: "Angry",
    emoji: "😡",
    description: "Intensely frustrated, may be curt or accusatory. Calms down with genuine help.",
  },
  {
    id: "confused",
    label: "Confused",
    emoji: "😕",
    description: "Overwhelmed, asks many questions, needs simple clear explanations.",
  },
  {
    id: "demanding",
    label: "Demanding",
    emoji: "😤",
    description: "Calm but firm. Knows what they want and pushes hard for it.",
  },
  {
    id: "anxious",
    label: "Anxious",
    emoji: "😰",
    description: "Worried and prone to catastrophizing. Needs reassurance and calm guidance.",
  },
];

const ANGRY_PERSONA = PERSONAS.find((p) => p.id === "angry");

const TRAINING_COUNT = 2;
const EVALUATION_COUNT = 1;
const PATH_LENGTH = TRAINING_COUNT + EVALUATION_COUNT;

function shuffle(items) {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/** Build a path of 2 random training scenarios + 1 evaluation scenario from a domain. */
export function buildSessionPath(domain) {
  if (domain.scenarios.length < PATH_LENGTH) {
    throw new Error(`Domain "${domain.id}" needs at least ${PATH_LENGTH} scenarios`);
  }

  const picked = shuffle(domain.scenarios).slice(0, PATH_LENGTH);
  const evaluation = picked[picked.length - 1];
  const trainingScenarios = shuffle(picked.slice(0, TRAINING_COUNT));

  const toSession = (scenario, training) => ({
    scenario: scenario.id,
    scenarioLabel: scenario.label,
    persona: ANGRY_PERSONA.id,
    personaLabel: ANGRY_PERSONA.label,
    personaEmoji: ANGRY_PERSONA.emoji,
    training,
  });

  return [
    ...trainingScenarios.map((s) => toSession(s, true)),
    toSession(evaluation, false),
  ];
}

export function buildPathForDomain(domainId) {
  const domain = DOMAINS.find((d) => d.id === domainId && d.available && d.scenarios.length >= PATH_LENGTH);
  if (!domain) {
    throw new Error(`Unknown or unavailable domain "${domainId}"`);
  }
  return {
    domain: domain.id,
    domainLabel: domain.label,
    sessions: buildSessionPath(domain),
  };
}

// Avery Collins — detailed persona for loan_delay + demanding
export const AVERY_COLLINS_PERSONA = {
  name: "Avery Collins",
  ageGroup: "28-40",
  communicationStyle: "Demanding, sharp, impatient, presses for immediate answers",
  domain: "Finance and Banking",
  scenario: "loan_delay",
  issue: "Customer has not received the loan funds and is frustrated by vague updates and lack of clear timeline",
  primaryEmotion: "demanding",
  emotionalIntensity: "high",
  hiddenBackground: [
    "The customer is relying on this loan to complete a major payment (e.g., housing deposit / urgent bill)",
    "Missing the deadline may result in financial penalties or losing an important opportunity",
    "They have already been told an earlier approval date that was not met",
    "They feel a loss of control over their financial situation",
    "They will NOT explicitly say they are anxious, but this anxiety drives their urgency and pressure",
  ],
  interactionContext: [
    "This is a live customer support phone call",
    "The customer expects a clear answer, not general process explanations",
    "The customer starts with demands and complaints, not full context",
    "Information is only revealed when the CSR asks precise, relevant follow-up questions",
  ],
  targetSkill: "Empathy and Emotional Acknowledgement",
  behaviorRules: {
    baseline: [
      "Responses should be within four lines",
      "Starts conversation in a demanding and pressured tone",
      "Repeatedly asks for a clear timeline or confirmation",
      "Rejects vague answers like 'it's being processed' or 'soon'",
      "DO NOT use meta phrases such as: 'I'd start by…', 'let me explain…', 'since you asked…', 'what I would do is…', 'first/second/third…'",
      "Speak like a real person under financial stress, not like giving structured advice",
    ],
    escalationBehavior: [
      "If CSR does NOT provide exact, concrete information: repeats demands more aggressively, questions competence of the bank",
      "Uses pressure statements: 'This should not be this hard' / 'Why is nobody giving me a straight answer?'",
      "If still unresolved: threatens escalation (supervisor, complaint, switching banks)",
      "Uses conditional escalation: 'If this isn't resolved today, I'm filing a complaint' / 'If I don't get a real answer, I'm taking this elsewhere'",
    ],
  },
  deescalationTriggers: [
    "CSR provides exact loan status with identifier",
    "CSR provides specific reason for delay (not generic)",
    "CSR provides exact completion timeline (specific date/time)",
    "CSR provides clear next step + ownership",
    "CSR shows empathy BEFORE giving information — ALL above elements must be present and specific; if ANY part is vague or missing, do NOT de-escalate",
  ],
  deescalationBehavior: [
    "Tone softens gradually ONLY after all conditions are met",
    "Stops repeating demands, becomes more cooperative",
    "May ask clarifying questions",
    "Remains cautious, not overly friendly",
  ],
};

// ─── STEP COMPONENTS ─────────────────────────────────────────────────────────
function StepHeader({ step, total, label }) {
  return (
    <div className="mb-8 text-center">
      <p className="text-sm text-gray-400 font-medium mb-1">Step {step} of {total}</p>
      <h2 className="text-2xl font-bold text-gray-900">{label}</h2>
    </div>
  );
}

function BackButton({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="mb-6 flex items-center gap-1 text-sm text-gray-400 hover:text-gray-700 transition"
    >
      ← Back
    </button>
  );
}

function StepDomain({ onSelect }) {
  return (
    <div>
      <StepHeader step={1} total={2} label="Choose a Domain" />
      <p className="text-center text-sm text-gray-500 mb-6 -mt-4">
        You will complete {TRAINING_COUNT} training scenarios and {EVALUATION_COUNT} evaluation scenario in this domain.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
        {DOMAINS.map((d) => (
          <button
            key={d.id}
            onClick={() => d.available && onSelect(d)}
            disabled={!d.available}
            className={`border rounded-xl p-5 text-left transition space-y-2 ${d.available
              ? "bg-white border-gray-200 hover:shadow-md hover:border-blue-400 cursor-pointer"
              : "bg-gray-50 border-gray-200 opacity-50 cursor-not-allowed"
              }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-2xl">{d.icon}</span>
              {d.comingSoon && (
                <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-medium">
                  Coming Soon
                </span>
              )}
            </div>
            <p className="text-base font-semibold text-gray-800">{d.label}</p>
            {d.available && (
              <p className="text-xs text-gray-500">
                {d.scenarios.length} scenario{d.scenarios.length !== 1 ? "s" : ""} available
              </p>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

function StepPathOverview({ domain, sessions, onStart, onBack }) {
  return (
    <div>
      <BackButton onClick={onBack} />
      <StepHeader step={2} total={2} label={`Your Path — ${domain.label}`} />
      <p className="text-center text-sm text-gray-500 mb-6 -mt-4">
        Scenarios are assigned randomly. After each session you will see a report, then continue to the next one.
      </p>
      <div className="max-w-lg mx-auto space-y-3 mb-8">
        {sessions.map((s, i) => (
          <div
            key={`${s.scenario}-${i}`}
            className="bg-white border border-gray-200 rounded-xl px-5 py-4 flex items-center gap-4"
          >
            <span className="text-sm font-semibold text-gray-400 w-6">{i + 1}</span>
            <div className="flex-1 min-w-0">
              <p className="text-base font-semibold text-gray-800">{s.scenarioLabel}</p>
              <p className="text-xs text-gray-500 mt-0.5">
                {s.training ? "Training" : "Practice"}
              </p>
            </div>
            <span
              className={`text-xs font-medium px-2 py-1 rounded-full flex-shrink-0 ${s.training
                  ? "bg-blue-50 text-blue-700"
                  : "bg-amber-50 text-amber-800"
                }`}
            >
              {s.training ? "Training" : "Practice"}
            </span>
          </div>
        ))}
      </div>
      <div className="text-center">
        <button
          onClick={onStart}
          className="bg-blue-600 text-white px-8 py-3 rounded-lg text-sm font-medium hover:bg-blue-700 transition"
        >
          Start First Scenario
        </button>
      </div>
    </div>
  );
}

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────
export default function ModeSelector({ onSelect, navProps }) {
  const [step, setStep] = useState(1);
  const [selectedDomain, setSelectedDomain] = useState(null);
  const [sessions, setSessions] = useState(null);

  function handleDomainSelect(domain) {
    setSelectedDomain(domain);
    setSessions(buildSessionPath(domain));
    setStep(2);
  }

  function handleStart() {
    onSelect({
      domain: selectedDomain.id,
      domainLabel: selectedDomain.label,
      sessions,
    });
  }

  function handleBack() {
    setStep(1);
    setSelectedDomain(null);
    setSessions(null);
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between flex-shrink-0">
        <span className="font-semibold text-gray-800">CSR Simulator</span>
        <NavBar {...navProps} />
      </header>
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <div className="w-full max-w-4xl">
          {step === 1 && <StepDomain onSelect={handleDomainSelect} />}
          {step === 2 && selectedDomain && sessions && (
            <StepPathOverview
              domain={selectedDomain}
              sessions={sessions}
              onStart={handleStart}
              onBack={handleBack}
            />
          )}
        </div>
      </div>
    </div>
  );
}
