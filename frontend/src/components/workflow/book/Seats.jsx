import { useState } from "react";
import ActionButton from "../ActionButton";
import WrongAction from "../WrongAction";

const TYPE_STYLES = {
  standard: "border-gray-300 bg-white hover:border-gray-400 text-gray-700",
  preferred: "border-amber-300 bg-amber-50 hover:border-amber-400 text-amber-800",
  economyPlus: "border-purple-300 bg-purple-50 hover:border-purple-400 text-purple-800",
  exit: "border-green-300 bg-green-50 hover:border-green-400 text-green-800",
};

const TYPE_LABELS = {
  standard: "Available",
  preferred: "Preferred (+$25)",
  economyPlus: "Economy Plus (+$45)",
  exit: "Exit Row (+$25)",
};

export default function BookSeats({ onAdvance, workflowData, updateData, workflow }) {
  const [wrong, setWrong] = useState(false);
  const { seatMap, screens } = workflow;
  const selected = workflowData.selectedSeat || null;

  function selectSeat(row, col) {
    const seatId = `${row.row}${col}`;
    if (row.occupied.includes(col)) {
      setWrong(true);
      return;
    }
    updateData("selectedSeat", { id: seatId, row: row.row, col, type: row.type, fee: row.fee });
  }

  return (
    <div className="space-y-4">
      <h2 className="text-base font-semibold text-gray-800">Seat Selection</h2>
      <div className="flex gap-4 text-xs text-gray-500 flex-wrap">
        {Object.entries(TYPE_LABELS).map(([type, label]) => (
          <div key={type} className="flex items-center gap-1.5">
            <span className={`w-3.5 h-3.5 rounded border ${TYPE_STYLES[type]}`} />
            {label}
          </div>
        ))}
        <div className="flex items-center gap-1.5">
          <span className="w-3.5 h-3.5 rounded border border-gray-300 bg-gray-200" />
          Occupied
        </div>
      </div>

      <div className="border border-gray-200 rounded-xl p-4 bg-gray-50 space-y-2">
        {seatMap.rows.map(row => (
          <div key={row.row} className="flex items-center gap-2">
            <span className="w-6 text-xs text-gray-400 font-medium">{row.row}</span>
            <div className="flex gap-1.5">
              {seatMap.columns.map((col, i) => {
                const occupied = row.occupied.includes(col);
                const isSelected = selected?.id === `${row.row}${col}`;
                const isAisle = seatMap.aisleColumns.includes(col);
                return (
                  <div key={col} className="flex items-center">
                    <button
                      onClick={() => selectSeat(row, col)}
                      disabled={occupied}
                      className={`w-9 h-9 rounded-lg border text-xs font-semibold transition ${
                        occupied
                          ? "border-gray-300 bg-gray-200 text-gray-400 cursor-not-allowed"
                          : isSelected
                          ? "border-blue-500 bg-blue-600 text-white"
                          : TYPE_STYLES[row.type]
                      }`}
                    >
                      {col}
                    </button>
                    {isAisle && col === "C" && <span className="w-3" />}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {wrong && <WrongAction onDismiss={() => setWrong(false)} />}

      {selected && (
        <div className="border border-blue-200 bg-blue-50 rounded-xl p-3 text-sm text-blue-800 flex items-center justify-between">
          <span>
            Selected seat <strong>{selected.id}</strong> — {TYPE_LABELS[selected.type]}
            {seatMap.aisleColumns.includes(selected.col) ? " · Aisle" : " · Window/Middle"}
          </span>
        </div>
      )}

      {selected && (
        <div className="flex gap-2">
          <ActionButton label={screens.seats.advanceLabel} variant="primary" onClick={onAdvance} />
          {screens.seats.wrongButtons.map(label => (
            <ActionButton key={label} label={label} onClick={() => setWrong(true)} />
          ))}
        </div>
      )}
    </div>
  );
}
