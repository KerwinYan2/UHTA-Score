"use client";

import { useEffect, useState } from "react";
import { MatchState, PlayerIndex, StatType } from "@/types/match";
import {
  formatDuration,
  formatGamesToWin,
  formatMatchFormatHeader,
  formatScoringMode,
  formatScoreLine,
  getScoreDisplay,
  getStatPointWinner,
  isDeuce,
  isGoldenPoint,
  scorePoint,
  undoLastAction,
} from "@/utils/scoringLogic";

interface MatchPageProps {
  match: MatchState;
  onUpdate: (match: MatchState) => void;
  onLeave: () => void;
  onEnd: () => void;
  onMatchComplete: (match: MatchState) => void;
  onReselectServer: () => void;
}

const STAT_ACTIONS: { type: StatType; label: string; tone: "mint" | "red" | "gold" }[] = [
  { type: "df", label: "双误", tone: "red" },
  { type: "ace", label: "ACE", tone: "mint" },
  { type: "winner", label: "制胜分", tone: "mint" },
  { type: "ue", label: "非受迫失误", tone: "gold" },
];

function MatchEndModal({
  match,
  onConfirm,
  onBack,
}: {
  match: MatchState;
  onConfirm: () => void;
  onBack: () => void;
}) {
  const winnerName =
    match.matchWinner === 1 ? match.player1.name : match.player2.name;
  const duration = formatDuration(Date.now() - match.startTime);
  const scoreDisplay = formatScoreLine(match.games);

  const tiebreakNote =
    match.games.player1 === match.tiebreakAt &&
    match.games.player2 === match.tiebreakAt &&
    (match.points.player1 > 0 || match.points.player2 > 0)
      ? " (抢七 " + match.points.player1 + "-" + match.points.player2 + ")"
      : "";

  return (
    <div className="modal-overlay">
      <div className="modal-sheet match-end-sheet max-h-[90dvh] overflow-hidden flex flex-col">
        <h2 className="text-4xl font-black text-[#111827] mb-6">比赛结束</h2>
        <p className="text-center text-2xl font-black text-[#111827] mb-5">
          {winnerName} {scoreDisplay}{tiebreakNote}
        </p>

        <div className="rounded-[8px] bg-white p-4 mb-5">
          <p className="text-center text-lg font-black text-[#111827] mb-3">本场统计</p>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[#111827]">
                <th className="text-left pb-2 font-black"></th>
                <th className="pb-2 font-black">{match.player1.name}</th>
                <th className="pb-2 font-black">{match.player2.name}</th>
              </tr>
            </thead>
            <tbody className="font-black text-[#111827]">
              <tr>
                <td className="py-1.5 text-apple-gray-400">制胜分</td>
                <td className="py-1.5 text-center tabular-nums">{match.player1.stats.winner}</td>
                <td className="py-1.5 text-center tabular-nums">{match.player2.stats.winner}</td>
              </tr>
              <tr>
                <td className="py-1.5 text-apple-gray-400">Ace</td>
                <td className="py-1.5 text-center tabular-nums">{match.player1.stats.ace}</td>
                <td className="py-1.5 text-center tabular-nums">{match.player2.stats.ace}</td>
              </tr>
              <tr>
                <td className="py-1.5 text-apple-gray-400">非受迫失误</td>
                <td className="py-1.5 text-center tabular-nums">{match.player1.stats.ue}</td>
                <td className="py-1.5 text-center tabular-nums">{match.player2.stats.ue}</td>
              </tr>
              <tr>
                <td className="py-1.5 text-apple-gray-400">双误</td>
                <td className="py-1.5 text-center tabular-nums">{match.player1.stats.df}</td>
                <td className="py-1.5 text-center tabular-nums">{match.player2.stats.df}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="flex justify-center gap-5 text-sm font-bold text-apple-gray-500 mb-6">
          <span>时长 {duration}</span>
          <span>{formatGamesToWin(match.gamesToWin)}</span>
          <span>{formatScoringMode(match.scoringMode)}</span>
        </div>

        <div className="grid grid-cols-[1fr_1.1fr] gap-3 items-center">
          <button
            type="button"
            onClick={onBack}
            className="h-14 rounded-[18px] text-base font-black text-[#111827]"
          >
            返回修改
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="h-14 rounded-[22px] bg-black text-base font-black text-white"
          >
            确认结束
          </button>
        </div>
      </div>
    </div>
  );
}

function ReselectServerModal({
  onConfirm,
  onCancel,
}: {
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="modal-overlay">
      <div className="modal-sheet reselect-server-sheet">
        <h2 className="text-2xl font-black text-[#111827]">重新选边？</h2>
        <p className="mt-3 text-sm font-bold leading-relaxed text-apple-gray-500">
          当前比分、局分和技术统计都会作废，重新选边。
        </p>
        <div className="mt-6 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="h-14 rounded-[18px] bg-[#F2F3F5] text-base font-black text-[#111827]"
          >
            继续比赛
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="h-14 rounded-[18px] bg-[#0E1320] text-base font-black text-white"
          >
            重新开始
          </button>
        </div>
      </div>
    </div>
  );
}

export default function MatchPage({
  match,
  onUpdate,
  onLeave,
  onEnd,
  onMatchComplete,
  onReselectServer,
}: MatchPageProps) {
  const [showEndModal, setShowEndModal] = useState(false);
  const [completedHandled, setCompletedHandled] = useState(false);
  const [showReselectModal, setShowReselectModal] = useState(false);

  const finished = !!match.matchWinner;
  const canUndo = match.history.length > 0;
  const deuce = isDeuce(match.points, match.isTiebreak);
  const goldenDeuce = isGoldenPoint(match.points, match.isTiebreak, match.scoringMode);

  const formatHeader = formatMatchFormatHeader(match.gamesToWin, match.scoringMode);
  const currentGame = Math.max(1, match.games.player1 + match.games.player2 + (finished ? 0 : 1));

  const p1Point = getScoreDisplay(
    match.points,
    1,
    match.isTiebreak,
    match.scoringMode
  );
  const p2Point = getScoreDisplay(
    match.points,
    2,
    match.isTiebreak,
    match.scoringMode
  );

  useEffect(() => {
    if (match.matchWinner && !completedHandled) {
      setShowEndModal(true);
      setCompletedHandled(true);
    }
  }, [match.matchWinner, completedHandled]);

  const handlePoint = (player: PlayerIndex) => {
    if (finished) return;
    onUpdate(scorePoint(match, player));
  };

  const handleStatClick = (player: PlayerIndex, type: StatType) => {
    if (finished) return;
    if ((type === "ace" || type === "df") && player !== match.currentServer) return;

    const { winner, statPlayer, statType } = getStatPointWinner(player, type);
    onUpdate(scorePoint(match, winner, { player: statPlayer, type: statType }));
  };

  const handleUndo = () => {
    if (!canUndo) return;
    onUpdate(undoLastAction(match));
    setShowEndModal(false);
    setCompletedHandled(false);
  };

  const handleConfirmEnd = () => {
    onMatchComplete(match);
    setShowEndModal(false);
    onEnd();
  };

  const handleBackToEdit = () => {
    handleUndo();
  };

  const handleReselectConfirm = () => {
    setShowReselectModal(false);
    onReselectServer();
  };

  const renderPlayerColumn = (player: PlayerIndex) => {
    const isPlayer1 = player === 1;
    const playerName = isPlayer1 ? match.player1.name : match.player2.name;
    const playerPoint = isPlayer1 ? p1Point : p2Point;
    const games = isPlayer1 ? match.games.player1 : match.games.player2;
    const serving = !finished && match.currentServer === player;

    return (
      <div className={"scorecard-player " + (serving ? "scorecard-player-serving" : "")}>
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-3xl font-black text-[#111827]">{playerName}</p>
          {serving && <span className="serve-dot">发球</span>}
        </div>
        <button
          type="button"
          onClick={() => handlePoint(player)}
          disabled={finished}
          className="point-score-card"
        >
          <span className="text-sm font-black text-apple-gray-400">当前分</span>
          <strong>{playerPoint}</strong>
        </button>
        <div className="text-center">
          <p className="text-xs font-black text-apple-gray-400">局分</p>
          <p className="text-3xl font-black tabular-nums text-[#111827]">{games}</p>
        </div>
      </div>
    );
  };

  const renderStatColumn = (player: PlayerIndex) => {
    return (
      <div className="grid gap-3">
        {STAT_ACTIONS.map((action) => {
          const serverOnly = action.type === "ace" || action.type === "df";
          const disabled = finished || (serverOnly && match.currentServer !== player);
          return (
            <button
              key={player + "-" + action.type}
              type="button"
              onClick={() => handleStatClick(player, action.type)}
              disabled={disabled}
              className={"match-action-btn match-action-" + action.tone}
            >
              {action.label}
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <div className="page-fill event-page match-page-v2">
      <div className="shrink-0 px-5 pt-5 pb-3">
        <div className="grid grid-cols-[80px_1fr_80px] items-center">
          <button
            type="button"
            onClick={onLeave}
            className="text-left text-sm font-semibold text-[#111827]"
          >
            &lt; 返回
          </button>
          <h1 className="text-center text-3xl font-black text-[#111827]">比赛记分</h1>
          <div className="justify-self-end rounded-full bg-[#DDFBF4] px-3 py-1 text-xs font-black text-[#10A98F]">
            计分中
          </div>
        </div>
      </div>

      <div className="match-main-panel">
        <div className="scoreboard-shell mb-4">
          <div className="flex items-center justify-between gap-3 text-sm font-bold text-apple-gray-400">
            <span>{formatHeader}</span>
            <span>记分人 {match.scorerName || "-"}</span>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-5">
            {renderPlayerColumn(1)}
            {renderPlayerColumn(2)}
          </div>

          <div className="mt-4 rounded-[8px] bg-white/70 px-4 py-3 text-center">
            <p className="text-sm font-black text-apple-gray-400">
              第1盘 · 第{currentGame}局
            </p>
            <p className="mt-1 text-4xl font-black tabular-nums text-[#111827]">
              {match.games.player1} : {match.games.player2}
            </p>
            {match.isTiebreak && !finished && (
              <p className="mt-1 text-sm font-black text-[#C68B00]">
                抢七 {match.points.player1}-{match.points.player2}
              </p>
            )}
          </div>
        </div>

        {deuce && !finished && match.scoringMode === "advantage" && (
          <p className="match-state-banner mb-3 rounded-[8px] bg-white px-4 py-3 text-center text-sm font-black text-apple-gray-500 shadow-apple">
            Deuce · 平分
          </p>
        )}
        {goldenDeuce && !finished && (
          <p className="match-state-banner mb-3 rounded-[8px] bg-[#FFF7DD] px-4 py-3 text-center text-sm font-black text-[#A97800] shadow-apple">
            金球 · 下一分决胜
          </p>
        )}

        <div className="match-actions-grid grid grid-cols-2 gap-4">
          {renderStatColumn(1)}
          {renderStatColumn(2)}
        </div>

        <div className="match-undo-row mt-4 grid grid-cols-[1fr_64px] gap-3">
          <button
            type="button"
            onClick={handleUndo}
            disabled={!canUndo}
            className="h-14 rounded-[8px] border border-[#D9A2B3] bg-white text-base font-black text-[#B94C68] disabled:opacity-40"
          >
            撤销记录
          </button>
          <button
            type="button"
            onClick={() => setShowReselectModal(true)}
            disabled={finished}
            className="h-14 rounded-[8px] border border-[#E0E4E2] bg-white text-xl font-black text-apple-gray-400 disabled:opacity-40"
            aria-label="重新选边"
          >
            ↶
          </button>
        </div>
      </div>

      {showReselectModal && (
        <ReselectServerModal
          onConfirm={handleReselectConfirm}
          onCancel={() => setShowReselectModal(false)}
        />
      )}

      {showEndModal && match.matchWinner && (
        <MatchEndModal
          match={match}
          onConfirm={handleConfirmEnd}
          onBack={handleBackToEdit}
        />
      )}
    </div>
  );
}
