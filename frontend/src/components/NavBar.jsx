export default function NavBar({ displayName, onProfile, onResearch, onLogout }) {
  return (
    <div className="flex items-center gap-4">
      {onResearch && (
        <button
          onClick={onResearch}
          className="text-sm text-gray-500 hover:text-blue-600 transition"
        >
          Research
        </button>
      )}
      <button
        onClick={onProfile}
        className="text-sm text-gray-600 hover:text-blue-600 font-medium transition"
      >
        {displayName}
      </button>
      {onLogout && (
        <button
          onClick={onLogout}
          className="text-sm text-gray-400 hover:text-gray-700 transition"
        >
          Sign out
        </button>
      )}
    </div>
  );
}
