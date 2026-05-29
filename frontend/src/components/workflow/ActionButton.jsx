export default function ActionButton({ label, onClick, variant = "default" }) {
  const styles = {
    default: "bg-white border border-gray-300 text-gray-700 hover:border-gray-400",
    primary: "bg-blue-600 text-white hover:bg-blue-700",
    danger: "bg-white border border-gray-300 text-gray-500 hover:border-gray-400",
  };
  return (
    <button onClick={onClick} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${styles[variant]}`}>
      {label}
    </button>
  );
}
