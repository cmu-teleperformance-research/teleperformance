export default function StepSidebar({ steps, current, completed, onGoToStep }) {
  return (
    <div className="w-52 bg-gray-900 text-white flex flex-col py-6 flex-shrink-0">
      <p className="text-xs font-bold uppercase tracking-widest text-gray-400 px-5 mb-4">Workflow</p>
      {steps.map((s, i) => {
        const done = completed.includes(s.id);
        const active = current === i;
        const canNavigate = i <= current || completed.includes(s.id);
        return (
          <div
            key={s.id}
            onClick={() => canNavigate && onGoToStep(i)}
            className={`flex items-center gap-3 px-5 py-3 text-sm ${
              active ? "bg-gray-700 text-white font-semibold" :
              done ? "text-green-400" : "text-gray-500"
            } ${canNavigate ? "cursor-pointer hover:bg-gray-800" : "cursor-default"}`}
          >
            <span className="w-5 text-center">
              {done ? "✓" : active ? "▶" : `${i + 1}`}
            </span>
            <span>{s.label}</span>
          </div>
        );
      })}
    </div>
  );
}
