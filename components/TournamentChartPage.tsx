"use client";

import { useEffect, useState } from "react";
import { Tournament } from "@/types/match";
import { authorizeAdminOperation, loadAdminSession, loginAdmin } from "@/utils/adminClient";
import { getTournamentPlayer } from "@/utils/tournamentLogic";
import PasswordErrorDialog from "./PasswordErrorDialog";

interface TournamentChartPageProps {
  tournament: Tournament;
  onAdmin: () => void;
  onDelete: (id: string) => void;
}

function formatTournamentName(name: string): string {
  return name.replace(/\s*Day[12]\s*$/i, "").trim() || name;
}

export default function TournamentChartPage({
  tournament,
  onAdmin,
  onDelete,
}: TournamentChartPageProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [actionUnlocked, setActionUnlocked] = useState(false);
  const [actionPassword, setActionPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    void loadAdminSession().then((session) => {
      setActionUnlocked(session.action);
    });
  }, []);

  const unlockAction = async () => {
    const ok = await loginAdmin("action", actionPassword);
    if (!ok) {
      setPasswordError("操作密码错误");
      return;
    }
    setActionUnlocked(true);
    setActionPassword("");
    setPasswordError(null);
  };

  const deleteTournament = async () => {
    const ok = await authorizeAdminOperation();
    if (!ok) {
      setActionUnlocked(false);
      setPasswordError("操作权限已失效，请重新输入密码");
      return;
    }
    onDelete(tournament.id);
  };

  const exportPng = async () => {
    if (exporting) return;
    setExporting(true);
    try {
      const canvas = renderTournamentPng(tournament);
      const blob = await canvasToBlob(canvas);
      const fileName = `${formatTournamentName(tournament.name)}-赛程图.png`;
      const file = new File([blob], fileName, { type: "image/png" });
      const shareNavigator = navigator as Navigator & {
        canShare?: (data: { files?: File[] }) => boolean;
        share?: (data: { files?: File[]; title?: string; text?: string }) => Promise<void>;
      };

      if (
        shareNavigator.share &&
        (!shareNavigator.canShare || shareNavigator.canShare({ files: [file] }))
      ) {
        await shareNavigator.share({
          files: [file],
          title: formatTournamentName(tournament.name),
          text: "赛事赛程图",
        });
      } else {
        downloadBlob(blob, fileName);
      }
    } catch (error) {
      if (!(error instanceof DOMException && error.name === "AbortError")) {
        setPasswordError("导出失败，请重试");
      }
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="page-fill event-page tournament-chart-page">
      <div className="chart-topbar">
        <button
          type="button"
          onClick={onAdmin}
          className="rounded-[18px] bg-[#0E1320] px-4 py-2 text-sm font-black text-white"
        >
          后台
        </button>
        <button
          type="button"
          onClick={exportPng}
          disabled={exporting}
          className="rounded-[18px] bg-[#F2F3F5] px-4 py-2 text-sm font-black text-[#111827]"
        >
          {exporting ? "导出中" : "导出PNG"}
        </button>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto px-5 pb-5 safe-bottom">
        <div className="mb-5">
          <p className="event-kicker">Draw Chart</p>
          <h1 className="event-title mt-2">{formatTournamentName(tournament.name)}</h1>
          <p className="mt-2 text-sm font-bold text-apple-gray-400">
            第{tournament.day}天 · {tournament.players.length}签 · 第{tournament.currentRound}轮
          </p>
        </div>

        <div className="chart-scroll">
          <div className="chart-board">
            {tournament.rounds.map((round, roundIndex) => (
              <section key={roundIndex} className="chart-round">
                <h2>第{roundIndex + 1}轮</h2>
                <div className="space-y-4">
                  {round.map((match, matchIndex) => {
                    const p1 = getTournamentPlayer(tournament, match.player1Id);
                    const p2 = getTournamentPlayer(tournament, match.player2Id);
                    const p1Won = match.winnerId === match.player1Id;
                    const p2Won = match.winnerId === match.player2Id;
                    return (
                      <article key={match.id} className="chart-match-card">
                        <div className="flex items-center justify-between text-xs font-black text-apple-gray-400">
                          <span>{matchIndex + 1}</span>
                          <span>{match.group === "winner" ? "胜者组" : match.group === "loser" ? "败者组" : match.group === "ranking" ? "排名组" : "主赛"}</span>
                        </div>
                        <div className="mt-3 space-y-2">
                          <div className={"chart-player " + (p1Won ? "is-winner" : "")}>
                            <span>{p1.name} <em>({p1.level.toFixed(1)})</em></span>
                            <strong>{match.record?.games.player1 ?? "-"}</strong>
                          </div>
                          <div className={"chart-player " + (p2Won ? "is-winner" : "")}>
                            <span>{p2.name} <em>({p2.level.toFixed(1)})</em></span>
                            <strong>{match.record?.games.player2 ?? "-"}</strong>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>
            ))}

            <section className="chart-standings">
              <h2>最终排名</h2>
              <div className="space-y-2">
                {tournament.standings.map((standing, index) => {
                  const player = getTournamentPlayer(tournament, standing.playerId);
                  return (
                    <div key={standing.playerId} className="chart-standing-row">
                      <span>{index + 1}</span>
                      <strong>{player.name}</strong>
                      <em>{standing.wins}胜{standing.losses}负</em>
                      <b>{standing.points}</b>
                      <small>{standing.netGames > 0 ? "+" : ""}{standing.netGames}</small>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>
        </div>

        <div className="chart-info-grid">
          <div>
            <span>赛制</span>
            <strong>{tournament.gamesToWin}局 · {tournament.scoringMode === "golden" ? "金球" : "占先"}</strong>
          </div>
          <div>
            <span>规则</span>
            <strong>胜者2分 / 负者1分</strong>
          </div>
          <div>
            <span>排序</span>
            <strong>积分 · 净胜局 · 总得局</strong>
          </div>
        </div>

        <div className="mt-5 rounded-[8px] border border-[#E1E7E4] bg-white p-3 shadow-apple">
          {!confirmDelete ? (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="w-full py-2 text-sm font-black text-[#B94C68]"
            >
              删除赛事记录
            </button>
          ) : actionUnlocked ? (
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="h-11 rounded-[8px] bg-[#F2F3F5] text-sm font-black text-apple-gray-500"
              >
                取消
              </button>
              <button
                type="button"
                onClick={deleteTournament}
                className="h-11 rounded-[8px] bg-[#FFE8EE] text-sm font-black text-[#B94C68]"
              >
                确认删除
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-[1fr_auto] gap-2">
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
                解锁
              </button>
            </div>
          )}
        </div>
      </div>
      <PasswordErrorDialog
        message={passwordError}
        onClose={() => setPasswordError(null)}
      />
    </div>
  );
}

function groupLabel(group: Tournament["rounds"][number][number]["group"]): string {
  if (group === "winner") return "胜者组";
  if (group === "loser") return "败者组";
  if (group === "ranking") return "排名组";
  return "主赛";
}

function renderTournamentPng(tournament: Tournament): HTMLCanvasElement {
  const roundWidth = 300;
  const standingsWidth = 360;
  const gap = 22;
  const margin = 36;
  const headerHeight = 124;
  const infoHeight = 110;
  const cardHeight = 86;
  const cardGap = 14;
  const maxRoundMatches = Math.max(...tournament.rounds.map((round) => round.length), 1);
  const boardHeight = 58 + maxRoundMatches * cardHeight + Math.max(0, maxRoundMatches - 1) * cardGap;
  const width = margin * 2 + tournament.rounds.length * roundWidth + tournament.rounds.length * gap + standingsWidth;
  const height = Math.max(760, headerHeight + boardHeight + infoHeight + margin);
  const scale = 2;
  const canvas = document.createElement("canvas");
  canvas.width = width * scale;
  canvas.height = height * scale;
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unavailable");
  ctx.scale(scale, scale);
  ctx.fillStyle = "#F6F8F6";
  ctx.fillRect(0, 0, width, height);

  drawText(ctx, formatTournamentName(tournament.name), margin, 52, 34, 900, "#0E1320");
  drawText(
    ctx,
    `第${tournament.day}天 · ${tournament.players.length}签 · 第${tournament.currentRound}轮`,
    margin,
    86,
    15,
    800,
    "#6B7280"
  );
  drawText(ctx, "胜者2分 / 负者1分 · 积分 / 净胜局 / 总得局排序", width - margin, 52, 14, 800, "#111827", "right");

  const top = headerHeight;
  tournament.rounds.forEach((round, roundIndex) => {
    const x = margin + roundIndex * (roundWidth + gap);
    drawPanel(ctx, x, top, roundWidth, boardHeight);
    drawRoundRect(ctx, x + 12, top + 12, roundWidth - 24, 38, 8, "#F7FAF9", "#E1E7E4");
    drawText(ctx, `第${roundIndex + 1}轮`, x + roundWidth / 2, top + 37, 18, 700, "#0E4EA8", "center");

    round.forEach((match, matchIndex) => {
      const y = top + 64 + matchIndex * (cardHeight + cardGap);
      const p1 = getTournamentPlayer(tournament, match.player1Id);
      const p2 = getTournamentPlayer(tournament, match.player2Id);
      const p1Won = match.winnerId === match.player1Id;
      const p2Won = match.winnerId === match.player2Id;

      drawRoundRect(ctx, x + 12, y, roundWidth - 24, cardHeight, 8, "#FFFFFF", "#E1E7E4");
      drawText(ctx, `${matchIndex + 1}`, x + 24, y + 22, 11, 800, "#6B7280");
      drawText(ctx, groupLabel(match.group), x + roundWidth - 24, y + 22, 11, 800, "#6B7280", "right");
      drawPlayerLine(ctx, `${p1.name} (${p1.level.toFixed(1)})`, match.record?.games.player1 ?? "-", x + 24, y + 50, roundWidth - 48, p1Won);
      drawPlayerLine(ctx, `${p2.name} (${p2.level.toFixed(1)})`, match.record?.games.player2 ?? "-", x + 24, y + 73, roundWidth - 48, p2Won);
    });
  });

  const standingsX = margin + tournament.rounds.length * (roundWidth + gap);
  drawPanel(ctx, standingsX, top, standingsWidth, boardHeight);
  drawRoundRect(ctx, standingsX + 12, top + 12, standingsWidth - 24, 38, 8, "#F7FAF9", "#E1E7E4");
  drawText(ctx, "最终排名", standingsX + standingsWidth / 2, top + 37, 18, 700, "#0E4EA8", "center");

  tournament.standings.forEach((standing, index) => {
    const player = getTournamentPlayer(tournament, standing.playerId);
    const rowY = top + 64 + index * 44;
    drawRoundRect(ctx, standingsX + 12, rowY, standingsWidth - 24, 34, 8, "#F7FAF9", "#E1E7E4");
    drawCircle(ctx, standingsX + 30, rowY + 17, 11, "#FFFFFF", "#E1E7E4");
    drawText(ctx, String(index + 1), standingsX + 30, rowY + 21, 10, 900, "#111827", "center");
    drawTextFit(ctx, player.name, standingsX + 48, rowY + 22, 98, 13, 800, "#111827");
    drawText(ctx, `${standing.wins}胜${standing.losses}负`, standingsX + 158, rowY + 22, 11, 700, "#4B5563");
    drawText(ctx, String(standing.points), standingsX + 236, rowY + 22, 12, 900, "#111827", "center");
    drawText(ctx, `${standing.netGames > 0 ? "+" : ""}${standing.netGames}`, standingsX + standingsWidth - 28, rowY + 22, 11, 900, standing.netGames < 0 ? "#B94C68" : "#108A47", "right");
  });

  const infoY = top + boardHeight + 22;
  const infoWidth = (width - margin * 2 - gap * 2) / 3;
  [
    ["赛制", `${tournament.gamesToWin}局 · ${tournament.scoringMode === "golden" ? "金球" : "占先"}`],
    ["规则", "胜者2分 / 负者1分"],
    ["排序", "积分 · 净胜局 · 总得局"],
  ].forEach(([label, value], index) => {
    const x = margin + index * (infoWidth + gap);
    drawRoundRect(ctx, x, infoY, infoWidth, 64, 8, "#FFFFFF", "#E1E7E4");
    drawText(ctx, label, x + 16, infoY + 24, 11, 900, "#6B7280");
    drawText(ctx, value, x + 16, infoY + 48, 14, 900, "#111827");
  });

  return canvas;
}

function drawPlayerLine(
  ctx: CanvasRenderingContext2D,
  name: string,
  score: number | string,
  x: number,
  y: number,
  width: number,
  winner: boolean
) {
  const color = winner ? "#0E4EA8" : "#111827";
  drawTextFit(ctx, name, x, y, width - 32, 13, 900, color);
  drawText(ctx, String(score), x + width, y, 18, 900, winner ? "#0E4EA8" : "#374151", "right");
}

function drawPanel(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number) {
  drawRoundRect(ctx, x, y, width, height, 10, "#FFFFFF", "#E1E7E4");
}

function drawText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  size: number,
  weight: number,
  color: string,
  align: CanvasTextAlign = "left"
) {
  ctx.font = `${weight} ${size}px -apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", sans-serif`;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = "alphabetic";
  ctx.fillText(text, x, y);
}

function drawTextFit(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  size: number,
  weight: number,
  color: string
) {
  let nextSize = size;
  while (nextSize > 8) {
    ctx.font = `${weight} ${nextSize}px -apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", sans-serif`;
    if (ctx.measureText(text).width <= maxWidth) break;
    nextSize -= 0.5;
  }
  drawText(ctx, text, x, y, nextSize, weight, color);
}

function drawRoundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
  fill: string,
  stroke: string
) {
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, radius);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 1;
  ctx.stroke();
}

function drawCircle(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  fill: string,
  stroke: string
) {
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = stroke;
  ctx.stroke();
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("PNG export failed"));
    }, "image/png");
  });
}

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
