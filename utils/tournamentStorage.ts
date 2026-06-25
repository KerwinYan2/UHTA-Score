import {
  ACTIVE_TOURNAMENT_KEY,
  PLAYER_LIBRARY_KEY,
  RatedPlayer,
  Tournament,
  TOURNAMENTS_KEY,
} from "@/types/match";

export function loadPlayerLibrary(): RatedPlayer[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(PLAYER_LIBRARY_KEY);
    if (!raw) return getSeedPlayers();
    const parsed = JSON.parse(raw) as RatedPlayer[];
    return Array.isArray(parsed) ? parsed : getSeedPlayers();
  } catch {
    return getSeedPlayers();
  }
}

export function savePlayerLibrary(players: RatedPlayer[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(PLAYER_LIBRARY_KEY, JSON.stringify(players));
}

export function loadTournaments(): Tournament[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(TOURNAMENTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Tournament[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveTournaments(tournaments: Tournament[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(TOURNAMENTS_KEY, JSON.stringify(tournaments));
}

export function upsertTournament(tournament: Tournament): Tournament[] {
  const tournaments = loadTournaments();
  const next = [
    tournament,
    ...tournaments.filter((item) => item.id !== tournament.id),
  ].sort((a, b) => b.updatedAt - a.updatedAt);
  saveTournaments(next);
  saveActiveTournamentId(tournament.id);
  return next;
}

export function deleteTournamentRecord(id: string): Tournament[] {
  const next = loadTournaments().filter((item) => item.id !== id);
  saveTournaments(next);
  if (loadActiveTournamentId() === id) {
    saveActiveTournamentId(next[0]?.id ?? null);
  }
  return next;
}

export function loadActiveTournamentId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACTIVE_TOURNAMENT_KEY);
}

export function saveActiveTournamentId(id: string | null): void {
  if (typeof window === "undefined") return;
  if (id) localStorage.setItem(ACTIVE_TOURNAMENT_KEY, id);
  else localStorage.removeItem(ACTIVE_TOURNAMENT_KEY);
}

function getSeedPlayers(): RatedPlayer[] {
  const now = Date.now();
  const names = [
    ["张张", 2],
    ["Cici", 2.5],
    ["皮皮", 3],
    ["程行长", 3.5],
    ["付哥", 3],
    ["雨山", 2.5],
    ["小K", 3],
    ["鸡哥", 3.5],
  ] as const;

  return names.map(([name, level], index) => ({
    id: `seed-${index + 1}`,
    name,
    level,
    active: true,
    createdAt: now,
    updatedAt: now,
  }));
}
