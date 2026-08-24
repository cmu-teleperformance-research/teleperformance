import { useState, useRef, useEffect } from "react";

const DEFAULT_WIDTH = 288;
const MIN_WIDTH = 220;
const MAX_WIDTH = 560;

const SCORE_DISPLAY = {
  2: { label: "Excellent", className: "bg-green-50 text-green-800 border border-green-200" },
  1: { label: "Good", className: "bg-amber-50 text-amber-800 border border-amber-200" },
  0: { label: "Needs improvement", className: "bg-red-50 text-red-700 border border-red-200" },
};

function MarkdownText({ text }) {
  const nodes = [];
  const pattern = /\*\*(.+?)\*\*/g;
  let lastIndex = 0;
  let match;
  let key = 0;
  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }
    nodes.push(<strong key={key++}>{match[1]}</strong>);
    lastIndex = pattern.lastIndex;
  }
  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }
  return <>{nodes}</>;
}

export function TurnFeedbackCard({ feedback }) {
  if (!feedback) return null;

  const scoreDisplay = SCORE_DISPLAY[feedback.score];

  return (
    <div className="space-y-4">
      {(feedback.state || feedback.score !== undefined) && (
        <div className="flex flex-wrap items-center justify-between gap-2">
          {feedback.state && (
            <p className="text-sm font-semibold text-blue-700">{feedback.state}</p>
          )}
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-md ${scoreDisplay?.className ?? "bg-gray-50 text-gray-500 border border-gray-200"}`}>
            {scoreDisplay?.label ?? "—"}
          </span>
        </div>
      )}
      {(feedback.suggestion || feedback.example_response) && (
        <div className="border-t border-gray-100 pt-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Suggestion</p>
          <p className="text-sm text-gray-700 bg-blue-50 rounded-lg p-3 leading-relaxed">
            {<MarkdownText text={feedback.suggestion} /> ?? "—"}
            {feedback.example_response && (
              <>
                {" "}For example:
                <span className="block pl-4 italic">
                  "<MarkdownText text={feedback.example_response} />"
                </span>
              </>
            )}
          </p>
        </div>
      )}
    </div>
  );
}

function PanelContent({ feedback, feedbackLoading }) {
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

  // console.log("FEEDBACK PANEL DATA:", feedback);

  return (
    <div className="p-5 space-y-4">
      <h3 className="text-base font-semibold text-gray-800">Feedback</h3>
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
