import { Link } from "react-router-dom";
import { CONDITIONS, CONDITION_IDS } from "../conditions";

export default function ConditionHub() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-200 px-6 py-3">
        <span className="font-semibold text-gray-800">CSR Simulator</span>
      </header>

      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md space-y-8">
          <div className="space-y-2 text-center">
            <h1 className="text-2xl font-bold text-gray-900">Select a condition</h1>
            <p className="text-sm text-gray-600">
              Choose a study condition to begin.
            </p>
          </div>

          <nav className="space-y-3">
            {CONDITION_IDS.map((id) => {
              const cond = CONDITIONS[id];
              return (
                <Link
                  key={id}
                  to={`/${id}`}
                  className="flex items-center justify-between w-full bg-white border border-gray-200 rounded-lg px-5 py-4 text-left hover:border-blue-400 hover:bg-blue-50 transition"
                >
                  <span className="font-medium text-gray-800">{cond.label}</span>
                  <span className="text-sm text-gray-400">/{id}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </main>
    </div>
  );
}
