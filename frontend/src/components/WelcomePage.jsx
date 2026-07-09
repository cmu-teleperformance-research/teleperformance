import NavBar from "./NavBar";

const SKILLS = [
  {
    title: "Empathy First",
    items: [
      "Acknowledge customer emotions",
      "Demonstrate understanding before problem-solving",
      "Avoid dismissive language",
    ],
  },
  {
    title: "Active Listening",
    items: [
      "Address the customer's specific concerns",
      "Reference information they provided",
      "Show that you understand the issue",
    ],
  },
  {
    title: "Conversation Stage Awareness",
    items: [
      "Respond appropriately based on the stage of the conversation",
      "Gather information when necessary",
      "Provide solutions at appropriate times",
      "Close conversations effectively",
    ],
  },
  {
    title: "Continuous Improvement",
    items: [
      "Review feedback after customer turns",
      "Practice applying coaching suggestions",
      "Improve de-escalation performance over time",
    ],
  },
];

const HOW_IT_WORKS = [
  "Log in or create an account",
  "Select a scenario",
  "Respond to the customer",
  "Review feedback",
  "Continue until the conversation ends",
];

export function HomeGuideContent() {
  return (
    <div className="space-y-10">
      <div className="space-y-3">
        <h1 className="text-3xl font-bold text-gray-900">
          CSR De-escalation Training Simulator (Deployment Test)
        </h1>
        <p className="text-base text-gray-600 leading-relaxed">
          In this simulation, you will interact with virtual customers and practice
          customer service de-escalation skills. During the conversation you will
          receive feedback designed to help you improve your communication and
          de-escalation abilities.
        </p>
      </div>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-800">Skills Evaluated</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {SKILLS.map((skill) => (
            <div
              key={skill.title}
              className="bg-white border border-gray-200 rounded-lg p-5 space-y-3"
            >
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

      <p className="text-xs text-gray-400 leading-relaxed border-t border-gray-100 pt-6">
        Feedback is intended for learning and skill development purposes. The simulator
        is designed to help users practice customer service communication and
        de-escalation techniques.
      </p>
    </div>
  );
}

export default function WelcomePage({ onStart, navProps }) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
        <span className="font-semibold text-gray-800">CSR Simulator</span>
        {navProps && <NavBar {...navProps} />}
      </header>

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto py-12 px-6">
          <HomeGuideContent />

          <div className="flex justify-center pb-4 mt-10">
            <button
              onClick={onStart}
              className="bg-blue-600 text-white px-10 py-3 rounded-lg text-base font-medium hover:bg-blue-700 transition"
            >
              Start Training
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
