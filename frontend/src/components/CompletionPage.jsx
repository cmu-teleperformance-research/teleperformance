import { useState, useEffect } from "react";
import NavBar from "./NavBar";
import { getQualtricsReturnUrl, buildQualtricsReturnUrl } from "../qualtrics";

export default function CompletionPage({
  completion,
  error,
  loading,
  navProps,
  onDone,
  endedReason,
}) {
  const [copied, setCopied] = useState(false);
  const code = completion?.code;
  const attentionFailed = endedReason === "attention_check_failed" || completion?.status === "attention_failed";
  const returnUrl = getQualtricsReturnUrl();
  const surveyUrl = returnUrl
    ? buildQualtricsReturnUrl(
      returnUrl,
      attentionFailed
        ? { attention_failed: "1" }
        : { completion_code: code }
    )
    : null;

  useEffect(() => {
    if (!surveyUrl || (!code && !attentionFailed)) return;
    const timer = setTimeout(() => {
      window.location.assign(surveyUrl);
    }, 2500);
    return () => clearTimeout(timer);
  }, [surveyUrl, code, attentionFailed]);

  async function handleCopy() {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: select is not available; user can still highlight the code
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
        <span className="font-semibold text-gray-800">CSR Simulator</span>
        <NavBar {...navProps} />
      </header>

      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 max-w-lg w-full p-8 text-center space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {attentionFailed ? "Session ended" : "Path complete"}
            </h1>
            <p className="text-sm text-gray-500 mt-2">
              {attentionFailed
                ? "This study session ended because the attention check was not passed. You will not continue to further scenarios, and no completion code will be issued."
                : surveyUrl
                  ? "You finished all scenarios. Returning you to the survey…"
                  : "You finished all scenarios. Copy the completion code below and paste it into the qualtrics form you started from."}
            </p>
          </div>

          {attentionFailed && !loading && (
            surveyUrl ? (
              <a
                href={surveyUrl}
                className="block w-full bg-blue-600 text-white px-6 py-3 rounded-lg text-sm font-medium hover:bg-blue-700 transition"
              >
                Return to survey
              </a>
            ) : (
              <button
                type="button"
                onClick={onDone}
                className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg text-sm font-medium hover:bg-blue-700 transition"
              >
                Done
              </button>
            )
          )}

          {loading && !attentionFailed && (
            <div className="flex flex-col items-center gap-3 py-4">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-gray-500">Generating your completion code…</p>
            </div>
          )}

          {error && !loading && !attentionFailed && (
            <div className="space-y-3">
              <p className="text-sm text-red-500">{error}</p>
              <button
                type="button"
                onClick={onDone}
                className="text-sm text-blue-600 hover:underline"
              >
                Back to home
              </button>
            </div>
          )}

          {code && !loading && !attentionFailed && (
            <>
              <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-5">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                  Completion code
                </p>
                <p className="font-mono text-xl sm:text-2xl font-bold text-gray-900 tracking-wide break-all select-all">
                  {code}
                </p>
              </div>

              {surveyUrl && (
                <a
                  href={surveyUrl}
                  className="block w-full bg-blue-600 text-white px-6 py-3 rounded-lg text-sm font-medium hover:bg-blue-700 transition"
                >
                  Return to survey
                </a>
              )}

              <button
                type="button"
                onClick={handleCopy}
                className={`w-full ${surveyUrl ? "border border-gray-300 text-gray-700 hover:bg-gray-50" : "bg-blue-600 text-white hover:bg-blue-700"} px-6 py-3 rounded-lg text-sm font-medium transition`}
              >
                {copied ? "Copied!" : "Copy code"}
              </button>

              <button
                type="button"
                onClick={onDone}
                className="text-sm text-gray-500 hover:text-gray-800 transition"
              >
                Done — return home
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
