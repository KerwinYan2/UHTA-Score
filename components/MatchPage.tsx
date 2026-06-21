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
import ScoreButton from "./ScoreButton";
import StatPicker from "./StatPicker";

interface MatchPageProps {
  match: MatchState;
  onUpdate: (match: MatchState) => void;
  onLeave: () => void;
  onEnd: () => void;
  onMatchComplete: (match: MatchState) => void;
}

const STAT_TYPES: { type: StatType; label: string }[] = [
  { type: "ace", label: "ACE" },
  { type: "winner", label: "Winner" },
  { type: "ue", label: "UE" },
  { type: "df", label: "DF" },
];

function MatchEndModal({
  match,
  onClose,
}: {
  match: MatchState;
  onClose: () => void;
}) {
  const winnerName =
    match.matchWinner === 1 ? match.player1.name : match.player2.name;
  const duration = formatDuration(Date.now() - match.startTime);
  const scoreDisplay = formatScoreLine(match.games);

  const tiebreakNote =
    match.games.player1 === match.tiebreakAt &&
    match.games.player2 === match.tiebreakAt &&
    (match.points.player1 > 0 || match.points.player2 > 0)
      ? ` (抢七 ${match.points.player1}-${match.points.player2})`
      : "";

  return (
    <div className="modal-overlay">
      <div className="modal-sheet max-h-[90dvh] overflow-hidden flex flex-col">
        <div className="text-center mb-4">
          <p className="text-3xl mb-2">🏆</p>
          <h2 className="text-2xl font-bold text-apple-gray-900">{winnerName}</h2>
          <p className="text-sm text-apple-gray-500 mt-1">比赛结束 · 获胜</p>
        </div>

        <div className="text-center mb-4">
          <p className="text-4xl font-bold tabular-nums text-apple-gray-900">
            {scoreDisplay}{tiebreakNote}
          </p>
          <p className="text-sm text-apple-gray-500 mt-2">
            {match.player1.name} vs {match.player2.name}
          </p>
        </div>

        <div className="flex justify-center gap-6 text-sm text-apple-gray-500 mb-4">
          <span>时长 {duration}</span>
          <span>{formatGamesToWin(match.gamesToWin)}</span>
          <span>{formatScoringMode(match.scoringMode)}</span>
        </div>

        <div className="glass-card p-3 mb-4">
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
            <tbody>
              <tr className="border-t border-apple-gray-100">
                <td className="py-1.5 font-medium truncate max-w-[80px]">{match.player1.name}</td>
                <td className="py-1.5 text-center tabular-nums">{match.player1.stats.ace}</td>
                <td className="py-1.5 text-center tabular-nums">{match.player1.stats.winner}</td>
                <td className="py-1.5 text-center tabular-nums">{match.player1.stats.ue}</td>
                <td className="py-1.5 text-center tabular-nums">{match.player1.stats.df}</td>
              </tr>
              <tr className="border-t border-apple-gray-100">
                <td className="py-1.5 font-medium truncate max-w-[80px]">{match.player2.name}</td>
                <td className="py-1.5 text-center tabular-nums">{match.player2.stats.ace}</td>
                <td className="py-1.5 text-center tabular-nums">{match.player2.stats.winner}</td>
                <td className="py-1.5 text-center tabular-nums">{match.player2.stats.ue}</td>
                <td className="py-1.5 text-center tabular-nums">{match.player2.stats.df}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <ScoreButton
          label="返回首页"
          onClick={onClose}
          variant="primary"
          size="lg"
          className="w-full"
        />
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
}: MatchPageProps) {
  const [pendingStat, setPendingStat] = useState<StatType | null>(null);
  const [showEndModal, setShowEndModal] = useState(false);
  const [completedHandled, setCompletedHandled] = useState(false);

  const finished = !!match.matchWinner;
  const canUndo = match.history.length > 0 && !finished;
  const deuce = isDeuce(match.points, match.isTiebreak);
  const goldenDeuce = isGoldenPoint(match.points, match.isTiebreak, match.scoringMode);

  const p1Serving = !finished && match.currentServer === 1;
  const p2Serving = !finished && match.currentServer === 2;

  const formatHeader = formatMatchFormatHeader(match.gamesToWin, match.scoringMode);

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
      onMatchComplete(match);
    }
  }, [match, completedHandled, onMatchComplete]);

  const handlePoint = (player: PlayerIndex) => {
    if (finished) return;
    onUpdate(scorePoint(match, player));
  };

  const handleStatClick = (type: StatType) => {
    if (finished) return;

    // ACE / DF only apply to the current server — no picker needed
    if (type === "ace" || type === "df") {
      const server = match.currentServer;
      const { winner, statPlayer, statType } = getStatPointWinner(server, type);
      onUpdate(scorePoint(match, winner, { player: statPlayer, type: statType }));
      return;
    }

    setPendingStat(type);
  };

  const handleStatSelect = (player: PlayerIndex) => {
    if (!pendingStat || finished) return;
    const { winner, statPlayer, statType } = getStatPointWinner(player, pendingStat);
    onUpdate(scorePoint(match, winner, { player: statPlayer, type: statType }));
    setPendingStat(null);
  };

  const handleUndo = () => {
    onUpdate(undoLastAction(match));
  };

  const handleCloseEnd = () => {
    setShowEndModal(false);
    onEnd();
  };

  return (
    <div className="page-fill match-page">
      {/* Top bar: serve indicator */}
      <div className="shrink-0 px-4 pt-1 pb-1">
        <div className="flex items-center justify-between h-10">
          <button
            type="button"
            onClick={onLeave}
            className="text-sm text-apple-blue font-medium min-w-[60px]"
          >
            ← 首页
          </button>
          <div className="text-center flex-1 min-w-0 px-2">
            <p className="text-sm font-semibold text-apple-gray-900 truncate">
              {formatHeader}
            </p>
            {match.isTiebreak && !finished && (
              <p className="text-xs text-orange-600 font-medium">
                抢七 {match.points.player1}-{match.points.player2}
              </p>
            )}
          </div>
          <div className="min-w-[60px]" />
        </div>

        {deuce && !finished && match.scoringMode === "advantage" && (
          <p className="text-center text-xs font-medium text-apple-gray-500 py-1">
            Deuce · 平分
          </p>
        )}
        {goldenDeuce && !finished && (
          <p className="text-center text-xs font-medium text-amber-600 py-1">
            金球 · 下一分决胜
          </p>
        )}
      </div>

      {/* Player columns — 分数 2/5 · 得分 3/10 · 留白 · ACE */}
      <div className="match-scoring-zone">
        <div className="player-side-column">
          <div className="player-column-top">
            <p className="text-lg font-semibold text-apple-gray-900 truncate w-full text-center px-1">
              {match.player1.name}
            </p>
            <span
              className={`text-[10px] font-semibold uppercase tracking-wider h-4 leading-4 ${
                p1Serving ? "text-apple-blue" : "invisible"
              }`}
            >
              发球
            </span>
          </div>
          <div
            className={[
              "player-side-highlight",
              p1Serving ? "player-column-serving-blue" : "",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            <div className="player-column-score-area">
              <div className="score-display-lg">{p1Point}</div>
              <div className="text-center mt-1">
                <p className="games-display">{match.games.player1}</p>
                <p className="text-[10px] text-apple-gray-300 uppercase">局分</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => handlePoint(1)}
              disabled={finished}
              className="score-btn score-btn-blue"
            >
              得分
            </button>
          </div>
        </div>

        <div className="player-side-column">
          <div className="player-column-top">
            <p className="text-lg font-semibold text-apple-gray-900 truncate w-full text-center px-1">
              {match.player2.name}
            </p>
            <span
              className={`text-[10px] font-semibold uppercase tracking-wider h-4 leading-4 ${
                p2Serving ? "text-[#5856D6]" : "invisible"
              }`}
            >
              发球
            </span>
          </div>
          <div
            className={[
              "player-side-highlight",
              p2Serving ? "player-column-serving-purple" : "",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            <div className="player-column-score-area">
              <div className="score-display-lg">{p2Point}</div>
              <div className="text-center mt-1">
                <p className="games-display">{match.games.player2}</p>
                <p className="text-[10px] text-apple-gray-300 uppercase">局分</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => handlePoint(2)}
              disabled={finished}
              className="score-btn score-btn-purple"
            >
              得分
            </button>
          </div>
        </div>
      </div>

      <div className="match-content-gap" aria-hidden />

      {/* Bottom toolbar: stats + undo */}
      <div className="shrink-0 safe-bottom border-t border-apple-gray-100 bg-white">
        <div className="match-stats-row">
          <div className="grid grid-cols-4 gap-2 w-full">
            {STAT_TYPES.map(({ type, label }) => (
              <button
                key={type}
                type="button"
                onClick={() => handleStatClick(type)}
                disabled={finished}
                className="match-stat-btn"
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex justify-center pb-1 px-3">
          <ScoreButton
            label="撤销"
            onClick={handleUndo}
            variant="ghost"
            size="sm"
            disabled={!canUndo}
          />
        </div>
      </div>

      {pendingStat && (
        <StatPicker
          statLabel={STAT_TYPES.find((s) => s.type === pendingStat)?.label ?? pendingStat}
          player1Name={match.player1.name}
          player2Name={match.player2.name}
          onSelect={handleStatSelect}
          onClose={() => setPendingStat(null)}
        />
      )}

      {showEndModal && match.matchWinner && (
        <MatchEndModal match={match} onClose={handleCloseEnd} />
      )}
    </div>
  );
}
