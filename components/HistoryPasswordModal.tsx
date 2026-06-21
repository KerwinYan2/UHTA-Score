"use client";

import { useState } from "react";
import ScoreButton from "./ScoreButton";

export const HISTORY_PASSWORD = "11224455";
const UNLOCK_KEY = "uhta-history-unlocked";

export function isHistoryUnlocked(): boolean {
  if (typeof window === "undefined") return false;
  return sessionStorage.getItem(UNLOCK_KEY) === "1";
}

export function unlockHistory(): void {
  if (typeof window !== "undefined") {
    sessionStorage.setItem(UNLOCK_KEY, "1");
  }
}

interface HistoryPasswordModalProps {
  onSuccess: () => void;
  onClose: () => void;
}

export default function HistoryPasswordModal({
  onSuccess,
  onClose,
}: HistoryPasswordModalProps) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === HISTORY_PASSWORD) {
      unlockHistory();
      onSuccess();
    } else {
      setError(true);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-semibold text-apple-gray-900 text-center mb-1">
          历史记录
        </h2>
        <p className="text-sm text-apple-gray-400 text-center mb-4">请输入访问密码</p>

        <form onSubmit={handleSubmit}>
          <input
            type="password"
            inputMode="numeric"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError(false);
            }}
            placeholder="密码"
            className="apple-input mb-2"
            autoFocus
            autoComplete="off"
          />
          {error && (
            <p className="text-sm text-red-500 text-center mb-2">密码错误</p>
          )}
          <ScoreButton
            label="确认"
            type="submit"
            variant="primary"
            size="lg"
            className="w-full"
          />
        </form>

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
