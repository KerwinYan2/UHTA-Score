"use client";

import { useEffect, useMemo, useState } from "react";
import {
  GamesToWin,
  RatedPlayer,
  ScoringMode,
  Tournament,
  TournamentMatch,
  TournamentFormat,
} from "@/types/match";
import { authorizeAdminOperation, loadAdminSession, loginAdmin } from "@/utils/adminClient";
import { createRatedPlayer, getTournamentPlayer } from "@/utils/tournamentLogic";
import PasswordErrorDialog from "./PasswordErrorDialog";

interface TournamentPageProps {
  players: RatedPlayer[];
  tournaments: Tournament[];
  activeTournament: Tournament | null;
  onBack: () => void;
  onSavePlayers: (players: RatedPlayer[]) => void;
  onCreateTournament: (options: {
    name: string;
    day: Tournament["day"];
    format: TournamentFormat;
    playerIds: string[];
    gamesToWin: GamesToWin;
    scoringMode: ScoringMode;
  }) => void;
  onOpenTournament: (id: string) => void;
  onOpenMatch: (tournamentId: string, matchId: string) => void;
  onOpenChart: (tournamentId: string) => void;
  onHistory: () => void;
  onCreateMatch: () => void;
}

const FORMAT_LABELS: Record<TournamentFormat, string> = {
  swiss: "瑞士轮",
  "round-robin": "单循环",
  "mixed-points": "混合积分",
};

function formatTournamentName(name: string): string {
  return name.replace(/\s*Day[12]\s*$/i, "").trim() || name;
}

function sortTournamentMatches(a: TournamentMatch, b: TournamentMatch): number {
  const aCompleted = a.status === "completed";
  const bCompleted = b.status === "completed";
  if (aCompleted !== bCompleted) return aCompleted ? 1 : -1;

  if (!aCompleted && !bCompleted) {
    if (b.round !== a.round) return b.round - a.round;
    const statusOrder: Record<TournamentMatch["status"], number> = {
      active: 0,
      pending: 1,
      completed: 2,
    };
    if (statusOrder[a.status] !== statusOrder[b.status]) {
      return statusOrder[a.status] - statusOrder[b.status];
    }
    return a.createdAt - b.createdAt;
  }

  return (b.completedAt ?? 0) - (a.completedAt ?? 0);
}

