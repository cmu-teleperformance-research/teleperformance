import { useState, useRef, useEffect } from "react";

const DEFAULT_WIDTH = 288;
const MIN_WIDTH = 220;
const MAX_WIDTH = 560;

const SCORE_COLORS = {
  2: "bg-green-100 text-green-700",
  1: "bg-yellow-100 text-yellow-700",
  0: "bg-red-100 text-red-600",
};

export function TurnFeedbackCard({ feedback }) {
  if (!feedback) return null;

  const scoreColorClass = SCORE_COLORS[feedback.score] ?? "bg-gray-100 text-gray-500";

  return (
    <div className="space-y-4">
      {(feedback.state || feedback.score !== undefined) && (
        <div className="flex items-center gap-2">
          {feedback.state && (
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
              {feedback.state}
            </span>
          )}
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${scoreColorClass}`}>
            {feedback.score ?? "—"}
          </span>
        </div>
      )}
      {(feedback.suggestion || feedback.example_response) && (
        <div className="border-t border-gray-100 pt-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Suggestion</p>
          <p className="text-sm text-gray-700 bg-blue-50 rounded-lg p-3 leading-relaxed">
            {feedback.suggestion ?? "—"}
            {feedback.example_response && (
              <>
                {" "}For example:
                <span className="block pl-4 italic font-semibold">"{feedback.example_response}"</span>
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
