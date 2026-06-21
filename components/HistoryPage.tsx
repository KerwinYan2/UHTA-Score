"use client";

import { useState } from "react";
import { MatchRecord } from "@/types/match";
import { formatGamesToWin, formatScoringMode, formatScoreLine } from "@/utils/scoringLogic";

interface HistoryPageProps {
  records: MatchRecord[];
  loading?: boolean;
  cloudEnabled?: boolean;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onBack: () => void;
  onRefresh?: () => void;
}

function formatDate(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function HistoryPage({
  records,
  loading = false,
  cloudEnabled = false,
  onSelect,
  onDelete,
  onBack,
  onRefresh,
}: HistoryPageProps) {
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const handleDelete = (id: string) => {
    onDelete(id);
    setConfirmDeleteId(null);
  };

  return (
    <div className="page-fill px-4">
      <div className="flex items-center h-12 shrink-0">
        <button
          type="button"
          onClick={onBack}
          className="text-sm text-apple-blue font-medium"
        >
          ← 返回
        </button>
        <span className="flex-1 text-center text-sm font-semibold text-apple-gray-900">
          历史记录
          {cloudEnabled && (
            <span className="block text-[10px] font-normal text-apple-gray-400">
              云端同步
            </span>
          )}
        </span>
        {onRefresh ? (
          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            className="text-sm text-apple-blue font-medium w-12 text-right disabled:opacity-40"
          >
            {loading ? "…" : "刷新"}
          </button>
        ) : (
          <div className="w-12" />
        )}
      </div>

      {loading && records.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-apple-blue border-t-transparent animate-spin" />
        </div>
      ) : (
      <div className="flex-1 min-h-0 overflow-y-auto">
        {records.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm text-apple-gray-400">暂无比赛记录</p>
          </div>
        ) : (
          <div className="space-y-3 pb-4">
            {records.map((record) => {
              const winnerName =
                record.winner === 1 ? record.player1Name : record.player2Name;
              const isConfirming = confirmDeleteId === record.id;

              return (
                <div key={record.id} className="glass-card overflow-hidden">
                  <button
                    type="button"
                    onClick={() => onSelect(record.id)}
                    className="w-full p-4 text-left active:bg-apple-gray-50 transition-colors"
                  >
                    <p className="text-xs text-apple-gray-400 mb-1">
                      {formatDate(record.endTime)}
                    </p>
                    <p className="text-base font-semibold text-apple-gray-900">
                      {record.player1Name} vs {record.player2Name}
                    </p>
                    <p className="text-sm text-apple-gray-600 mt-1">
                      {formatScoreLine(record.games)}
                    </p>
                    <p className="text-sm text-apple-gray-500 mt-0.5">
                      Winner: {winnerName}
                    </p>
                    {record.scorerName && (
                      <p className="text-xs text-apple-gray-400 mt-1">
                        记分: {record.scorerName}
                      </p>
                    )}
                    <p className="text-xs text-apple-gray-400 mt-0.5">
                      {formatGamesToWin(record.gamesToWin)} {formatScoringMode(record.scoringMode)}
                    </p>
                  </button>

                  {isConfirming ? (
                    <div className="flex border-t border-apple-gray-100">
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(null)}
                        className="flex-1 py-3 text-sm text-apple-gray-500 font-medium"
                      >
                        取消
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(record.id)}
                        className="flex-1 py-3 text-sm text-red-600 font-semibold border-l border-apple-gray-100"
                      >
                        确认删除
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(record.id)}
                      className="w-full py-2.5 text-xs text-red-500 font-medium border-t border-apple-gray-100 active:bg-red-50"
                    >
                      删除
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
      )}
    </div>
  );
}
