import NavBar from "./NavBar";

const SKILLS = [
  {
    title: "Problem Interpretation",
    items: [
      "Name the customer's specific problem, not just that something went wrong",
      "Show you understand why it matters to this customer — what it costs them, what's at risk, or what they still need",
      "Base that understanding on what the customer actually said",
    ],
  },
  {
    title: "Problem Exploration",
    items: [
      "Ask for information the customer has not given yet",
      "Ask questions that help diagnose the problem, not routine or already-answered ones",
      "Make clear what you are trying to pin down — the cause, a constraint, context, or what the customer needs",
    ],
  },
  {
    title: "Problem Resolution",
    items: [
      "Take or propose an action that actually addresses the problem",
      "Tell the customer the result and what happens next",
      "Do not close the conversation while something is still unresolved",
    ],
  },
];

const HOW_IT_WORKS = [
  "You'll be assigned a domain and complete a series of customer scenarios",
  "Talk with the customer in the chat at the bottom of the screen",
  "Use the Internal Portal at the top like a company computer: look up the customer, read the record, and take the next correct action",
  "Ask the customer for IDs or order numbers before searching — they will not tell you everything at once",
  "When the portal says to return to the customer, switch back to chat and explain what you found",
  "Review feedback after your replies (in training), then continue until you end the session",
];

export function HomeGuideContent({ title, description, what_to_expect }) {
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

export default function WelcomePage({ onStart, navProps, title, description, what_to_expect, startLoading, startError }) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
        <span className="font-semibold text-gray-800">CSR Simulator</span>
        {navProps && <NavBar {...navProps} />}
      </header>

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto py-12 px-6">
          <HomeGuideContent title={title} description={description} what_to_expect={what_to_expect} />

          <div className="flex flex-col items-center pb-4 mt-10 gap-3">
            {startError && <p className="text-sm text-red-500">{startError}</p>}
            <button
              onClick={onStart}
              disabled={startLoading}
              className="bg-blue-600 text-white px-10 py-3 rounded-lg text-base font-medium hover:bg-blue-700 transition disabled:opacity-50"
            >
              {startLoading ? "Assigning..." : "Start Training"}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
