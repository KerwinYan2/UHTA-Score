export type GamesToWin = 4 | 6;

export type PlayerIndex = 1 | 2;

export type StatType = "ace" | "winner" | "ue" | "df";

export type ScoringMode = "golden" | "advantage";

export interface PlayerStats {
  ace: number;
  winner: number;
  ue: number;
  df: number;
}

export interface Player {
  name: string;
  stats: PlayerStats;
}

export interface GameScore {
  player1: number;
  player2: number;
}

export interface PointScore {
  player1: number;
  player2: number;
}

export interface MatchState {
  player1: Player;
  player2: Player;
  scorerName: string;
  gamesToWin: GamesToWin;
  scoringMode: ScoringMode;
  tiebreakAt: number;
  isTiebreak: boolean;
  currentServer: PlayerIndex;
  points: PointScore;
  games: GameScore;
  setWinner: PlayerIndex | null;
  matchWinner: PlayerIndex | null;
  startTime: number;
  history: MatchSnapshot[];
}

export interface MatchSnapshot {
  player1: Player;
  player2: Player;
  isTiebreak: boolean;
  currentServer: PlayerIndex;
  points: PointScore;
  games: GameScore;
  setWinner: PlayerIndex | null;
  matchWinner: PlayerIndex | null;
}

export interface MatchSetup {
  player1Name: string;
  player2Name: string;
  scorerName: string;
  gamesToWin: GamesToWin;
  scoringMode: ScoringMode;
  firstServer: PlayerIndex;
}

export type ScoreDisplay = "0" | "15" | "30" | "40" | "AD";

export const STORAGE_KEY = "uhta-score-match";
export const HISTORY_KEY = "uhta-score-history";
export const PLAYER_LIBRARY_KEY = "uhta-score-player-library";
export const TOURNAMENTS_KEY = "uhta-score-tournaments";
export const ACTIVE_TOURNAMENT_KEY = "uhta-score-active-tournament";

export const EMPTY_STATS: PlayerStats = {
  ace: 0,
  winner: 0,
  ue: 0,
  df: 0,
};

export interface MatchRecord {
  id: string;
  startTime: number;
  endTime: number;
  durationMs: number;
  scorerName: string;
  player1Name: string;
  player2Name: string;
  gamesToWin: GamesToWin;
  scoringMode: ScoringMode;
  games: GameScore;
  tiebreakScore: PointScore | null;
  player1Stats: PlayerStats;
  player2Stats: PlayerStats;
  winner: PlayerIndex;
}

export type TournamentFormat = "swiss" | "round-robin" | "mixed-points";

export type TournamentDay = 1 | 2;

export interface RatedPlayer {
  id: string;
  name: string;
  level: number;
  active: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface TournamentPlayer {
  id: string;
  name: string;
  level: number;
}

export interface TournamentStanding {
  playerId: string;
  wins: number;
  losses: number;
  points: number;
  gamesWon: number;
  gamesLost: number;
  netGames: number;
}

export interface TournamentMatch {
  id: string;
  round: number;
  court: number;
  player1Id: string;
  player2Id: string;
  group: "winner" | "loser" | "main" | "ranking";
  status: "pending" | "active" | "completed";
  matchState: MatchState | null;
  record: MatchRecord | null;
  winnerId: string | null;
  createdAt: number;
  completedAt: number | null;
}

export interface Tournament {
  id: string;
  name: string;
  day: TournamentDay;
  format: TournamentFormat;
  players: TournamentPlayer[];
  gamesToWin: GamesToWin;
  scoringMode: ScoringMode;
  rounds: TournamentMatch[][];
  currentRound: number;
  standings: TournamentStanding[];
  status: "draft" | "active" | "completed";
  createdAt: number;
  updatedAt: number;
  completedAt: number | null;
}

export function getTiebreakAt(gamesToWin: GamesToWin): number {
  return gamesToWin === 4 ? 3 : 5;
}
