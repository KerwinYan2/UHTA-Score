"use client";

import { type CSSProperties, useEffect, useState } from "react";
import { PlayerIndex } from "@/types/match";
import ScoreButton from "./ScoreButton";

interface CoinFlipScreenProps {
  player1Name: string;
  player2Name: string;
  onSelectServer: (server: PlayerIndex) => void;
  onBack: () => void;
}

type CoinSide = "heads" | "tails";
type Phase = "pick" | "winner-choice" | "opponent-choice";

const SPIN_DURATION_MS = 1280;
const REEL_ITEM_HEIGHT = 28;
const REEL_REST_INDEX = 3;
const REEL_FINAL_INDEX = 53;
const REEL_ITEM_COUNT = REEL_FINAL_INDEX + 8;

const SIDE_LABELS: Record<CoinSide, string> = {
  heads: "HEADS",
  tails: "TAILS",
};

function vibrate(pattern: number | number[]) {
  if (typeof window === "undefined") return;
  const navigatorWithVibrate = window.navigator as Navigator & {
    vibrate?: (pattern: number | number[]) => boolean;
  };
  navigatorWithVibrate.vibrate?.(pattern);
}

function getOpponent(player: PlayerIndex): PlayerIndex {
  return player === 1 ? 2 : 1;
}

function getOppositeSide(side: CoinSide): CoinSide {
  return side === "heads" ? "tails" : "heads";
}

function buildReelSequence(result: CoinSide): CoinSide[] {
  const other: CoinSide = result === "heads" ? "tails" : "heads";
  const sequence: CoinSide[] = [];

  for (let index = 0; index < REEL_ITEM_COUNT; index += 1) {
    sequence.push(index % 2 === REEL_FINAL_INDEX % 2 ? result : other);
  }

  return sequence;
}

function buildRestSequence(side: CoinSide): CoinSide[] {
  const other = getOppositeSide(side);
  return [other, side, other, side, other, side, other];
}

