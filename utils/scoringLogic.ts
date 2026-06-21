import {
  EMPTY_STATS,
  GamesToWin,
  getTiebreakAt,
  MatchRecord,
  MatchSetup,
  MatchSnapshot,
  MatchState,
  PlayerIndex,
  ScoreDisplay,
  ScoringMode,
  StatType,
} from "@/types/match";

function clonePlayer(player: MatchState["player1"]) {
  return {
    name: player.name,
    stats: { ...player.stats },
  };
}

function createSnapshot(state: MatchState): MatchSnapshot {
  return {
    player1: clonePlayer(state.player1),
    player2: clonePlayer(state.player2),
    isTiebreak: state.isTiebreak,
    currentServer: state.currentServer,
    points: { ...state.points },
    games: { ...state.games },
    setWinner: state.setWinner,
    matchWinner: state.matchWinner,
  };
}

export function createMatch(setup: MatchSetup): MatchState {
  return {
    player1: {
      name: setup.player1Name.trim() || "球员1",
      stats: { ...EMPTY_STATS },
    },
    player2: {
      name: setup.player2Name.trim() || "球员2",
      stats: { ...EMPTY_STATS },
    },
    scorerName: setup.scorerName.trim(),
    gamesToWin: setup.gamesToWin,
    scoringMode: setup.scoringMode,
    tiebreakAt: getTiebreakAt(setup.gamesToWin),
    isTiebreak: false,
    currentServer: setup.firstServer,
    points: { player1: 0, player2: 0 },
    games: { player1: 0, player2: 0 },
    setWinner: null,
    matchWinner: null,
    startTime: Date.now(),
    history: [],
  };
}

export function getScoreDisplay(
  points: { player1: number; player2: number },
  player: PlayerIndex,
  isTiebreak: boolean,
  scoringMode: ScoringMode = "advantage"
): string {
  if (isTiebreak) {
    return String(player === 1 ? points.player1 : points.player2);
  }

  const mine = player === 1 ? points.player1 : points.player2;
  const theirs = player === 1 ? points.player2 : points.player1;

  if (points.player1 >= 3 && points.player2 >= 3) {
    if (scoringMode === "golden") return "40";
    if (mine === theirs) return "40";
    if (mine > theirs) return "AD";
    return "40";
  }

  const labels: ScoreDisplay[] = ["0", "15", "30", "40"];
  return labels[Math.min(mine, 3)];
}

export function isDeuce(
  points: { player1: number; player2: number },
  isTiebreak: boolean
): boolean {
  if (isTiebreak) return false;
  return points.player1 >= 3 && points.player2 >= 3 && points.player1 === points.player2;
}

export function isGoldenPoint(
  points: { player1: number; player2: number },
  isTiebreak: boolean,
  scoringMode: ScoringMode
): boolean {
  if (isTiebreak || scoringMode !== "golden") return false;
  return points.player1 >= 3 && points.player2 >= 3 && points.player1 === points.player2;
}

function resetPoints(state: MatchState): void {
  state.points = { player1: 0, player2: 0 };
}

function switchServer(state: MatchState): void {
  state.currentServer = state.currentServer === 1 ? 2 : 1;
}

function winSet(state: MatchState, winner: PlayerIndex): void {
  state.setWinner = winner;
  state.matchWinner = winner;
  state.isTiebreak = false;
}

function maybeEnterTiebreak(state: MatchState): void {
  const { games, tiebreakAt } = state;
  if (games.player1 === tiebreakAt && games.player2 === tiebreakAt) {
    state.isTiebreak = true;
    resetPoints(state);
  }
}

function checkSetWinner(state: MatchState): void {
  if (state.isTiebreak) return;

  const { games, gamesToWin } = state;
  const p1 = games.player1;
  const p2 = games.player2;

  if (p1 >= gamesToWin && p1 - p2 >= 2) {
    winSet(state, 1);
    return;
  }
  if (p2 >= gamesToWin && p2 - p1 >= 2) {
    winSet(state, 2);
    return;
  }

  maybeEnterTiebreak(state);
}

function rotateTiebreakServer(state: MatchState): void {
  const total = state.points.player1 + state.points.player2;
  if (total === 1 || (total > 1 && total % 2 === 1)) {
    switchServer(state);
  }
}

function incrementTiebreakPoint(state: MatchState, winner: PlayerIndex): void {
  if (winner === 1) state.points.player1 += 1;
  else state.points.player2 += 1;

  rotateTiebreakServer(state);

  const p1 = state.points.player1;
  const p2 = state.points.player2;
  const max = Math.max(p1, p2);
  const diff = Math.abs(p1 - p2);

  if (max >= 7 && diff >= 2) {
    winSet(state, p1 > p2 ? 1 : 2);
  }
}

function winGame(state: MatchState, winner: PlayerIndex): void {
  if (winner === 1) state.games.player1 += 1;
  else state.games.player2 += 1;

  resetPoints(state);
  switchServer(state);
  checkSetWinner(state);
}

