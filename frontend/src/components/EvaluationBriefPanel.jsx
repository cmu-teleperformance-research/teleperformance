import { useState, useRef, useEffect } from "react";

const DEFAULT_WIDTH = 280;
const MIN_WIDTH = 220;
const MAX_WIDTH = 420;

const PARTICIPANT_GOAL =
  "Help this customer resolve their issue. Talk with them in chat, and use the Internal Portal to look up records and take the next correct action.";

const EVALUATION_STATES = [
  "Show an accurate understanding of the customer's problem and why it matters.",
  "Ask for information that improves diagnosis of the problem.",
  "Take an action that addresses the problem and tell the customer what happens next.",
];

export default function EvaluationBriefPanel() {
  const [width, setWidth] = useState(DEFAULT_WIDTH);
  const isDragging = useRef(false);
  const dragStartX = useRef(0);
  const dragStartWidth = useRef(0);

  useEffect(() => {
    function onMouseMove(e) {
      if (!isDragging.current) return;
      const delta = e.clientX - dragStartX.current;
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
      className="relative flex-shrink-0 bg-white border-r overflow-hidden h-full flex flex-col"
      style={{ width }}
    >
      <div className="bg-gray-50 border-b border-gray-200 px-4 py-1.5 flex-shrink-0">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          Your Task
        </span>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
        <section className="space-y-2">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Goal
          </h3>
          <p className="text-sm text-gray-700 leading-relaxed">
            {PARTICIPANT_GOAL}
          </p>
        </section>
        <br />
        <section className="space-y-2">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Your response should focus on:
          </h3>
          <ul className="list-disc pl-5 space-y-1.5">
            {EVALUATION_STATES.map((state) => (
              <li key={state} className="text-sm text-gray-600 leading-relaxed">
                {state}
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div
        onMouseDown={(e) => {
          isDragging.current = true;
          dragStartX.current = e.clientX;
          dragStartWidth.current = width;
          document.body.style.cursor = "col-resize";
          document.body.style.userSelect = "none";
        }}
        className="absolute right-0 top-0 bottom-0 w-2 translate-x-1/2 cursor-col-resize hover:bg-blue-400/60 z-10 transition-colors group flex items-center justify-center"
        aria-label="Resize task panel"
        role="separator"
      >
        <div className="h-8 w-0.5 rounded-full bg-gray-400 group-hover:bg-white transition-colors" />
      </div>
    </div>
  );
}
