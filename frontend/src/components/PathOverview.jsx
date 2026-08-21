import NavBar from "./NavBar";

export default function PathOverview({ domainLabel, sessions, navProps, onNext }) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between flex-shrink-0">
        <span className="font-semibold text-gray-800">CSR Simulator</span>
        {navProps && <NavBar {...navProps} />}
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-8">
        <div className="w-full max-w-lg">
          <div className="mb-8 text-center">
            <h2 className="text-2xl font-bold text-gray-900">
              Your scenarios{domainLabel ? ` — ${domainLabel}` : ""}
            </h2>
            <p className="text-sm text-gray-500 mt-2">
              These were assigned in a random order. After each session you will see a report, then continue to the next one.
            </p>
          </div>

          <div className="space-y-3 mb-8">
            {sessions.map((s, i) => (
              <div
                key={`${s.scenario}-${i}`}
                className="bg-white border border-gray-200 rounded-xl px-5 py-4 flex items-center gap-4"
              >
                <span className="text-sm font-semibold text-gray-400 w-6">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-base font-semibold text-gray-800">{s.scenarioLabel}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {s.training ? "Training" : "Evaluation"}
                  </p>
                </div>
                <span
                  className={`text-xs font-medium px-2 py-1 rounded-full flex-shrink-0 ${
                    s.training
                      ? "bg-blue-50 text-blue-700"
                      : "bg-amber-50 text-amber-800"
                  }`}
                >
                  {s.training ? "Training" : "Evaluation"}
                </span>
              </div>
            ))}
          </div>

          <div className="text-center">
            <button
              type="button"
              onClick={onNext}
              className="bg-blue-600 text-white px-8 py-3 rounded-lg text-sm font-medium hover:bg-blue-700 transition"
            >
              Next
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
