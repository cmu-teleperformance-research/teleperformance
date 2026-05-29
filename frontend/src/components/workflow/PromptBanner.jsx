export default function PromptBanner({ prompt }) {
  const isCustomer = prompt.type === "customer";
  return (
    <div className={`flex items-start gap-3 px-4 py-3 rounded-lg text-sm font-medium mb-4 ${
      isCustomer
        ? "bg-amber-50 border border-amber-300 text-amber-800"
        : "bg-blue-50 border border-blue-300 text-blue-800"
    }`}>
      <span className="text-lg leading-none">{isCustomer ? "↩️" : "👆"}</span>
      <span>{isCustomer ? "→ Return to customer: " : ""}{prompt.text}</span>
    </div>
  );
}
