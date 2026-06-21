import { HISTORY_PASSWORD } from "@/components/HistoryPasswordModal";
import { MatchRecord } from "@/types/match";

const HISTORY_HEADERS = {
  "Content-Type": "application/json",
  "x-history-password": HISTORY_PASSWORD,
};

export async function fetchCloudHistory(): Promise<{
  enabled: boolean;
  records: MatchRecord[];
}> {
  try {
    const res = await fetch("/api/history", { headers: HISTORY_HEADERS });
    if (!res.ok) return { enabled: false, records: [] };
    const data = (await res.json()) as { enabled: boolean; records: MatchRecord[] };
    return {
      enabled: data.enabled,
      records: Array.isArray(data.records) ? data.records : [],
    };
  } catch {
    return { enabled: false, records: [] };
  }
}

export async function saveCloudRecord(record: MatchRecord): Promise<boolean> {
  try {
    const res = await fetch("/api/history", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(record),
    });
    if (!res.ok) return false;
    const data = (await res.json()) as { ok?: boolean };
    return data.ok === true;
  } catch {
    return false;
  }
}

export async function deleteCloudRecord(id: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/history/${encodeURIComponent(id)}`, {
      method: "DELETE",
      headers: HISTORY_HEADERS,
    });
    if (!res.ok) return false;
    const data = (await res.json()) as { ok?: boolean };
    return data.ok === true;
  } catch {
    return false;
  }
}
