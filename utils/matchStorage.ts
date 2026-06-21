import {
  HISTORY_KEY,
  MatchRecord,
  MatchState,
  STORAGE_KEY,
} from "@/types/match";
import { normalizeMatchState } from "@/utils/scoringLogic";

export function loadActiveMatch(): MatchState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = normalizeMatchState(JSON.parse(raw) as MatchState);
    if (!parsed.player1?.name || !parsed.player2?.name) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveActiveMatch(match: MatchState | null): void {
  if (typeof window === "undefined") return;
  if (match) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(match));
  } else {
    localStorage.removeItem(STORAGE_KEY);
  }
}

export function loadHistory(): MatchRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as MatchRecord[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveHistoryRecord(record: MatchRecord): void {
  if (typeof window === "undefined") return;
  const history = loadHistory();
  history.unshift(record);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
}

export function deleteHistoryRecord(id: string): void {
  if (typeof window === "undefined") return;
  const history = loadHistory().filter((r) => r.id !== id);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
}

export function mergeHistoryRecords(
  local: MatchRecord[],
  cloud: MatchRecord[]
): MatchRecord[] {
  const map = new Map<string, MatchRecord>();
  for (const record of [...local, ...cloud]) {
    map.set(record.id, record);
  }
  return Array.from(map.values()).sort((a, b) => b.endTime - a.endTime);
}

export function replaceHistory(records: MatchRecord[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(HISTORY_KEY, JSON.stringify(records));
}
