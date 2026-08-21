const SKILLS = [
  {
    title: "Problem Interpretation",
    body:
      "Show an accurate understanding of the customer's problem and, when appropriate, why it matters to them — the consequence, impact, stakes, or unmet need.",
  },
  {
    title: "Problem Exploration",
    body:
      "Ask for information that meaningfully improves understanding or diagnosis of the problem, rather than asking only routine or administrative questions.",
  },
  {
    title: "Problem Resolution",
    body:
      "Take or propose an action that directly addresses the customer's problem, and clearly communicate what they can expect next.",
  },
];

export default function InstructionsModal({ onBegin }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-8">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Instructions & grading criteria</h2>
          <p className="text-sm text-gray-500 mt-1">Read this before you begin the first scenario.</p>
        </div>

        <div className="px-6 py-5 overflow-y-auto space-y-8 text-sm text-gray-700">
          <section className="space-y-3">
            <h3 className="text-base font-semibold text-gray-900">How to work the session</h3>
            <ol className="list-decimal pl-5 space-y-2">
              <li>Talk with the customer in the chat at the bottom of the screen.</li>
              <li>
                Use the Internal Portal at the top like a company computer: look up the customer, read the record, and take the next correct action.
              </li>
              <li>Ask the customer for IDs or order numbers before searching — they will not tell you everything at once.</li>
              <li>When the portal says to return to the customer, switch back to chat and explain what you found.</li>
              <li>Do not invent company policies, actions, or facts. Use only what the customer said and what the portal shows.</li>
            </ol>
          </section>

          <section className="space-y-3">
            <h3 className="text-base font-semibold text-gray-900">How you will be coached</h3>
            <p>
              After your replies in training, you will receive concise, actionable feedback based only on what you actually said — not on policies or actions that were never taken.
            </p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>One improvement suggestion aimed at the main limitation in that turn</li>
              <li>One example response that applies the suggestion to the customer's latest problem</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h3 className="text-base font-semibold text-gray-900">Grading criteria</h3>
            <p>
              Each reply is classified into one problem-handling skill and scored on how well that skill is performed:
            </p>
            <div className="space-y-3">
              {SKILLS.map((skill) => (
                <div key={skill.title} className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-1">
                  <h4 className="text-sm font-semibold text-blue-700">{skill.title}</h4>
                  <p className="text-sm text-gray-600 leading-relaxed">{skill.body}</p>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
          <button
            type="button"
            onClick={onBegin}
            className="bg-blue-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition"
          >
            Begin first scenario
          </button>
        </div>
      </div>
    </div>
  );
}