function incrementPoint(state: MatchState, winner: PlayerIndex): void {
  if (state.isTiebreak) {
    incrementTiebreakPoint(state, winner);
    return;
  }

  const p1 = state.points.player1;
  const p2 = state.points.player2;

  if (p1 >= 3 && p2 >= 3) {
    if (state.scoringMode === "golden") {
      winGame(state, winner);
      return;
    }

    if (p1 === p2) {
      if (winner === 1) state.points.player1 += 1;
      else state.points.player2 += 1;
      return;
    }

    const leader: PlayerIndex = p1 > p2 ? 1 : 2;
    if (winner === leader) {
      winGame(state, winner);
      return;
    }

    state.points.player1 = 3;
    state.points.player2 = 3;
    return;
  }

  if (winner === 1) {
    state.points.player1 += 1;
    if (state.points.player1 >= 4 && state.points.player1 - state.points.player2 >= 2) {
      winGame(state, 1);
    }
  } else {
    state.points.player2 += 1;
    if (state.points.player2 >= 4 && state.points.player2 - state.points.player1 >= 2) {
      winGame(state, 2);
    }
  }
}

function pushHistory(state: MatchState): void {
  state.history.push(createSnapshot(state));
  if (state.history.length > 100) {
    state.history.shift();
  }
}

export function scorePoint(
  state: MatchState,
  winner: PlayerIndex,
  stat?: { player: PlayerIndex; type: StatType }
): MatchState {
  if (state.matchWinner) return state;

  const next: MatchState = {
    ...state,
    player1: clonePlayer(state.player1),
    player2: clonePlayer(state.player2),
    points: { ...state.points },
    games: { ...state.games },
    history: [...state.history],
  };

  pushHistory(next);

  if (stat) {
    next[stat.player === 1 ? "player1" : "player2"].stats[stat.type] += 1;
  }

  incrementPoint(next, winner);
  return next;
}

export function undoLastAction(state: MatchState): MatchState {
  if (state.history.length === 0) return state;

  const previous = state.history[state.history.length - 1];
  return {
    ...state,
    player1: clonePlayer(previous.player1),
    player2: clonePlayer(previous.player2),
    isTiebreak: previous.isTiebreak ?? false,
    currentServer: previous.currentServer,
    points: { ...previous.points },
    games: { ...previous.games },
    setWinner: previous.setWinner,
    matchWinner: previous.matchWinner,
    history: state.history.slice(0, -1),
  };
}

export function getStatPointWinner(
  player: PlayerIndex,
  stat: StatType
): { winner: PlayerIndex; statPlayer: PlayerIndex; statType: StatType } {
  if (stat === "ace" || stat === "winner") {
    return { winner: player, statPlayer: player, statType: stat };
  }
  const opponent: PlayerIndex = player === 1 ? 2 : 1;
  return { winner: opponent, statPlayer: player, statType: stat };
}

export function formatGamesToWin(games: GamesToWin): string {
  return games === 4 ? "4局" : "6局";
}

export function formatGamesToWinDetail(games: GamesToWin): string {
  return games === 4 ? "4局赛制：3-3抢七" : "6局赛制：5-5抢七";
}

export function formatScoringMode(mode: ScoringMode): string {
  return mode === "golden" ? "金球" : "占先";
}

export function formatMatchFormatHeader(
  gamesToWin: GamesToWin,
  scoringMode: ScoringMode
): string {
  const tiebreak = gamesToWin === 4 ? "3-3抢七" : "5-5抢七";
  return `${formatGamesToWin(gamesToWin)}${formatScoringMode(scoringMode)}｜${tiebreak}`;
}

export function formatDuration(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function formatScoreLine(games: { player1: number; player2: number }): string {
  return `${games.player1}-${games.player2}`;
}

export function createMatchRecord(state: MatchState, endTime: number): MatchRecord {
  const endedInTiebreak =
    state.games.player1 === state.tiebreakAt &&
    state.games.player2 === state.tiebreakAt &&
    (state.points.player1 > 0 || state.points.player2 > 0);

  return {
    id: `${endTime}-${Math.random().toString(36).slice(2, 8)}`,
    startTime: state.startTime,
    endTime,
    durationMs: endTime - state.startTime,
    scorerName: state.scorerName,
    player1Name: state.player1.name,
    player2Name: state.player2.name,
    gamesToWin: state.gamesToWin,
    scoringMode: state.scoringMode,
    games: { ...state.games },
    tiebreakScore: endedInTiebreak ? { ...state.points } : null,
    player1Stats: { ...state.player1.stats },
    player2Stats: { ...state.player2.stats },
    winner: state.matchWinner!,
  };
}

/** Migrate older saved matches missing new fields */
export function normalizeMatchState(raw: MatchState): MatchState {
  const gamesToWin = raw.gamesToWin ?? 6;
  return {
    ...raw,
    gamesToWin,
    scoringMode: raw.scoringMode ?? "golden",
    scorerName: raw.scorerName ?? "",
    tiebreakAt: raw.tiebreakAt ?? getTiebreakAt(gamesToWin),
    isTiebreak: raw.isTiebreak ?? false,
    startTime: raw.startTime ?? Date.now(),
    history: raw.history ?? [],
  };
}
