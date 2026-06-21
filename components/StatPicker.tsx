"use client";

import { PlayerIndex, StatType } from "@/types/match";
import ScoreButton from "./ScoreButton";

interface StatPickerProps {
  statLabel: string;
  player1Name: string;
  player2Name: string;
  onSelect: (player: PlayerIndex) => void;
  onClose: () => void;
}

export default function StatPicker({
  statLabel,
  player1Name,
  player2Name,
  onSelect,
  onClose,
}: StatPickerProps) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
        <p className="text-center text-sm text-apple-gray-400 mb-1">记录给谁？</p>
        <p className="text-center text-lg font-semibold text-apple-gray-900 mb-4">{statLabel}</p>
        <div className="grid grid-cols-2 gap-3">
          <ScoreButton
            label={player1Name}
            onClick={() => onSelect(1)}
            variant="primary"
            size="lg"
            className="w-full"
          />
          <ScoreButton
            label={player2Name}
            onClick={() => onSelect(2)}
            variant="primary"
            size="lg"
            className="w-full !bg-[#5856D6] hover:!bg-[#4745B5]"
          />
        </div>
        <button
          type="button"
          onClick={onClose}
          className="w-full mt-3 py-3 text-sm text-apple-gray-400 font-medium"
        >
          取消
        </button>
      </div>
    </div>
  );
}

export type { StatType };
