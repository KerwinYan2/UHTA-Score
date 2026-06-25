import {
  GamesToWin,
  MatchRecord,
  PlayerIndex,
  RatedPlayer,
  ScoringMode,
  Tournament,
  TournamentFormat,
  TournamentMatch,
  TournamentPlayer,
  TournamentStanding,
} from "@/types/match";
import { createMatch, createMatchRecord } from "@/utils/scoringLogic";

function makeId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy;
}

function playerSort(a: TournamentPlayer, b: TournamentPlayer): number {
  if (b.level !== a.level) return b.level - a.level;
  return a.name.localeCompare(b.name);
}

function pairPlayers(
  players: TournamentPlayer[],
  round: number,
  group: TournamentMatch["group"],
  playedPairs: Set<string>
): TournamentMatch[] {
  const pool = [...players];
  const matches: TournamentMatch[] = [];

  while (pool.length >= 2) {
    const player1 = pool.shift()!;
    let opponentIndex = pool.findIndex(
      (candidate) => !playedPairs.has(getPairKey(player1.id, candidate.id))
    );
    if (opponentIndex < 0) opponentIndex = 0;

    const [player2] = pool.splice(opponentIndex, 1);
    const createdAt = Date.now();
    matches.push({
      id: makeId("tm"),
      round,
      court: 1,
      player1Id: player1.id,
      player2Id: player2.id,
      group,
      status: "pending",
      matchState: null,
      record: null,
      winnerId: null,
      createdAt,
      completedAt: null,
    });
  }

  return matches;
}

function getPairKey(a: string, b: string): string {
  return [a, b].sort().join("__");
}

function getPlayedPairs(tournament: Tournament): Set<string> {
  const pairs = new Set<string>();
  for (const round of tournament.rounds) {
    for (const match of round) {
      pairs.add(getPairKey(match.player1Id, match.player2Id));
    }
  }
  return pairs;
}

function getInitialStandings(players: TournamentPlayer[]): TournamentStanding[] {
  return players.map((player) => ({
    playerId: player.id,
    wins: 0,
    losses: 0,
    points: 0,
    gamesWon: 0,
    gamesLost: 0,
    netGames: 0,
  }));
}

function sortStandings(
  standings: TournamentStanding[],
  players: TournamentPlayer[]
): TournamentStanding[] {
  const playerMap = new Map(players.map((player) => [player.id, player]));
  return [...standings].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.netGames !== a.netGames) return b.netGames - a.netGames;
    if (b.gamesWon !== a.gamesWon) return b.gamesWon - a.gamesWon;
    return (playerMap.get(b.playerId)?.level ?? 0) - (playerMap.get(a.playerId)?.level ?? 0);
  });
}

export function createRatedPlayer(name: string, level: number): RatedPlayer {
  const now = Date.now();
  return {
    id: makeId("player"),
    name: name.trim(),
    level,
    active: true,
    createdAt: now,
    updatedAt: now,
  };
}

export function createTournament({
  name,
  day,
  format,
  players,
  gamesToWin,
  scoringMode,
}: {
  name: string;
  day: Tournament["day"];
  format: TournamentFormat;
  players: RatedPlayer[];
  gamesToWin: GamesToWin;
  scoringMode: ScoringMode;
}): Tournament {
  const now = Date.now();
  const tournamentPlayers = shuffle(players)
    .slice(0, 8)
    .map((player) => ({
      id: player.id,
      name: player.name,
      level: player.level,
    }));

  const firstRoundPlayers =
    format === "mixed-points"
      ? [...tournamentPlayers].sort(playerSort)
      : tournamentPlayers;

  const firstRound = pairPlayers(firstRoundPlayers, 1, "main", new Set());
  const standings = getInitialStandings(tournamentPlayers);

  return {
    id: makeId("tournament"),
    name: name.trim() || "超高压混单积分赛",
    day,
    format,
    players: tournamentPlayers,
    gamesToWin,
    scoringMode,
    rounds: [firstRound],
    currentRound: 1,
    standings,
    status: "active",
    createdAt: now,
    updatedAt: now,
    completedAt: null,
  };
}

export function getTournamentPlayer(
  tournament: Tournament,
  playerId: string
): TournamentPlayer {
  return tournament.players.find((player) => player.id === playerId)!;
}

export function startTournamentMatch(
  tournament: Tournament,
  matchId: string,
  server: PlayerIndex,
  scorerName: string
): Tournament {
  return updateTournamentMatch(tournament, matchId, (match) => {
    if (match.matchState) return match;
    const p1 = getTournamentPlayer(tournament, match.player1Id);
    const p2 = getTournamentPlayer(tournament, match.player2Id);
    return {
      ...match,
      status: "active",
      matchState: createMatch({
        player1Name: p1.name,
        player2Name: p2.name,
        scorerName,
        gamesToWin: tournament.gamesToWin,
        scoringMode: tournament.scoringMode,
        firstServer: server,
      }),
    };
  });
}

