export default function WrongAction({ onDismiss }) {
  return (
    <div className="mt-2 flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
      <span>⚠️</span>
      <span>That's not the right action here. Review the prompt above and try again.</span>
      <button onClick={onDismiss} className="ml-auto text-red-400 hover:text-red-600">✕</button>
    </div>
  );
}
