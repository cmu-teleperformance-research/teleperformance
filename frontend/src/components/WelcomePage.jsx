import { useMemo, useState } from "react";
import NavBar from "./NavBar";

const SKILLS = [
  {
    title: "Problem Interpretation",
    items: [
      "Name the customer's specific problem, not just that something went wrong",
      "Show you understand why it matters, based on what they actually said",
    ],
  },
  {
    title: "Problem Exploration",
    items: [
      "Ask for information that diagnose the issue the customer has not given yet",
      "Make clear what you are trying to pin down and why it's important",
    ],
  },
  {
    title: "Problem Resolution",
    items: [
      "Take an action that addresses the problem and tell the customer the result and what happens next",
      "Do not close the conversation while something is still unresolved",
    ],
  },
];

const DISTRACTOR_SKILLS = [
  "Emotional Empathy",
  "Case Handling Speed",
];

function shuffle(items) {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

const HOW_IT_WORKS = [
  "You'll be assigned a domain and complete a series of customer scenarios",
  "Talk with the customer in the chat at the bottom of the screen",
  "Use the Internal Portal at the top to look up the customer, read the record, and take the next correct action",
  "Ask the customer for IDs or order numbers before searching — they will not tell you everything at once",
  "The customer will not see the internal portal, you will need to communicate with the customer and explain what you found"
];

const CORRECT_SKILLS = SKILLS.map((s) => s.title);

const HOW_IT_WORKS_CORRECT = [
  "Talk with the customer in the chat at the bottom of the screen",
  "Ask the customer for IDs or order numbers before searching",
  "The customer will not see the internal portal",
];

const HOW_IT_WORKS_DISTRACTORS = [
  "The customer will tell you all IDs and details at the start of the session",
];

function isExactSelection(selected, correct) {
  return (
    selected.size === correct.length &&
    correct.every((item) => selected.has(item))
  );
}

function toggleInSet(prev, item) {
  const next = new Set(prev);
  if (next.has(item)) next.delete(item);
  else next.add(item);
  return next;
}

export function HomeGuideContent({
  hideQuestions,
  title,
  description,
  what_to_expect,
  selectedSkills: selectedSkillsProp,
  onToggleSkill,
  selectedHowItWorks: selectedHowItWorksProp,
  onToggleHowItWorks,
}) {
  const [internalSelected, setInternalSelected] = useState(() => new Set());
  const [internalHowItWorks, setInternalHowItWorks] = useState(() => new Set());
  const selectedSkills = selectedSkillsProp ?? internalSelected;
  const selectedHowItWorks = selectedHowItWorksProp ?? internalHowItWorks;
  const attentionOptions = useMemo(
    () => shuffle([...CORRECT_SKILLS, ...DISTRACTOR_SKILLS]),
    []
  );
  const howItWorksOptions = useMemo(
    () => shuffle([...HOW_IT_WORKS_CORRECT, ...HOW_IT_WORKS_DISTRACTORS]),
    []
  );

  function toggleSkill(skill) {
    if (onToggleSkill) {
      onToggleSkill(skill);
      return;
    }
    setInternalSelected((prev) => toggleInSet(prev, skill));
  }

  function toggleHowItWorks(item) {
    if (onToggleHowItWorks) {
      onToggleHowItWorks(item);
      return;
    }
    setInternalHowItWorks((prev) => toggleInSet(prev, item));
  }

  return (
    <div className="space-y-10">
      <div className="space-y-3">
        <h1 className="text-3xl font-bold text-gray-900">
          {title || "CSR De-escalation Training Simulator"}
        </h1>
        <p className="text-base text-gray-600 leading-relaxed">
          {what_to_expect ||
            "In this simulation, you will interact with virtual customers and practice customer service de-escalation skills. During the conversation you will receive feedback designed to help you improve your communication and de-escalation abilities."}
        </p>
      </div>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-800">Skills Evaluated</h2>
        <div className="bg-white border border-gray-200 rounded-lg p-5 space-y-6">
          {SKILLS.map((skill) => (
            <div key={skill.title} className="space-y-3">
              <h3 className="text-sm font-semibold text-blue-700">{skill.title}</h3>
              <ul className="space-y-1.5">
                {skill.items.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-gray-600">
                    <span className="mt-1 w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/*  attention check question to select all the skills they will be evaluated on */}
      {!hideQuestions && (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-800">Knowledge Check <span className="text-red-500" aria-hidden="true">*</span></h2>
          <p className="text-sm text-gray-600">
            Please select all the skills that will be part of the training to show you understand the task:
          </p>
          <div className="bg-white border border-gray-200 rounded-lg p-5 space-y-3">
            {attentionOptions.map((skill) => (
              <label key={skill} className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedSkills.has(skill)}
                  onChange={() => toggleSkill(skill)}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-semibold text-blue-700">{skill}</span>
              </label>
            ))}
          </div>
        </section>
      )}

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-800">How It Works</h2>
        <ol className="space-y-2">
          {HOW_IT_WORKS.map((step, i) => (
            <li key={step} className="flex items-start gap-3 text-sm text-gray-600">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold flex items-center justify-center">
                {i + 1}
              </span>
              {step}
            </li>
          ))}
        </ol>
      </section>

      {!hideQuestions && (<section className="space-y-4">

        <h2 className="text-lg font-semibold text-gray-800">
          Knowledge Check <span className="text-red-500" aria-hidden="true">*</span>
        </h2>
        <p className="text-sm text-gray-600">
          Please select all statements that correctly describe how the simulator works:
        </p>
        <div className="bg-white border border-gray-200 rounded-lg p-5 space-y-3">
          {howItWorksOptions.map((item) => (
            <label key={item} className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedHowItWorks.has(item)}
                onChange={() => toggleHowItWorks(item)}
                className="mt-0.5 w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm font-semibold text-blue-700">{item}</span>
            </label>
          ))}
        </div>
      </section>
      )}

      <p className="text-xs text-gray-400 leading-relaxed border-t border-gray-100 pt-6">
        Feedback is intended for learning and skill development purposes. The simulator
        is designed to help users practice customer service communication and
        de-escalation techniques.
      </p>
    </div>
  );
}

export default function WelcomePage({ onStart, navProps, title, description, what_to_expect, startLoading, startError }) {
  const [selectedSkills, setSelectedSkills] = useState(() => new Set());
  const [selectedHowItWorks, setSelectedHowItWorks] = useState(() => new Set());
  const attentionPassed =
    isExactSelection(selectedSkills, CORRECT_SKILLS) &&
    isExactSelection(selectedHowItWorks, HOW_IT_WORKS_CORRECT);
  const startDisabled = startLoading || !attentionPassed;

  function toggleSkill(skill) {
    setSelectedSkills((prev) => toggleInSet(prev, skill));
  }

  function toggleHowItWorks(item) {
    setSelectedHowItWorks((prev) => toggleInSet(prev, item));
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
        <span className="font-semibold text-gray-800">CSR Simulator</span>
        {navProps && <NavBar {...navProps} />}
      </header>

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto py-12 px-6">
          <HomeGuideContent
            title={title}
            description={description}
            what_to_expect={what_to_expect}
            selectedSkills={selectedSkills}
            onToggleSkill={toggleSkill}
            selectedHowItWorks={selectedHowItWorks}
            onToggleHowItWorks={toggleHowItWorks}
          />

          <div className="flex flex-col items-center pb-4 mt-10 gap-3">
            {startError && <p className="text-sm text-red-500">{startError}</p>}
            {!attentionPassed && (
              <p className="text-sm text-red-500">
                Complete the attention checks correctly above to start training.
              </p>
            )}
            <button
              onClick={onStart}
              disabled={startDisabled}
              className="bg-blue-600 text-white px-10 py-3 rounded-lg text-base font-medium hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {startLoading ? "Assigning..." : "Start Training"}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
