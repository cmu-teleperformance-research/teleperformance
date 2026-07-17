import { useState, useRef, useEffect } from "react";

const DEFAULT_WIDTH = 388;
const MIN_WIDTH = 220;
const MAX_WIDTH = 900;

const SIGNAL_COLORS = {
  "Strong": "bg-green-100 text-green-700",
  "Developing": "bg-yellow-100 text-yellow-700",
  "Needs Work": "bg-red-100 text-red-600",
  "Adequate": "bg-amber-100 text-amber-700",
};

const STAGE_LABELS = {
  "opening_issue_presentation_clarification": "Opening / Issue Clarification",
  "service_response_resolution": "Service Response / Resolution",
  "customer_uptake": "Customer Uptake",
  "closing": "Closing",
};

function SkillBadge({ label, value }) {
  const colorClass = SIGNAL_COLORS[value] ?? "bg-gray-100 text-gray-500";
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
      <span className="text-sm font-medium text-gray-700">{label}</span>
      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${colorClass}`}>
        {value ?? "—"}
      </span>
    </div>
  );
}

export function TurnFeedbackCard({ feedback }) {
  if (!feedback) return null;

  const signals = feedback.signals ?? {};
  const stageLabel = STAGE_LABELS[signals.turn_stage] ?? signals.turn_stage ?? null;
  const practice = feedback?.analysis?.learn_from_this_practice;

  return (
    <div className="space-y-4">
      {stageLabel && (
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Stage</span>
          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
            {stageLabel}
          </span>
        </div>
      )}
      <div className="bg-gray-50 rounded-lg p-3 space-y-1">
        <SkillBadge label="Empathy First" value={signals.empathyFirst} />
        <SkillBadge label="Active Listening" value={signals.activeListening} />
      </div>
      {practice && (
        <div className="space-y-3 border-t border-gray-100 pt-4">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Area</p>
            <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3 leading-relaxed">
              {practice.area ?? "—"}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Focus</p>
            <p className="text-sm text-gray-700 bg-blue-50 rounded-lg p-3 leading-relaxed">
              {practice.focus ?? "—"}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Why this helps</p>
            <p className="text-sm text-gray-700 bg-green-50 rounded-lg p-3 leading-relaxed">
              {practice.why_it_improves_deescalation ?? "—"}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}



function TaskCompletionFeedbackCard({ taskFeedback }) {
  const [hoveredStep, setHoveredStep] = useState(0);
  const rating = taskFeedback?.rating;
  const feedback = taskFeedback?.feedback;
  const contribution_quote = taskFeedback?.contribution_quote;
  const checklist = taskFeedback?.checklist;

  //   "contribution_quote": "Could you please provide your booking reference so we can explore rebooking options?",
  //     "rating": "Adequate",
  //     "checklist": [
  //         {
  //             "step": "Ask for booking reference or name + flight",
  //             "status": "done"
  //         },
  //         {
  //             "step": "Explain cancellation reason and compensation",
  //             "status": "next"
  //         }
  //     ]
  // }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        <span className={`text-xs font-semibold text-gray-500 uppercase tracking-wide ${SEGMENT_TYPE_STYLES.task.tagClass}`}>
          Task completion feedback
        </span>
      </div>
      <div className={`rounded-lg border p-3 space-y-2.5 border-gray-200 ${SEGMENT_TYPE_STYLES.task.panelClass}`}>
        <p className={`w-fit p-1 text-xs font-semibold uppercase tracking-wide ${SIGNAL_COLORS[rating]}`}>
          {rating}
        </p>
        <p className="text-xs text-gray-600 leading-relaxed">Follow the checklist to complete the task:</p>
        <p className="text-xs text-gray-600 leading-relaxed">{contribution_quote}</p>
        {checklist?.length > 0 && (
          <ul className="space-y-1.5">
            {checklist.map((item, index) => {
              const isDone = item.status === "done";
              return (
                <li key={index} className="flex items-start gap-2 text-xs leading-relaxed">
                  <span
                    className={`mt-0.5 flex h-3.5 w-3.5 flex-shrink-0 items-center justify-center rounded border ${isDone
                      ? "border-indigo-500 bg-indigo-500 text-white"
                      : "border-indigo-300 bg-white"
                      }`}
                    aria-hidden="true"
                  >

                  </span>
                  <span className={isDone ? "text-gray-500 line-through" : "text-gray-700 font-medium"}>
                    {item.step}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );

}

function CsrResponseFeedbackCard({ emotionFeedback }) {
  const rating = emotionFeedback?.rating;
  const feedback = emotionFeedback?.feedback;

  // Hardcoded for design preview
  return (
    <div className="space-y-3 border-t border-gray-100 pt-4">
      <div className="flex items-center gap-2 flex-wrap">
        <span className={`text-xs font-semibold text-gray-500 uppercase tracking-wide ${SEGMENT_TYPE_STYLES.emotion.tagClass}`}>
          Emotion feedback
        </span>
      </div>
      <div className={`rounded-lg border p-3 space-y-2.5 border-gray-200 ${SEGMENT_TYPE_STYLES.emotion.panelClass}`}>
        <p className={`w-fit p-1 text-xs font-semibold uppercase tracking-wide ${SIGNAL_COLORS[rating]}`}>
          {rating}
        </p>
        <p className="text-xs text-gray-600 leading-relaxed">{feedback}</p>
      </div>
    </div>
  );
}

const SEGMENT_TYPE_STYLES = {
  emotion: {
    label: "Emotion",
    tagClass: "text-cyan-800 bg-cyan-50 border-cyan-300",
    highlightClass: "bg-cyan-200/35 hover:bg-cyan-200",
    panelClass: "bg-cyan-50 border-cyan-300",
  },
  task: {
    label: "Task",
    tagClass: "text-indigo-800 bg-indigo-50 border-indigo-300",
    highlightClass: "bg-indigo-200/35 hover:bg-indigo-200",
    panelClass: "bg-indigo-50 border-indigo-300",
  },
  neutral: {
    label: "Neutral",
    tagClass: "text-blue-500 bg-blue-50 border-blue-200",
    highlightClass: "bg-blue-100/35 hover:bg-blue-100",
    panelClass: "bg-blue-50 border-blue-200",
  },
};


function ExampleResponseCard({ recommendedResponse }) {
  const segments =
    recommendedResponse?.segments?.length > 0
      ? recommendedResponse.segments
      : [];
  const plainText = segments.map((s) => s.text).join(" ").trim();

  const [copied, setCopied] = useState(false);
  const [hoveredType, setHoveredType] = useState(null);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(plainText);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore clipboard errors in preview
    }
  }

  const activeStyle = hoveredType ? SEGMENT_TYPE_STYLES[hoveredType] : null;

  return (
    <div className="space-y-3 border-t border-gray-100 pt-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-h-[1.25rem]">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Example response
          </span>
          {activeStyle && (
            <span
              className={`text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded border ${activeStyle.tagClass}`}
            >
              {activeStyle.label}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={handleCopy}
          className={`text-xs font-semibold px-2.5 py-1 rounded-md border transition-colors ${copied
            ? "border-green-300 bg-green-50 text-green-700"
            : "border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50"
            }`}
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
        <p className="text-sm text-gray-800 leading-relaxed">
          {segments.map((segment, i) => {
            const style = SEGMENT_TYPE_STYLES[segment.type] ?? SEGMENT_TYPE_STYLES.neutral;
            return (
              <span key={i}>
                {i > 0 ? " " : ""}
                <span
                  onMouseEnter={() => setHoveredType(segment.type)}
                  onMouseLeave={() => setHoveredType(null)}
                  className={`rounded px-0.5 py-px transition-colors cursor-default ${style.highlightClass}`}
                >
                  {segment.text}
                </span>
              </span>
            );
          })}
        </p>
      </div>
    </div>
  );
}

function PanelContent({ feedback, feedbackLoading }) {

  const taskFeedback = feedback?.task;
  const emotionFeedback = feedback?.emotion;
  const recommendedResponse = feedback?.recommended_response;

  // if there is no feedback, return empty
  if (!feedback) {
    return (
      <div className="h-full flex items-center justify-center text-gray-400 text-sm text-center p-6">
        Feedback will appear here.
      </div>
    );
  }

  return (
    <div className="p-5 space-y-4">
      <TaskCompletionFeedbackCard taskFeedback={taskFeedback} />
      <CsrResponseFeedbackCard emotionFeedback={emotionFeedback} />
      <ExampleResponseCard recommendedResponse={recommendedResponse} />
    </div>
  );


  if (feedbackLoading) {
    return (
      <div className="h-full flex items-center justify-center text-gray-400 text-sm text-center p-6">
        Evaluating response...
      </div>
    );
  }

  if (!feedback) {
    return (
      <div className="h-full flex items-center justify-center text-gray-400 text-sm text-center p-6">
        Feedback will appear here after the customer responds.
      </div>
    );
  }

  console.log("FEEDBACK PANEL DATA:", feedback);

  return (
    <div className="p-5 space-y-4">
      <h3 className="text-base font-semibold text-gray-800">Test Turn Feedback</h3>
      <p className="text-xs text-gray-400 -mt-3">Click any blue message to view its feedback.</p>
      <TurnFeedbackCard feedback={feedback} />
    </div>
  );
}

export default function FeedbackPanel({ feedback, feedbackLoading }) {
  const [width, setWidth] = useState(DEFAULT_WIDTH);
  const isDragging = useRef(false);
  const dragStartX = useRef(0);
  const dragStartWidth = useRef(0);

  useEffect(() => {
    function onMouseMove(e) {
      if (!isDragging.current) return;
      const delta = dragStartX.current - e.clientX;
      const newWidth = Math.min(
        Math.max(dragStartWidth.current + delta, MIN_WIDTH),
        MAX_WIDTH
      );
      setWidth(newWidth);
    }

    function onMouseUp() {
      if (!isDragging.current) return;
      isDragging.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    }

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, []);

  return (
    <div
      className="relative flex-shrink-0 bg-white border-l overflow-y-auto h-full"
      style={{ width }}
    >
      <div
        onMouseDown={(e) => {
          isDragging.current = true;
          dragStartX.current = e.clientX;
          dragStartWidth.current = width;
          document.body.style.cursor = "col-resize";
          document.body.style.userSelect = "none";
        }}
        className="absolute left-0 top-0 bottom-0 w-2 -translate-x-1/2 cursor-col-resize hover:bg-blue-400/60 z-10 transition-colors group flex items-center justify-center"
        aria-label="Resize feedback panel"
        role="separator"
      >
        <div className="h-8 w-0.5 rounded-full bg-gray-400 group-hover:bg-white transition-colors" />
      </div>
      <PanelContent feedback={feedback} feedbackLoading={feedbackLoading} />
    </div>
  );
}
