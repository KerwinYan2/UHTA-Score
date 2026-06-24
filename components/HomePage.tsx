"use client";

import { useState } from "react";
import { GamesToWin, MatchSetup, PlayerIndex, ScoringMode } from "@/types/match";
import { formatGamesToWinDetail } from "@/utils/scoringLogic";
import CoinFlipScreen from "./CoinFlipScreen";
import ScoreButton from "./ScoreButton";

type Step = "entry" | "setup" | "coin";

interface HomePageProps {
  onStart: (setup: MatchSetup) => void;
  onResume: () => void;
  onAbandon: () => void;
  onHistory: () => void;
  hasSavedMatch: boolean;
}

interface PendingSetup {
  player1Name: string;
  player2Name: string;
  scorerName: string;
  gamesToWin: GamesToWin;
  scoringMode: ScoringMode;
}

export default function HomePage({
  onStart,
  onResume,
  onAbandon,
  onHistory,
  hasSavedMatch,
}: HomePageProps) {
  const [step, setStep] = useState<Step>("entry");
  const [pending, setPending] = useState<PendingSetup | null>(null);
  const [scorerName, setScorerName] = useState("");
  const [gamesToWin, setGamesToWin] = useState<GamesToWin>(4);
  const [scoringMode, setScoringMode] = useState<ScoringMode>("golden");

  const handleSetupSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    const p1 = (data.get("player1") as string)?.trim();
    const p2 = (data.get("player2") as string)?.trim();
    if (!p1 || !p2 || !scorerName.trim()) return;

    setPending({
      player1Name: p1,
      player2Name: p2,
      scorerName: scorerName.trim(),
      gamesToWin,
      scoringMode,
    });
    setStep("coin");
  };

  const handleSelectServer = (firstServer: PlayerIndex) => {
    if (!pending) return;
    onStart({ ...pending, firstServer });
  };

  if (step === "coin" && pending) {
    return (
      <CoinFlipScreen
        player1Name={pending.player1Name}
        player2Name={pending.player2Name}
        onSelectServer={handleSelectServer}
        onBack={() => setStep("setup")}
      />
    );
  }

  if (step === "setup") {
    return (
      <div className="page-fill event-page">
        <div className="flex items-center h-14 shrink-0 px-5">
          <button
            type="button"
            onClick={() => setStep("entry")}
            className="text-sm text-[#111827] font-semibold"
          >
            &lt; 返回
          </button>
        </div>

        <form onSubmit={handleSetupSubmit} className="page-fill min-h-0">
          <div className="flex-1 min-h-0 overflow-y-auto px-5 pb-4">
            <div className="mb-5">
              <p className="event-kicker">Match Setup</p>
              <h1 className="event-title mt-2">比赛信息</h1>
              <p className="mt-2 text-sm font-medium text-apple-gray-400">
                先录入比赛人员信息，再开始抛硬币选择发球方
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-5">
              <div className="event-stat-card">
                <span>赛制</span>
                <strong>{gamesToWin}局</strong>
              </div>
              <div className="event-stat-card">
                <span>计分</span>
                <strong>{scoringMode === "golden" ? "金球" : "占先"}</strong>
              </div>
              <div className="event-stat-card">
                <span>抢七</span>
                <strong>{gamesToWin === 4 ? "3-3" : "5-5"}</strong>
              </div>
            </div>

            <div className="setup-panel space-y-4">
              <div>
                <label htmlFor="player1" className="setup-label">
                  球员 A
                </label>
                <input
                  id="player1"
                  name="player1"
                  type="text"
                  placeholder="输入球员A姓名"
                  className="apple-input"
                  autoComplete="off"
                  required
                />
              </div>

              <div>
                <label htmlFor="player2" className="setup-label">
                  球员 B
                </label>
                <input
                  id="player2"
                  name="player2"
                  type="text"
                  placeholder="输入球员B姓名"
                  className="apple-input"
                  autoComplete="off"
                  required
                />
              </div>
            </div>

            <div className="mt-5">
              <span className="setup-label">赛制</span>
              <div className="grid grid-cols-2 gap-3">
                {([4, 6] as GamesToWin[]).map((games) => (
                  <button
                    key={games}
                    type="button"
                    onClick={() => setGamesToWin(games)}
                    className={
                      "option-card " +
                      (gamesToWin === games ? "option-card-checked" : "")
                    }
                  >
                    <span className="text-lg font-black">{games}局</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-5">
              <span className="setup-label">计分方式</span>
              <div className="grid grid-cols-2 gap-3">
                {(["golden", "advantage"] as ScoringMode[]).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setScoringMode(mode)}
                    className={
                      "option-card " +
                      (scoringMode === mode ? "option-card-checked" : "")
                    }
                  >
                    <span className="text-base font-black">
                      {mode === "golden" ? "金球" : "占先"}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <p className="mt-5 text-xs text-apple-gray-400 text-center leading-relaxed">
              {formatGamesToWinDetail(4)}
              <br />
              {formatGamesToWinDetail(6)}
            </p>
          </div>

          <div className="shrink-0 p-5 pt-3 safe-bottom bg-[#F6F8F6]">
            <ScoreButton
              label="抛硬币并开始"
              type="submit"
              variant="primary"
              size="lg"
              className="w-full !rounded-[18px] !bg-[#0E1320]"
            />
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="page-fill event-page">
      <div className="flex-1 min-h-0 overflow-y-auto px-5 py-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <p className="event-kicker">UHTA Singles</p>
            <h1 className="event-title mt-2">UHTA Score</h1>
            <p className="mt-2 text-sm font-medium text-apple-gray-400">
              超高压网球俱乐部 · 现场记分
            </p>
          </div>
          <button
            type="button"
            onClick={onHistory}
            className="rounded-[18px] bg-[#10D6B4] px-5 py-3 text-sm font-black text-[#05251F] shadow-apple"
          >
            历史
          </button>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-5">
          <div className="event-stat-card">
            <span>赛制</span>
            <strong>4/6</strong>
          </div>
          <div className="event-stat-card">
            <span>模式</span>
            <strong>单打</strong>
          </div>
          <div className="event-stat-card">
            <span>状态</span>
            <strong>赛前</strong>
          </div>
        </div>

        {hasSavedMatch && (
          <div className="mb-5 p-4 rounded-[18px] bg-white border border-[#E7ECEA] shadow-apple">
            <p className="text-sm font-bold text-[#0E1320] mb-3">发现未完成比赛</p>
            <div className="grid grid-cols-2 gap-3">
              <ScoreButton
                label="继续比赛"
                onClick={onResume}
                variant="primary"
                size="md"
                className="w-full !bg-[#0E1320]"
              />
              <ScoreButton
                label="放弃比赛"
                onClick={onAbandon}
                variant="secondary"
                size="md"
                className="w-full"
              />
            </div>
          </div>
        )}

        <div className="setup-panel">
          <label htmlFor="scorer" className="setup-label">
            记分人
          </label>
          <input
            id="scorer"
            type="text"
            value={scorerName}
            onChange={(e) => setScorerName(e.target.value)}
            placeholder="输入记分人姓名"
            className="apple-input"
            autoComplete="off"
          />
          <button
            type="button"
            onClick={() => {
              if (!scorerName.trim()) return;
              setStep("setup");
            }}
            disabled={!scorerName.trim()}
            className="mt-4 w-full rounded-[18px] bg-[#0E1320] px-5 py-4 text-base font-black text-white shadow-apple-lg transition active:scale-[0.98] disabled:bg-[#9CA3AF] disabled:shadow-none"
          >
            创建比赛
          </button>
        </div>
      </div>
    </div>
  );
}
