"use client";

import { useState } from "react";
import { PlayerIndex } from "@/types/match";
import Coin from "./Coin";
import ScoreButton from "./ScoreButton";

interface CoinFlipScreenProps {
  player1Name: string;
  player2Name: string;
  onSelectServer: (server: PlayerIndex) => void;
  onBack: () => void;
}

type CoinSide = "heads" | "tails";
type Phase = "flip" | "winner-choice" | "opponent-choice";

export default function CoinFlipScreen({
  player1Name,
  player2Name,
  onSelectServer,
  onBack,
}: CoinFlipScreenProps) {
  const [phase, setPhase] = useState<Phase>("flip");
  const [flipping, setFlipping] = useState(false);
  const [result, setResult] = useState<CoinSide | null>(null);
  const [pendingResult, setPendingResult] = useState<CoinSide | null>(null);
  const [flipCount, setFlipCount] = useState(0);
  const [tossWinner, setTossWinner] = useState<PlayerIndex | null>(null);

  const handleFlip = () => {
    if (flipping) return;

    const nextResult: CoinSide = Math.random() < 0.5 ? "heads" : "tails";
    const winner: PlayerIndex = nextResult === "heads" ? 1 : 2;
    setFlipping(true);
    setResult(null);
    setPendingResult(nextResult);
    setTossWinner(null);
    setPhase("flip");
    setFlipCount((c) => c + 1);

    setTimeout(() => {
      setResult(nextResult);
      setTossWinner(winner);
      setFlipping(false);
      setPhase("winner-choice");
    }, 2400);
  };

  const handleWinnerChoice = (choice: "serve" | "receive" | "side") => {
    if (!tossWinner) return;
    const opponent: PlayerIndex = tossWinner === 1 ? 2 : 1;

    if (choice === "serve") {
      onSelectServer(tossWinner);
    } else if (choice === "receive") {
      onSelectServer(opponent);
    } else {
      setPhase("opponent-choice");
    }
  };

  const handleOpponentChoice = (choice: "serve" | "receive") => {
    if (!tossWinner) return;
    const opponent: PlayerIndex = tossWinner === 1 ? 2 : 1;

    if (choice === "serve") {
      onSelectServer(opponent);
    } else {
      onSelectServer(tossWinner);
    }
  };

  const playerName = (index: PlayerIndex) =>
    index === 1 ? player1Name : player2Name;

  const winnerName = tossWinner ? playerName(tossWinner) : "";
  const opponentName = tossWinner ? playerName(tossWinner === 1 ? 2 : 1) : "";

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
      </div>

      <div className="flex-1 min-h-0 flex flex-col items-center justify-center">
        <h2 className="text-xl font-semibold text-apple-gray-900 mb-1">猜边</h2>
        <p className="text-sm text-apple-gray-400 mb-2">抛硬币决定选择权</p>
        <p className="text-xs text-apple-gray-400 mb-6 text-center leading-relaxed">
          正面 = {player1Name}
          <br />
          反面 = {player2Name}
        </p>

        <Coin
          flipping={flipping}
          targetSide={flipping ? pendingResult : result}
          flipKey={flipCount}
        />

        {phase === "flip" && !tossWinner && (
          <div className="mt-6 w-full max-w-xs">
            <ScoreButton
              label={flipping ? "抛掷中…" : "抛硬币"}
              onClick={handleFlip}
              variant="secondary"
              size="md"
              disabled={flipping}
              className="w-full"
            />
          </div>
        )}

        {phase === "winner-choice" && tossWinner && !flipping && (
          <div className="w-full max-w-sm mt-6 animate-fade-in">
            <p className="text-center text-base font-semibold text-apple-gray-900 mb-4">
              {winnerName} 获得选择权
            </p>
            <div className="grid grid-cols-3 gap-2">
              <ScoreButton
                label="发球"
                onClick={() => handleWinnerChoice("serve")}
                variant="primary"
                size="md"
                className="w-full"
              />
              <ScoreButton
                label="接发"
                onClick={() => handleWinnerChoice("receive")}
                variant="primary"
                size="md"
                className="w-full !bg-[#5856D6] hover:!bg-[#4745B5]"
              />
              <ScoreButton
                label="选边"
                onClick={() => handleWinnerChoice("side")}
                variant="secondary"
                size="md"
                className="w-full"
              />
            </div>
            <button
              type="button"
              onClick={handleFlip}
              className="w-full mt-4 py-2 text-sm text-apple-gray-400 font-medium"
            >
              再抛一次
            </button>
          </div>
        )}

        {phase === "opponent-choice" && tossWinner && (
          <div className="w-full max-w-sm mt-6 animate-fade-in">
            <p className="text-center text-sm text-apple-gray-500 mb-1">
              {winnerName} 选择了选边
            </p>
            <p className="text-center text-base font-semibold text-apple-gray-900 mb-4">
              {opponentName} 选择发球或接发
            </p>
            <div className="grid grid-cols-2 gap-3">
              <ScoreButton
                label="发球"
                onClick={() => handleOpponentChoice("serve")}
                variant="primary"
                size="lg"
                className="w-full"
              />
              <ScoreButton
                label="接发"
                onClick={() => handleOpponentChoice("receive")}
                variant="primary"
                size="lg"
                className="w-full !bg-[#5856D6] hover:!bg-[#4745B5]"
              />
            </div>
            <button
              type="button"
              onClick={() => setPhase("winner-choice")}
              className="w-full mt-4 py-2 text-sm text-apple-gray-400 font-medium"
            >
              ← 返回上一步
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