export function updateTournamentMatchState(
  tournament: Tournament,
  matchId: string,
  matchState: TournamentMatch["matchState"]
): Tournament {
  return updateTournamentMatch(tournament, matchId, (match) => ({
    ...match,
    status: matchState?.matchWinner ? "completed" : "active",
    matchState,
  }));
}

export function completeTournamentMatch(
  tournament: Tournament,
  matchId: string,
  matchState: NonNullable<TournamentMatch["matchState"]>
): Tournament {
  const completedAt = Date.now();
  const record = createMatchRecord(matchState, completedAt);

  const withCompletedMatch = updateTournamentMatch(tournament, matchId, (match) => {
    const winnerId =
      matchState.matchWinner === 1 ? match.player1Id : match.player2Id;
    return {
      ...match,
      status: "completed",
      matchState,
      record,
      winnerId,
      completedAt,
    };
  });

  const withStandings = {
    ...withCompletedMatch,
    standings: computeStandings(withCompletedMatch),
    updatedAt: completedAt,
  };

  if (isRoundComplete(withStandings, withStandings.currentRound)) {
    return advanceTournament(withStandings);
  }

  return withStandings;
}

function updateTournamentMatch(
  tournament: Tournament,
  matchId: string,
  updater: (match: TournamentMatch) => TournamentMatch
): Tournament {
  return {
    ...tournament,
    rounds: tournament.rounds.map((round) =>
      round.map((match) => (match.id === matchId ? updater(match) : match))
    ),
    updatedAt: Date.now(),
  };
}

function computeStandings(tournament: Tournament): TournamentStanding[] {
  const standings = new Map(
    getInitialStandings(tournament.players).map((standing) => [standing.playerId, standing])
  );

  for (const round of tournament.rounds) {
    for (const match of round) {
      if (!match.record || !match.winnerId) continue;

      const p1 = standings.get(match.player1Id)!;
      const p2 = standings.get(match.player2Id)!;
      const p1Won = match.winnerId === match.player1Id;
      const p1Games = match.record.games.player1;
      const p2Games = match.record.games.player2;

      p1.gamesWon += p1Games;
      p1.gamesLost += p2Games;
      p1.netGames = p1.gamesWon - p1.gamesLost;
      p2.gamesWon += p2Games;
      p2.gamesLost += p1Games;
      p2.netGames = p2.gamesWon - p2.gamesLost;

      if (p1Won) {
        p1.wins += 1;
        p1.points += 2;
        p2.losses += 1;
        p2.points += 1;
      } else {
        p2.wins += 1;
        p2.points += 2;
        p1.losses += 1;
        p1.points += 1;
      }
    }
  }

  return sortStandings(Array.from(standings.values()), tournament.players);
}

function isRoundComplete(tournament: Tournament, roundNumber: number): boolean {
  const round = tournament.rounds[roundNumber - 1];
  return !!round && round.every((match) => match.status === "completed");
}

function advanceTournament(tournament: Tournament): Tournament {
  const maxRounds =
    tournament.format === "round-robin" ? Math.min(7, tournament.players.length - 1) : 3;

  if (tournament.currentRound >= maxRounds) {
    return {
      ...tournament,
      status: "completed",
      completedAt: Date.now(),
      updatedAt: Date.now(),
    };
  }

  const nextRoundNumber = tournament.currentRound + 1;
  const playedPairs = getPlayedPairs(tournament);
  const orderedPlayers = sortStandings(tournament.standings, tournament.players)
    .map((standing) => getTournamentPlayer(tournament, standing.playerId));

  const nextRound =
    tournament.format === "mixed-points" && nextRoundNumber > 1
      ? createGroupedRound(orderedPlayers, nextRoundNumber, playedPairs)
      : pairPlayers(orderedPlayers, nextRoundNumber, "main", playedPairs);

  return {
    ...tournament,
    rounds: [...tournament.rounds, nextRound],
    currentRound: nextRoundNumber,
    updatedAt: Date.now(),
  };
}

function createGroupedRound(
  players: TournamentPlayer[],
  round: number,
  playedPairs: Set<string>
): TournamentMatch[] {
  const winnerGroup = players.slice(0, Math.ceil(players.length / 2));
  const loserGroup = players.slice(Math.ceil(players.length / 2));
  return [
    ...pairPlayers(winnerGroup, round, "winner", playedPairs),
    ...pairPlayers(loserGroup, round, round >= 3 ? "ranking" : "loser", playedPairs),
  ].map((match) => ({ ...match, court: 1 }));
}

export function getTournamentRecord(tournament: Tournament): MatchRecord[] {
  return tournament.rounds.flatMap((round) =>
    round.flatMap((match) => (match.record ? [match.record] : []))
  );
}