export default function TournamentPage({
  players,
  tournaments,
  activeTournament,
  onBack,
  onSavePlayers,
  onCreateTournament,
  onOpenTournament,
  onOpenMatch,
  onOpenChart,
  onHistory,
  onCreateMatch,
}: TournamentPageProps) {
  const [backendUnlocked, setBackendUnlocked] = useState(false);
  const [actionUnlocked, setActionUnlocked] = useState(false);
  const [backendPassword, setBackendPassword] = useState("");
  const [actionPassword, setActionPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [showPlayerLibrary, setShowPlayerLibrary] = useState(false);
  const [newPlayerName, setNewPlayerName] = useState("");
  const [newPlayerLevel, setNewPlayerLevel] = useState("3.0");
  const [eventName, setEventName] = useState("超高压混单积分赛");
  const [selectedIds, setSelectedIds] = useState<string[]>(players.slice(0, 8).map((p) => p.id));
  const [format, setFormat] = useState<TournamentFormat>("mixed-points");
  const [day, setDay] = useState<Tournament["day"]>(1);
  const [gamesToWin, setGamesToWin] = useState<GamesToWin>(4);
  const [scoringMode, setScoringMode] = useState<ScoringMode>("golden");

  const visibleMatches = activeTournament
    ? [...activeTournament.rounds.flat()].sort(sortTournamentMatches)
    : [];

  const completedMatches = activeTournament
    ? activeTournament.rounds.flat().filter((match) => match.status === "completed").length
    : 0;

  const sortedPlayers = useMemo(
    () => [...players].sort((a, b) => b.level - a.level || a.name.localeCompare(b.name)),
    [players]
  );

  useEffect(() => {
    void loadAdminSession().then((session) => {
      setBackendUnlocked(session.backend);
      setActionUnlocked(session.action);
    });
  }, []);

  const canRunAdminOperation = async () => {
    const ok = await authorizeAdminOperation();
    if (!ok) setActionUnlocked(false);
    return ok;
  };

  const togglePlayer = (id: string) => {
    setSelectedIds((current) => {
      if (current.includes(id)) return current.filter((item) => item !== id);
      if (current.length >= 8) return current;
      return [...current, id];
    });
  };

  const updatePlayerLevel = async (id: string, level: number) => {
    if (!actionUnlocked) return;
    if (!(await canRunAdminOperation())) return;
    onSavePlayers(
      players.map((player) =>
        player.id === id ? { ...player, level, updatedAt: Date.now() } : player
      )
    );
  };

  const addPlayer = async () => {
    if (!actionUnlocked) return;
    if (!(await canRunAdminOperation())) return;
    const name = newPlayerName.trim();
    const level = Number(newPlayerLevel);
    if (!name || Number.isNaN(level)) return;
    onSavePlayers([...players, createRatedPlayer(name, level)]);
    setNewPlayerName("");
  };

  const deletePlayer = async (id: string) => {
    if (!actionUnlocked) return;
    if (!(await canRunAdminOperation())) return;
    onSavePlayers(players.filter((player) => player.id !== id));
    setSelectedIds((current) => current.filter((playerId) => playerId !== id));
  };

  const createEvent = () => {
    if (selectedIds.length !== 8) return;
    onCreateTournament({
      name: eventName.trim() || "超高压混单积分赛",
      day,
      format,
      playerIds: selectedIds,
      gamesToWin,
      scoringMode,
    });
  };

  const unlockBackend = async () => {
    const ok = await loginAdmin("backend", backendPassword);
    if (!ok) {
      setPasswordError("后台密码错误");
      return;
    }

    setBackendUnlocked(true);
    setBackendPassword("");
    setPasswordError(null);
  };

  const unlockAction = async () => {
    const ok = await loginAdmin("action", actionPassword);
    if (!ok) {
      setPasswordError("操作密码错误");
      return;
    }

    setActionUnlocked(true);
    setShowPlayerLibrary(true);
    setActionPassword("");
    setPasswordError(null);
  };

  const getMatchStatus = (match: TournamentMatch) => {
    if (match.status === "completed") return "已结束";
    if (match.status === "active") return "计分中";
    return "未开始";
  };

  const getScore = (match: TournamentMatch, player: 1 | 2) => {
    const games = match.record?.games ?? match.matchState?.games;
    if (!games) return "-";
    return player === 1 ? games.player1 : games.player2;
  };

  return (
    <div className="page-fill event-page tournament-page">
      <div className="flex items-center justify-between h-14 shrink-0 px-5">
        {backendUnlocked ? (
          <button
            type="button"
            onClick={onBack}
            className="text-sm text-[#111827] font-semibold"
          >
            &lt; 返回
          </button>
        ) : (
          <div className="w-12" />
        )}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onHistory}
            className="rounded-[18px] bg-[#10D6B4] px-4 py-2 text-sm font-black text-[#05251F]"
          >
            历史
          </button>
          {backendUnlocked && (
            <button
              type="button"
              onClick={onCreateMatch}
              className="rounded-[18px] bg-[#0E1320] px-4 py-2 text-sm font-black text-white"
            >
              单场
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto px-5 pb-5 safe-bottom">
        <div className="mb-5">
          <p className="event-kicker">Tournament</p>
          <h1 className="event-title mt-2">赛事中心</h1>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-5">
          <div className="event-stat-card">
            <span>签位</span>
            <strong>16</strong>
          </div>
          <div className="event-stat-card">
            <span>每日</span>
            <strong>8签</strong>
          </div>
          <div className="event-stat-card">
            <span>赛程</span>
            <strong>2天</strong>
          </div>
        </div>

        {activeTournament && (
          <section className="tournament-panel mb-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase text-apple-gray-400">
                  当前赛事
                </p>
                <h2 className="mt-1 text-2xl font-black text-[#111827]">
                  {formatTournamentName(activeTournament.name)}
                </h2>
                <p className="mt-1 text-sm font-bold text-apple-gray-400">
                  第{activeTournament.day}天 · {FORMAT_LABELS[activeTournament.format]} ·
                  第 {activeTournament.currentRound} 轮
                </p>
              </div>
              <button
                type="button"
                onClick={() => onOpenChart(activeTournament.id)}
                className="rounded-[18px] bg-[#0E1320] px-4 py-3 text-sm font-black text-white"
              >
                赛程图
              </button>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-3">
              <div className="mini-metric">
                <span>完成</span>
                <strong>{completedMatches}</strong>
              </div>
              <div className="mini-metric">
                <span>轮次</span>
                <strong>{activeTournament.rounds.length}</strong>
              </div>
              <div className="mini-metric">
                <span>状态</span>
                <strong>{activeTournament.status === "completed" ? "结束" : "进行"}</strong>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              {visibleMatches.map((match) => {
                const p1 = getTournamentPlayer(activeTournament, match.player1Id);
                const p2 = getTournamentPlayer(activeTournament, match.player2Id);
                const p1Won = match.winnerId === match.player1Id;
                const p2Won = match.winnerId === match.player2Id;
                return (
                  <button
                    key={match.id}
                    type="button"
                    onClick={() => onOpenMatch(activeTournament.id, match.id)}
                    className="tournament-match-card-btn"
                  >
                    <div className="tournament-match-meta">
                      <span>R{match.round}</span>
                      <span>主赛场</span>
                      <span>{getMatchStatus(match)}</span>
                    </div>
                    <div className={"tournament-match-player " + (p1Won ? "is-winner" : "")}>
                      <strong>{p1.name}</strong>
                      <b>{getScore(match, 1)}</b>
                    </div>
                    <div className={"tournament-match-player " + (p2Won ? "is-winner" : "")}>
                      <strong>{p2.name}</strong>
                      <b>{getScore(match, 2)}</b>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {!activeTournament && !backendUnlocked && (
          <section className="tournament-panel mb-5">
            <h2 className="text-xl font-black text-[#111827]">暂无赛事</h2>
            <p className="mt-2 text-sm font-bold text-apple-gray-400">
              管理员登录后创建比赛
            </p>
            <div className="mt-4 grid grid-cols-[1fr_auto] gap-2">
              <input
                value={backendPassword}
                onChange={(event) => setBackendPassword(event.target.value)}
                type="password"
                placeholder="后台密码"
                className="apple-input"
              />
              <button
                type="button"
                onClick={unlockBackend}
                className="rounded-[8px] bg-[#0E1320] px-4 text-sm font-black text-white"
              >
                进入后台
              </button>
            </div>
          </section>
        )}

        {activeTournament && !backendUnlocked && (
          <section className="tournament-panel mb-5">
            <h2 className="text-xl font-black text-[#111827]">管理员模式</h2>
            <div className="mt-4 grid grid-cols-[1fr_auto] gap-2">
              <input
                value={backendPassword}
                onChange={(event) => setBackendPassword(event.target.value)}
                type="password"
                placeholder="后台密码"
                className="apple-input"
              />
              <button
                type="button"
                onClick={unlockBackend}
                className="rounded-[8px] bg-[#0E1320] px-4 text-sm font-black text-white"
              >
                进入后台
              </button>
            </div>
          </section>
        )}

        {!activeTournament && backendUnlocked && (
          <section className="tournament-panel mb-5">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-black text-[#111827]">创建赛事</h2>
              <span className="text-sm font-black text-[#10A98F]">
                {selectedIds.length}/8
              </span>
            </div>

            <div className="mt-4">
              <input
                value={eventName}
                onChange={(event) => setEventName(event.target.value)}
                placeholder="赛事名称"
                className="apple-input"
              />
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              {([1, 2] as const).map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setDay(item)}
                  className={"option-card " + (day === item ? "option-card-checked" : "")}
                >
                  <span className="font-black">第{item}天</span>
                </button>
              ))}
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2">
              {(["mixed-points", "swiss", "round-robin"] as TournamentFormat[]).map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setFormat(item)}
                  className={"tournament-format-btn " + (format === item ? "is-active" : "")}
                >
                  {FORMAT_LABELS[item]}
                </button>
              ))}
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              {([4, 6] as GamesToWin[]).map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setGamesToWin(item)}
                  className={"option-card " + (gamesToWin === item ? "option-card-checked" : "")}
                >
                  <span className="font-black">{item}局</span>
                </button>
              ))}
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              {(["golden", "advantage"] as ScoringMode[]).map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setScoringMode(item)}
                  className={"option-card " + (scoringMode === item ? "option-card-checked" : "")}
                >
                  <span className="font-black">{item === "golden" ? "金球" : "占先"}</span>
                </button>
              ))}
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2">
              {sortedPlayers.map((player) => (
                <button
                  key={player.id}
                  type="button"
                  onClick={() => togglePlayer(player.id)}
                  className={"player-pick " + (selectedIds.includes(player.id) ? "is-active" : "")}
                >
                  <strong>{player.name}</strong>
                  <span>{player.level.toFixed(1)}</span>
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={createEvent}
              disabled={selectedIds.length !== 8}
              className="mt-4 w-full rounded-[18px] bg-[#0E1320] px-5 py-4 text-base font-black text-white disabled:bg-[#9CA3AF]"
            >
              随机生成分组
            </button>
          </section>
        )}

        {backendUnlocked && (
          <section className="tournament-panel mb-5">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-black text-[#111827]">管理工具</h2>
              <span className="text-xs font-black text-[#10A98F]">已进入后台</span>
            </div>

            {!showPlayerLibrary ? (
              <div className="mt-4 grid grid-cols-[1fr_auto] gap-2">
                <input
                  value={actionPassword}
                  onChange={(event) => setActionPassword(event.target.value)}
                  type="password"
                  placeholder="操作密码"
                  className="apple-input"
                />
                <button
                  type="button"
                  onClick={unlockAction}
                  className="rounded-[8px] bg-[#0E1320] px-4 text-sm font-black text-white"
                >
                  打开球员库
                </button>
              </div>
            ) : (
              <div className="mt-5 border-t border-[#E1E7E4] pt-5">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-black text-[#111827]">球员库</h3>
                  <span className="text-xs font-black text-[#10A98F]">已解锁</span>
                </div>

                <div className="mt-4 grid grid-cols-[1fr_76px_auto] gap-2">
                  <input
                    value={newPlayerName}
                    onChange={(event) => setNewPlayerName(event.target.value)}
                    placeholder="球员姓名"
                    className="apple-input"
                  />
                  <input
                    value={newPlayerLevel}
                    onChange={(event) => setNewPlayerLevel(event.target.value)}
                    inputMode="decimal"
                    className="apple-input px-2 text-center"
                  />
                  <button
                    type="button"
                    onClick={addPlayer}
                    className="rounded-[8px] bg-[#10D6B4] px-4 text-sm font-black text-[#05251F]"
                  >
                    添加
                  </button>
                </div>

                <div className="mt-4 space-y-2">
                  {sortedPlayers.map((player) => (
                    <div key={player.id} className="player-admin-row">
                      <span>{player.name}</span>
                      <input
                        value={player.level}
                        onChange={(event) =>
                          updatePlayerLevel(player.id, Number(event.target.value))
                        }
                        inputMode="decimal"
                      />
                      <button
                        type="button"
                        onClick={() => deletePlayer(player.id)}
                      >
                        删除
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        {tournaments.length > 0 && (
          <section className="tournament-panel">
            <h2 className="text-xl font-black text-[#111827]">赛事记录</h2>
            <div className="mt-4 space-y-2">
              {tournaments.map((tournament) => (
                  <article key={tournament.id} className="tournament-record-row">
                    <button
                      type="button"
                      onClick={() => onOpenTournament(tournament.id)}
                      className="tournament-record-main"
                    >
                      <strong>{formatTournamentName(tournament.name)}</strong>
                      <span>
                        第{tournament.day}天 · {FORMAT_LABELS[tournament.format]} ·
                        {tournament.status === "completed" ? "已结束" : "进行中"}
                      </span>
                    </button>
                  </article>
              ))}
            </div>
          </section>
        )}
      </div>

      <PasswordErrorDialog
        message={passwordError}
        onClose={() => setPasswordError(null)}
      />
    </div>
  );
}
