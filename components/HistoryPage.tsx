"use client";

import { useEffect, useMemo, useState } from "react";
import { MatchRecord, Tournament } from "@/types/match";
import { authorizeAdminOperation, loadAdminSession, loginAdmin } from "@/utils/adminClient";
import { formatGamesToWin, formatScoringMode, formatScoreLine } from "@/utils/scoringLogic";
import PasswordErrorDialog from "./PasswordErrorDialog";

interface HistoryPageProps {
  records: MatchRecord[];
  loading?: boolean;
  cloudEnabled?: boolean;
  tournaments?: Tournament[];
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onSelectTournament?: (id: string) => void;
  onBack: () => void;
  onRefresh?: () => void;
}

function formatDate(ts: number): string {
  const d = new Date(ts);
  return (
    d.getFullYear() +
    "-" +
    String(d.getMonth() + 1).padStart(2, "0") +
    "-" +
    String(d.getDate()).padStart(2, "0")
  );
}

function formatRound(index: number): string {
  const group = index % 2 === 0 ? "A组" : "B组";
  const round = Math.floor(index / 2) + 1;
  return group + " R" + round;
}

function formatTournamentName(name: string): string {
  return name.replace(/\s*Day[12]\s*$/i, "").trim() || name;
}

export default function HistoryPage({
  records,
  loading = false,
  cloudEnabled = false,
  tournaments = [],
  onSelect,
  onDelete,
  onSelectTournament,
  onBack,
  onRefresh,
}: HistoryPageProps) {
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [actionUnlocked, setActionUnlocked] = useState(false);
  const [actionPassword, setActionPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const latestDate = records[0] ? formatDate(records[0].endTime) : formatDate(Date.now());
  const latestWinner = records[0]
    ? records[0].winner === 1
      ? records[0].player1Name
      : records[0].player2Name
    : "待定";

  const groups = useMemo(() => {
    return records.reduce(
      (acc, record, index) => {
        acc[index % 2 === 0 ? 0 : 1].push({ record, index });
        return acc;
      },
      [[], []] as { record: MatchRecord; index: number }[][]
    );
  }, [records]);

  useEffect(() => {
    void loadAdminSession().then((session) => {
      setActionUnlocked(session.action);
    });
  }, []);

  const handleDelete = async (id: string) => {
    if (!actionUnlocked) return;
    const ok = await authorizeAdminOperation();
    if (!ok) {
      setActionUnlocked(false);
      setPasswordError("删除权限已失效，请重新输入密码");
      return;
    }
    onDelete(id);
    setConfirmDeleteId(null);
  };

  const unlockAction = async () => {
    const ok = await loginAdmin("action", actionPassword);
    if (!ok) {
      setPasswordError("删除密码错误");
      return;
    }
    setActionUnlocked(true);
    setActionPassword("");
    setPasswordError(null);
  };

  return (
    <div className="page-fill event-page">
      <div className="flex items-center justify-between h-14 shrink-0 px-5">
        <button
          type="button"
          onClick={onBack}
          className="text-sm text-[#111827] font-semibold"
        >
          &lt; 返回
        </button>
        {onRefresh ? (
          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            className="rounded-[18px] bg-[#10D6B4] px-4 py-2 text-sm font-black text-[#05251F] disabled:opacity-50"
          >
            {loading ? "同步中" : "刷新"}
          </button>
        ) : (
          <div className="w-16" />
        )}
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto px-5 pb-5 safe-bottom">
        <div className="mb-5">
          <p className="event-kicker">8 Draw Singles</p>
          <h1 className="event-title mt-2">比赛历史</h1>
          <p className="mt-2 text-sm font-medium text-apple-gray-400">
            {latestDate} · 小组赛 + 淘汰赛晋级路径
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="event-stat-card">
            <span>单场</span>
            <strong>{records.length}</strong>
          </div>
          <div className="event-stat-card">
            <span>赛事</span>
            <strong>{tournaments.length}</strong>
          </div>
          <div className="event-stat-card">
            <span>{cloudEnabled ? "同步" : "最近冠军"}</span>
            <strong className="truncate">{latestWinner}</strong>
          </div>
        </div>

        <section className="tournament-panel mb-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black text-[#111827]">删除权限</h2>
            {actionUnlocked && (
              <span className="text-xs font-black text-[#10A98F]">已解锁</span>
            )}
          </div>
          <div className="mt-4 grid grid-cols-[1fr_auto] gap-2">
            <input
              value={actionPassword}
              onChange={(event) => setActionPassword(event.target.value)}
              type="password"
              placeholder={actionUnlocked ? "删除权限已解锁" : "删除密码"}
              disabled={actionUnlocked}
              className="apple-input"
            />
            <button
              type="button"
              onClick={unlockAction}
              disabled={actionUnlocked}
              className="rounded-[8px] bg-[#0E1320] px-4 text-sm font-black text-white disabled:bg-[#9CA3AF]"
            >
              {actionUnlocked ? "已解锁" : "解锁"}
            </button>
          </div>
        </section>

        {tournaments.length > 0 && (
          <section className="mb-6">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-2xl font-black text-[#0E1320]">赛事记录</h2>
            </div>
            <div className="space-y-3">
              {tournaments.map((tournament) => (
                <article key={tournament.id} className="tournament-record-row">
                  <button
                    type="button"
                    onClick={() => onSelectTournament?.(tournament.id)}
                    className="tournament-record-main"
                  >
                    <strong>{formatTournamentName(tournament.name)}</strong>
                    <span>
                      第{tournament.day}天 · {tournament.players.length}签 ·
                      第{tournament.currentRound}轮 ·
                      {tournament.status === "completed" ? " 已结束" : " 进行中"}
                    </span>
                  </button>
                </article>
              ))}
            </div>
          </section>
        )}

        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-2xl font-black text-[#0E1320]">单场记录</h2>
          {loading && records.length > 0 && (
            <span className="text-xs font-black text-[#10A98F]">同步中</span>
          )}
        </div>

        {loading && records.length === 0 ? (
          <div className="flex h-64 items-center justify-center">
            <div className="w-8 h-8 rounded-full border-2 border-[#10D6B4] border-t-transparent animate-spin" />
          </div>
        ) : records.length === 0 ? (
          <div className="history-empty-card">
            <p className="text-lg font-black text-[#111827]">暂无比赛记录</p>
            <p className="mt-2 text-sm font-medium text-apple-gray-400">
              完成一场比赛后，这里会自动生成赛程卡片
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 pb-4">
            {groups.map((groupRecords, groupIndex) => (
              <div key={groupIndex} className="min-w-0">
                <p className="mb-2 text-lg font-black text-[#10A98F]">
                  {groupIndex === 0 ? "A组" : "B组"}
                </p>
                <div className="space-y-4">
                  {groupRecords.map(({ record, index }) => {
                    const winner = record.winner === 1 ? 1 : 2;
                    const isConfirming = confirmDeleteId === record.id;
                    const score = formatScoreLine(record.games);
                    const tiebreak = record.tiebreakScore
                      ? " 抢七 " + record.tiebreakScore.player1 + "-" + record.tiebreakScore.player2
                      : "";

                    return (
                      <article key={record.id} className="history-match-card">
                        <div className="flex items-center justify-between gap-2 text-xs font-bold text-apple-gray-400">
                          <span>{formatRound(index)}</span>
                          <span>{formatDate(record.endTime)}</span>
                          <span>已结束</span>
                        </div>

                        <div className="mt-4 space-y-2">
                          <div className="history-player-row">
                            <span className={winner === 1 ? "text-[#10A98F]" : ""}>
                              {record.player1Name}
                            </span>
                            <strong>{record.games.player1}</strong>
                          </div>
                          <div className="history-player-row">
                            <span className={winner === 2 ? "text-[#10A98F]" : ""}>
                              {record.player2Name}
                            </span>
                            <strong>{record.games.player2}</strong>
                          </div>
                        </div>

                        <p className="mt-3 min-h-[18px] text-xs font-bold text-apple-gray-400">
                          {formatGamesToWin(record.gamesToWin)} · {formatScoringMode(record.scoringMode)} · {score}{tiebreak}
                        </p>

                        {isConfirming ? (
                          <div className="mt-4 grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(null)}
                              className="h-11 rounded-[8px] bg-[#F2F3F5] text-sm font-black text-apple-gray-500"
                            >
                              取消
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(record.id)}
                              className="h-11 rounded-[8px] bg-[#FFE8EE] text-sm font-black text-[#B94C68]"
                            >
                              删除
                            </button>
                          </div>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => onSelect(record.id)}
                              className="mt-4 w-full rounded-[8px] bg-[#0E1320] px-3 py-3 text-base font-black text-white active:scale-[0.98]"
                            >
                              查看详情
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(record.id)}
                              disabled={!actionUnlocked}
                              className="mt-2 w-full py-1.5 text-xs font-bold text-[#B94C68]"
                            >
                              {actionUnlocked ? "删除记录" : "删除需密码"}
                            </button>
                          </>
                        )}
                      </article>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <PasswordErrorDialog
        message={passwordError}
        onClose={() => setPasswordError(null)}
      />
    </div>
  );
}
