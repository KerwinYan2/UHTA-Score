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
      <div className="page-fill px-4">
        <div className="flex items-center h-12 shrink-0">
          <button
            type="button"
            onClick={() => setStep("entry")}
            className="text-sm text-apple-blue font-medium"
          >
            ← 返回
          </button>
        </div>

        <form onSubmit={handleSetupSubmit} className="page-fill flex flex-col min-h-0">
          <div className="flex-1 min-h-0 flex flex-col gap-4 overflow-hidden">
            <h1 className="text-2xl font-semibold text-apple-gray-900">比赛设置</h1>

            <div>
              <label htmlFor="player1" className="block text-xs font-medium text-apple-gray-400 uppercase tracking-wider mb-2">
                球员 A
              </label>
              <input
                id="player1"
                name="player1"
                type="text"
                placeholder="球员A"
                className="apple-input"
                autoComplete="off"
                required
              />
            </div>

            <div>
              <label htmlFor="player2" className="block text-xs font-medium text-apple-gray-400 uppercase tracking-wider mb-2">
                球员 B
              </label>
              <input
                id="player2"
                name="player2"
                type="text"
                placeholder="球员B"
                className="apple-input"
                autoComplete="off"
                required
              />
            </div>

            <div>
              <span className="block text-xs font-medium text-apple-gray-400 uppercase tracking-wider mb-2">
                赛制
              </span>
              <div className="grid grid-cols-2 gap-3">
                {([4, 6] as GamesToWin[]).map((games) => (
                  <button
                    key={games}
                    type="button"
                    onClick={() => setGamesToWin(games)}
                    className={`option-card ${gamesToWin === games ? "option-card-checked" : ""}`}
                  >
                    <span className="text-lg font-semibold">{games}局</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <span className="block text-xs font-medium text-apple-gray-400 uppercase tracking-wider mb-2">
                计分方式
              </span>
              <div className="grid grid-cols-2 gap-3">
                {(["golden", "advantage"] as ScoringMode[]).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setScoringMode(mode)}
                    className={`option-card ${scoringMode === mode ? "option-card-checked" : ""}`}
                  >
                    <span className="text-base font-semibold">
                      {mode === "golden" ? "金球" : "占先"}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <p className="text-xs text-apple-gray-400 text-center leading-relaxed">
              {formatGamesToWinDetail(4)}
              <br />
              {formatGamesToWinDetail(6)}
            </p>
          </div>

          <div className="shrink-0 pt-3 safe-bottom">
            <ScoreButton
              label="开始比赛"
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
            />
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="page-fill px-4">
      <div className="flex-1 min-h-0 flex flex-col items-center justify-center">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-apple-lg bg-gradient-to-br from-apple-blue to-[#5856D6] shadow-apple-lg mb-4">
            <span className="text-3xl">🎾</span>
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-apple-gray-900">
            UHTA Score
          </h1>
          <p className="text-apple-gray-400 mt-2 text-sm">超高压网球俱乐部 · 现场记分</p>
        </div>

        {hasSavedMatch && (
          <div className="w-full max-w-sm mb-6 p-4 rounded-apple-lg bg-apple-blue/5 border border-apple-blue/20">
            <p className="text-sm text-apple-gray-600 mb-3 text-center">发现未完成比赛</p>
            <div className="grid grid-cols-2 gap-3">
              <ScoreButton
                label="继续比赛"
                onClick={onResume}
                variant="primary"
                size="md"
                className="w-full"
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

        <div className="w-full max-w-sm space-y-3">
          <input
            type="text"
            value={scorerName}
            onChange={(e) => setScorerName(e.target.value)}
            placeholder="记分人"
            className="apple-input"
            autoComplete="off"
          />
          <ScoreButton
            label="开始比赛"
            onClick={() => {
              if (!scorerName.trim()) return;
              setStep("setup");
            }}
            variant="primary"
            size="lg"
            className="w-full"
            disabled={!scorerName.trim()}
          />
          <ScoreButton
            label="历史记录"
            onClick={onHistory}
            variant="secondary"
            size="lg"
            className="w-full"
          />
        </div>
      </div>
    </div>
  );
}
