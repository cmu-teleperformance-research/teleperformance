import { useState } from "react";
import { HOW_TO_USE_PORTAL, getWorkflowTutorial } from "./utils/tutorials";

export default function WorkflowTutorial({ scenario, stepPrompt }) {
  const [open, setOpen] = useState(true);
  const tutorial = getWorkflowTutorial(scenario);

  return (
    <div className="space-y-3">
      {stepPrompt?.text && (
        <div
          className={`rounded-xl px-4 py-3 text-sm ${
            stepPrompt.type === "customer"
              ? "bg-amber-50 border border-amber-200 text-amber-900"
              : "bg-blue-50 border border-blue-200 text-blue-900"
          }`}
        >
          <p className="text-xs font-semibold uppercase tracking-wide mb-1 opacity-70">
            {stepPrompt.type === "customer" ? "Talk to the customer" : "Use the system"}
          </p>
          <p>{stepPrompt.text}</p>
        </div>
      )}

      {tutorial && (
        <div className="border border-gray-200 rounded-xl bg-gray-50 overflow-hidden">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="w-full flex items-center justify-between px-4 py-3 text-left"
          >
            <span className="text-sm font-semibold text-gray-800">
              What you need to do — {tutorial.title}
            </span>
            <span className="text-xs text-gray-500">{open ? "Hide" : "Show"}</span>
          </button>

          {open && (
            <div className="px-4 pb-4 space-y-3 text-sm text-gray-700">
              <p>{HOW_TO_USE_PORTAL.body}</p>
              <p>{tutorial.situation}</p>
              <ol className="list-decimal pl-5 space-y-1.5">
                {tutorial.steps.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
              <ul className="space-y-1 text-xs text-gray-500 pt-1">
                {HOW_TO_USE_PORTAL.tips.map((tip) => (
                  <li key={tip}>• {tip}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
