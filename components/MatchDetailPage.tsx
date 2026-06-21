"use client";

import { useState } from "react";
import { MatchRecord } from "@/types/match";
import {
  formatDuration,
  formatGamesToWinDetail,
  formatScoringMode,
  formatScoreLine,
} from "@/utils/scoringLogic";
import ScoreButton from "./ScoreButton";

interface MatchDetailPageProps {
  record: MatchRecord;
  onBack: () => void;
  onDelete: (id: string) => void;
}

function formatDateTime(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export default function MatchDetailPage({ record, onBack, onDelete }: MatchDetailPageProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const winnerName = record.winner === 1 ? record.player1Name : record.player2Name;
  const scoreDisplay = record.tiebreakScore
    ? `${formatScoreLine(record.games)} (抢七 ${record.tiebreakScore.player1}-${record.tiebreakScore.player2})`
    : formatScoreLine(record.games);

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
          比赛详情
        </span>
        <div className="w-12" />
      </div>

      <div className="flex-1 min-h-0 flex flex-col gap-4 overflow-y-auto">
        <div className="glass-card p-5 text-center">
          <p className="text-2xl font-bold text-apple-gray-900 mb-1">🏆 {winnerName}</p>
          <p className="text-sm text-apple-gray-500">获胜</p>
          <p className="text-3xl font-bold tabular-nums text-apple-gray-900 mt-4">{scoreDisplay}</p>
          <p className="text-sm text-apple-gray-500 mt-2">
            {record.player1Name} vs {record.player2Name}
          </p>
        </div>

        <div className="glass-card p-4 space-y-3">
          {record.scorerName && (
            <div className="flex justify-between text-sm">
              <span className="text-apple-gray-400">记分人</span>
              <span className="font-medium">{record.scorerName}</span>
            </div>
          )}
          <div className="flex justify-between text-sm">
            <span className="text-apple-gray-400">比赛时长</span>
            <span className="font-medium tabular-nums">{formatDuration(record.durationMs)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-apple-gray-400">赛制</span>
            <span className="font-medium">{formatGamesToWinDetail(record.gamesToWin)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-apple-gray-400">计分</span>
            <span className="font-medium">{formatScoringMode(record.scoringMode)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-apple-gray-400">开始</span>
            <span className="font-medium text-xs">{formatDateTime(record.startTime)}</span>
          </div>
        </div>

        <div className="glass-card p-4">
          <p className="text-xs font-medium text-apple-gray-400 uppercase tracking-wider mb-3">
            技术统计
          </p>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-apple-gray-400 text-xs">
                <th className="text-left pb-2 font-medium">球员</th>
                <th className="pb-2 font-medium">ACE</th>
                <th className="pb-2 font-medium">Win</th>
                <th className="pb-2 font-medium">UE</th>
                <th className="pb-2 font-medium">DF</th>
              </tr>
            </thead>
            <tbody className="text-apple-gray-900">
              <tr className="border-t border-apple-gray-100">
                <td className="py-2 font-medium truncate max-w-[90px]">{record.player1Name}</td>
                <td className="py-2 text-center tabular-nums">{record.player1Stats.ace}</td>
                <td className="py-2 text-center tabular-nums">{record.player1Stats.winner}</td>
                <td className="py-2 text-center tabular-nums">{record.player1Stats.ue}</td>
                <td className="py-2 text-center tabular-nums">{record.player1Stats.df}</td>
              </tr>
              <tr className="border-t border-apple-gray-100">
                <td className="py-2 font-medium truncate max-w-[90px]">{record.player2Name}</td>
                <td className="py-2 text-center tabular-nums">{record.player2Stats.ace}</td>
                <td className="py-2 text-center tabular-nums">{record.player2Stats.winner}</td>
                <td className="py-2 text-center tabular-nums">{record.player2Stats.ue}</td>
                <td className="py-2 text-center tabular-nums">{record.player2Stats.df}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="shrink-0 pt-3 safe-bottom space-y-2">
        {confirmDelete ? (
          <div className="grid grid-cols-2 gap-3">
            <ScoreButton
              label="取消"
              onClick={() => setConfirmDelete(false)}
              variant="secondary"
              size="lg"
              className="w-full"
            />
            <ScoreButton
              label="确认删除"
              onClick={() => onDelete(record.id)}
              variant="danger"
              size="lg"
              className="w-full"
            />
          </div>
        ) : (
          <>
            <ScoreButton
              label="删除记录"
              onClick={() => setConfirmDelete(true)}
              variant="danger"
              size="md"
              className="w-full"
            />
            <ScoreButton
              label="返回历史"
              onClick={onBack}
              variant="secondary"
              size="lg"
              className="w-full"
            />
          </>
        )}
      </div>
    </div>
  );
}