export default function CoinFlipScreen({
  player1Name,
  player2Name,
  onSelectServer,
  onBack,
}: CoinFlipScreenProps) {
  const [phase, setPhase] = useState<Phase>("pick");
  const [rolling, setRolling] = useState(false);
  const [caller, setCaller] = useState<PlayerIndex>(1);
  const [calledSide, setCalledSide] = useState<CoinSide>("heads");
  const [resultSide, setResultSide] = useState<CoinSide>("heads");
  const [spinResult, setSpinResult] = useState<CoinSide | null>(null);
  const [spinKey, setSpinKey] = useState(0);
  const [tossWinner, setTossWinner] = useState<PlayerIndex | null>(null);

  const opponent = getOpponent(caller);

  useEffect(() => {
    if (!rolling || !spinResult) return;

    const timeout = window.setTimeout(() => {
      setResultSide(spinResult);
      setTossWinner(spinResult === calledSide ? caller : opponent);
      setRolling(false);
      setPhase("winner-choice");
      vibrate([18, 28, 22]);
    }, SPIN_DURATION_MS);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [calledSide, caller, opponent, rolling, spinResult]);

  const handleRoll = () => {
    if (rolling) return;
    const result: CoinSide = Math.random() < 0.5 ? "heads" : "tails";
    setSpinResult(result);
    setSpinKey((key) => key + 1);
    setTossWinner(null);
    setPhase("pick");
    setRolling(true);
    vibrate([8, 34, 8, 42, 10]);
  };

  const resetTossResult = () => {
    setTossWinner(null);
    setSpinResult(null);
    setPhase("pick");
  };

  const handleCallerSelect = (player: PlayerIndex) => {
    if (rolling) return;
    setCaller(player);
    resetTossResult();
  };

  const handleCalledSideSelect = (side: CoinSide) => {
    if (rolling) return;
    setCalledSide(side);
    setResultSide(side);
    resetTossResult();
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
  const callerName = playerName(caller);
  const opponentNameForToss = playerName(opponent);
  const opponentSide = getOppositeSide(calledSide);
  const reelItems: CoinSide[] =
    rolling && spinResult
      ? buildReelSequence(spinResult)
      : buildRestSequence(resultSide);
  const reelFinalY = rolling
    ? -(REEL_FINAL_INDEX * REEL_ITEM_HEIGHT + REEL_ITEM_HEIGHT / 2)
    : -(REEL_REST_INDEX * REEL_ITEM_HEIGHT + REEL_ITEM_HEIGHT / 2);

  return (
    <div className="page-fill event-page toss-page">
      <div className="flex items-center h-14 shrink-0 px-5">
        <button
          type="button"
          onClick={onBack}
          className="text-sm text-[#111827] font-semibold"
        >
          &lt; 返回
        </button>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto px-5 pb-5 safe-bottom">
        <div className="toss-header mb-6">
          <p className="event-kicker">Coin Toss</p>
          <h1 className="event-title mt-2">选择权</h1>
        </div>

        <div className="toss-panel">
          <div className="toss-choice-block">
            <span>猜边球员</span>
            <div className="toss-choice-grid">
              {([1, 2] as PlayerIndex[]).map((player) => (
                <button
                  key={player}
                  type="button"
                  onClick={() => handleCallerSelect(player)}
                  disabled={rolling}
                  className={caller === player ? "is-active" : ""}
                >
                  {playerName(player)}
                </button>
              ))}
            </div>
          </div>

          <div className="toss-choice-block mt-4">
            <span>{callerName}</span>
            <div className="toss-choice-grid">
              {(["heads", "tails"] as CoinSide[]).map((side) => (
                <button
                  key={side}
                  type="button"
                  onClick={() => handleCalledSideSelect(side)}
                  disabled={rolling}
                  className={calledSide === side ? "is-active" : ""}
                >
                  {SIDE_LABELS[side]}
                </button>
              ))}
            </div>
          </div>

          <div className="toss-assignment">
            <strong>{callerName}</strong>
            <span>{SIDE_LABELS[calledSide]}</span>
            <strong>{opponentNameForToss}</strong>
            <span>{SIDE_LABELS[opponentSide]}</span>
          </div>

          <div className={"toss-reel " + (rolling ? "is-rolling" : "")}>
            <div className="toss-reel-fade toss-reel-fade-top" />
            <div className="toss-reel-selection" />
            <div className="toss-reel-fade toss-reel-fade-bottom" />
            <div
              key={spinKey}
              className="toss-reel-track"
              style={{ "--reel-final-y": reelFinalY + "px" } as CSSProperties}
            >
              {reelItems.map((side, index) => (
                <button
                  key={index + side}
                  type="button"
                  onClick={() => handleCalledSideSelect(side)}
                  disabled={rolling}
                  className={!rolling && index === REEL_REST_INDEX ? "is-selected" : ""}
                >
                  <span>{SIDE_LABELS[side]}</span>
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={handleRoll}
            disabled={rolling}
            className="mt-5 w-full rounded-[18px] bg-[#0E1320] px-5 py-4 text-base font-black text-white shadow-apple-lg transition active:scale-[0.98] disabled:bg-[#9CA3AF]"
          >
            {rolling ? "ROLLING" : tossWinner ? "重新滚动" : "开始滚动"}
          </button>
        </div>

        {phase === "winner-choice" && tossWinner && !rolling && (
          <div className="setup-panel toss-result-panel mt-5 animate-fade-in">
            <p className="text-center text-base font-black text-[#111827] mb-4">
              {winnerName} 获得选择权
            </p>
            <div className="grid grid-cols-3 gap-2">
              <ScoreButton
                label="发球"
                onClick={() => handleWinnerChoice("serve")}
                variant="primary"
                size="md"
                className="w-full !bg-[#0E1320]"
              />
              <ScoreButton
                label="接发"
                onClick={() => handleWinnerChoice("receive")}
                variant="primary"
                size="md"
                className="w-full !bg-[#10D6B4] !text-[#05251F]"
              />
              <ScoreButton
                label="选边"
                onClick={() => handleWinnerChoice("side")}
                variant="secondary"
                size="md"
                className="w-full"
              />
            </div>
          </div>
        )}

        {phase === "opponent-choice" && tossWinner && (
          <div className="setup-panel toss-result-panel mt-5 animate-fade-in">
            <p className="text-center text-sm text-apple-gray-500 mb-1">
              {winnerName} 选择了选边
            </p>
            <p className="text-center text-base font-black text-[#111827] mb-4">
              {opponentName} 选择发球或接发
            </p>
            <div className="grid grid-cols-2 gap-3">
              <ScoreButton
                label="发球"
                onClick={() => handleOpponentChoice("serve")}
                variant="primary"
                size="lg"
                className="w-full !bg-[#0E1320]"
              />
              <ScoreButton
                label="接发"
                onClick={() => handleOpponentChoice("receive")}
                variant="primary"
                size="lg"
                className="w-full !bg-[#10D6B4] !text-[#05251F]"
              />
            </div>
            <button
              type="button"
              onClick={() => setPhase("winner-choice")}
              className="w-full mt-4 py-2 text-sm text-apple-gray-400 font-medium"
            >
              &lt; 返回上一步
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
