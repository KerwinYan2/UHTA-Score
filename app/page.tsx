"use client";

import { useCallback, useEffect, useState } from "react";
import HomePage from "@/components/HomePage";
import CoinFlipScreen from "@/components/CoinFlipScreen";
import HistoryPage from "@/components/HistoryPage";
import MatchDetailPage from "@/components/MatchDetailPage";
import MatchPage from "@/components/MatchPage";
import TournamentChartPage from "@/components/TournamentChartPage";
import TournamentPage from "@/components/TournamentPage";
import { MatchRecord, MatchSetup, MatchState, PlayerIndex, RatedPlayer, Tournament } from "@/types/match";
import {
  deleteHistoryRecord,
  loadActiveMatch,
  loadHistory,
  mergeHistoryRecords,
  replaceHistory,
  saveActiveMatch,
  saveHistoryRecord,
} from "@/utils/matchStorage";
import {
  deleteCloudRecord,
  fetchCloudHistory,
  saveCloudRecord,
} from "@/utils/matchCloud";
import { createMatch, createMatchRecord } from "@/utils/scoringLogic";
import {
  completeTournamentMatch,
  createTournament,
  startTournamentMatch,
  updateTournamentMatchState,
} from "@/utils/tournamentLogic";
import {
  loadActiveTournamentId,
  deleteTournamentRecord,
  loadPlayerLibrary,
  loadTournaments,
  savePlayerLibrary,
  upsertTournament,
} from "@/utils/tournamentStorage";

type View =
  | "home"
  | "match"
  | "history"
  | "detail"
  | "reselect-server"
  | "tournament"
  | "tournament-coin"
  | "tournament-match"
  | "tournament-chart";

export default function Page() {
  const [view, setView] = useState<View>("tournament-chart");
  const [match, setMatch] = useState<MatchState | null>(null);
  const [hasSavedMatch, setHasSavedMatch] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [history, setHistory] = useState<MatchRecord[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [cloudEnabled, setCloudEnabled] = useState(false);
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);
  const [players, setPlayers] = useState<RatedPlayer[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [activeTournamentId, setActiveTournamentId] = useState<string | null>(null);
  const [selectedTournamentMatchId, setSelectedTournamentMatchId] = useState<string | null>(null);

  useEffect(() => {
    const saved = loadActiveMatch();
    setHasSavedMatch(!!saved && !saved.matchWinner);
    if (saved && !saved.matchWinner) {
      setMatch(saved);
    }
    setHistory(loadHistory());
    const loadedPlayers = loadPlayerLibrary();
    const loadedTournaments = loadTournaments();
    const savedActiveTournamentId = loadActiveTournamentId();
    const nextActiveTournamentId =
      loadedTournaments.find((tournament) => tournament.id === savedActiveTournamentId)?.id ??
      loadedTournaments[0]?.id ??
      null;
    setPlayers(loadedPlayers);
    setTournaments(loadedTournaments);
    setActiveTournamentId(nextActiveTournamentId);
    setHydrated(true);
  }, []);

  const activeTournament =
    tournaments.find((tournament) => tournament.id === activeTournamentId) ??
    tournaments[0] ??
    null;

  const selectedTournamentMatch =
    activeTournament?.rounds
      .flat()
      .find((tournamentMatch) => tournamentMatch.id === selectedTournamentMatchId) ?? null;

  useEffect(() => {
    if (!hydrated) return;
    if (match && !match.matchWinner) {
      saveActiveMatch(match);
      setHasSavedMatch(true);
    }
  }, [match, hydrated]);

  const handleStart = useCallback((setup: MatchSetup) => {
    const newMatch = createMatch(setup);
    setMatch(newMatch);
    setView("match");
  }, []);

  const handleResume = useCallback(() => {
    const saved = loadActiveMatch();
    if (saved && !saved.matchWinner) {
      setMatch(saved);
      setView("match");
    }
  }, []);

  const handleAbandon = useCallback(() => {
    setMatch(null);
    saveActiveMatch(null);
    setHasSavedMatch(false);
  }, []);

  const handleUpdate = useCallback((updated: MatchState) => {
    setMatch(updated);
  }, []);

  const handleReselectServer = useCallback(() => {
    setView("reselect-server");
  }, []);

  const handleReselectServerDone = useCallback((server: MatchState["currentServer"]) => {
    setMatch((current) => {
      if (!current) return current;
      return createMatch({
        player1Name: current.player1.name,
        player2Name: current.player2.name,
        scorerName: current.scorerName,
        gamesToWin: current.gamesToWin,
        scoringMode: current.scoringMode,
        firstServer: server,
      });
    });
    setView("match");
  }, []);

  const handleMatchComplete = useCallback((completed: MatchState) => {
    const record = createMatchRecord(completed, Date.now());
    saveHistoryRecord(record);
    setHistory(loadHistory());
    saveActiveMatch(null);
    setHasSavedMatch(false);
    void saveCloudRecord(record);
  }, []);

  const handleSavePlayers = useCallback((nextPlayers: RatedPlayer[]) => {
    setPlayers(nextPlayers);
    savePlayerLibrary(nextPlayers);
  }, []);

  const handleCreateTournament = useCallback(
    (options: {
      name: string;
      day: Tournament["day"];
      format: Tournament["format"];
      playerIds: string[];
      gamesToWin: Tournament["gamesToWin"];
      scoringMode: Tournament["scoringMode"];
    }) => {
      const selectedPlayers = options.playerIds
        .map((id) => players.find((player) => player.id === id))
        .filter(Boolean) as RatedPlayer[];
      if (selectedPlayers.length !== 8) return;

      const tournament = createTournament({
        name: options.name,
        day: options.day,
        format: options.format,
        players: selectedPlayers,
        gamesToWin: options.gamesToWin,
        scoringMode: options.scoringMode,
      });
      const next = upsertTournament(tournament);
      setTournaments(next);
      setActiveTournamentId(tournament.id);
      setView("tournament-chart");
    },
    [players]
  );

  const handleOpenTournament = useCallback((id: string) => {
    setActiveTournamentId(id);
    setView("tournament");
  }, []);

  const handleDeleteTournament = useCallback(
    (id: string) => {
      const next = deleteTournamentRecord(id);
      setTournaments(next);
      if (activeTournamentId === id) {
        setActiveTournamentId(next[0]?.id ?? null);
        setSelectedTournamentMatchId(null);
        if (view === "tournament-chart" || view === "tournament-match" || view === "tournament-coin") {
          setView("tournament");
        }
      }
    },
    [activeTournamentId, view]
  );

  const persistTournament = useCallback((tournament: Tournament) => {
    const next = upsertTournament(tournament);
    setTournaments(next);
    setActiveTournamentId(tournament.id);
  }, []);

  const handleOpenTournamentMatch = useCallback(
    (tournamentId: string, matchId: string) => {
      setActiveTournamentId(tournamentId);
      setSelectedTournamentMatchId(matchId);
      const tournament = tournaments.find((item) => item.id === tournamentId);
      const tournamentMatch = tournament?.rounds.flat().find((item) => item.id === matchId);
      if (!tournament || !tournamentMatch) return;
      if (tournamentMatch.matchState) {
        setMatch(tournamentMatch.matchState);
        setView("tournament-match");
      } else {
        setView("tournament-coin");
      }
    },
    [tournaments]
  );

  const handleTournamentServerSelected = useCallback(
    (server: PlayerIndex) => {
      if (!activeTournament || !selectedTournamentMatchId) return;
      const nextTournament = startTournamentMatch(
        activeTournament,
        selectedTournamentMatchId,
        server,
        "赛事"
      );
      const nextMatch =
        nextTournament.rounds.flat().find((item) => item.id === selectedTournamentMatchId)
          ?.matchState ?? null;
      persistTournament(nextTournament);
      setMatch(nextMatch);
      setView("tournament-match");
    },
    [activeTournament, persistTournament, selectedTournamentMatchId]
  );

  const handleTournamentMatchUpdate = useCallback(
    (updated: MatchState) => {
      setMatch(updated);
      if (!activeTournament || !selectedTournamentMatchId) return;
      persistTournament(
        updateTournamentMatchState(activeTournament, selectedTournamentMatchId, updated)
      );
    },
    [activeTournament, persistTournament, selectedTournamentMatchId]
  );

  const handleTournamentMatchComplete = useCallback(
    (completed: MatchState) => {
      if (!activeTournament || !selectedTournamentMatchId) return;
      const nextTournament = completeTournamentMatch(
        activeTournament,
        selectedTournamentMatchId,
        completed
      );
      persistTournament(nextTournament);
      setMatch(null);
      setSelectedTournamentMatchId(null);
      setView("tournament-chart");
    },
    [activeTournament, persistTournament, selectedTournamentMatchId]
  );

  const handleLeaveMatch = useCallback(() => {
    setView("home");
  }, []);

  const handleEnd = useCallback(() => {
    setMatch(null);
    saveActiveMatch(null);
    setHasSavedMatch(false);
    setView("home");
  }, []);

  const refreshHistory = useCallback(async () => {
    const local = loadHistory();
    setHistoryLoading(true);
    try {
      const { enabled, records: cloud } = await fetchCloudHistory();
      setCloudEnabled(enabled);
      const merged = mergeHistoryRecords(local, cloud);
      replaceHistory(merged);
      setHistory(merged);
    } catch {
      setHistory(local);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  const goToHistory = useCallback(() => {
    void refreshHistory();
    setView("history");
  }, [refreshHistory]);

  const handleHistory = useCallback(() => {
    goToHistory();
  }, [goToHistory]);

  const handleSelectRecord = useCallback((id: string) => {
    setSelectedRecordId(id);
    setView("detail");
  }, []);

  const handleDeleteRecord = useCallback(
    (id: string) => {
      deleteHistoryRecord(id);
      setHistory(loadHistory());
      void deleteCloudRecord(id);
      if (selectedRecordId === id) {
        setSelectedRecordId(null);
        setView("history");
      }
    },
    [selectedRecordId]
  );

  const handleBackFromHistory = useCallback(() => {
    setView("home");
  }, []);

  const handleBackFromDetail = useCallback(() => {
    setSelectedRecordId(null);
    setView("history");
  }, []);

  if (!hydrated) {
    return (
      <div className="page-fill flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-apple-blue border-t-transparent animate-spin" />
      </div>
    );
  }

  if (view === "match" && match) {
    return (
      <MatchPage
        match={match}
        onUpdate={handleUpdate}
        onLeave={handleLeaveMatch}
        onEnd={handleEnd}
        onMatchComplete={handleMatchComplete}
        onReselectServer={handleReselectServer}
      />
    );
  }

  if (view === "tournament") {
    return (
      <TournamentPage
        players={players}
        tournaments={tournaments}
        activeTournament={activeTournament}
        onBack={() => setView("home")}
        onSavePlayers={handleSavePlayers}
        onCreateTournament={handleCreateTournament}
        onOpenTournament={handleOpenTournament}
        onOpenMatch={handleOpenTournamentMatch}
        onOpenChart={(id) => {
          setActiveTournamentId(id);
          setView("tournament-chart");
        }}
        onHistory={() => setView("history")}
        onCreateMatch={() => setView("home")}
      />
    );
  }

  if (view === "tournament-chart" && activeTournament) {
    return (
      <TournamentChartPage
        tournament={activeTournament}
        onAdmin={() => setView("tournament")}
        onDelete={handleDeleteTournament}
      />
    );
  }

  if (view === "tournament-chart" && !activeTournament) {
    return (
      <TournamentPage
        players={players}
        tournaments={tournaments}
        activeTournament={activeTournament}
        onBack={() => setView("home")}
        onSavePlayers={handleSavePlayers}
        onCreateTournament={handleCreateTournament}
        onOpenTournament={handleOpenTournament}
        onOpenMatch={handleOpenTournamentMatch}
        onOpenChart={(id) => {
          setActiveTournamentId(id);
          setView("tournament-chart");
        }}
        onHistory={() => setView("history")}
        onCreateMatch={() => setView("home")}
      />
    );
  }

  if (view === "tournament-coin" && activeTournament && selectedTournamentMatch) {
    const p1 = activeTournament.players.find((player) => player.id === selectedTournamentMatch.player1Id)!;
    const p2 = activeTournament.players.find((player) => player.id === selectedTournamentMatch.player2Id)!;
    return (
      <CoinFlipScreen
        player1Name={p1.name}
        player2Name={p2.name}
        onSelectServer={handleTournamentServerSelected}
        onBack={() => setView("tournament")}
      />
    );
  }

  if (view === "tournament-match" && match) {
    return (
      <MatchPage
        match={match}
        onUpdate={handleTournamentMatchUpdate}
        onLeave={() => setView("tournament")}
        onEnd={() => setView("tournament")}
        onMatchComplete={handleTournamentMatchComplete}
        onReselectServer={() => setView("tournament-coin")}
      />
    );
  }

  if (view === "reselect-server" && match) {
    return (
      <CoinFlipScreen
        player1Name={match.player1.name}
        player2Name={match.player2.name}
        onSelectServer={handleReselectServerDone}
        onBack={() => setView("match")}
      />
    );
  }

  if (view === "history") {
    return (
      <HistoryPage
        records={history}
        loading={historyLoading}
        cloudEnabled={cloudEnabled}
        tournaments={tournaments}
        onSelect={handleSelectRecord}
        onDelete={handleDeleteRecord}
        onSelectTournament={(id) => {
          setActiveTournamentId(id);
          setView("tournament-chart");
        }}
        onBack={handleBackFromHistory}
        onRefresh={() => void refreshHistory()}
      />
    );
  }

  if (view === "detail" && selectedRecordId) {
    const record = history.find((r) => r.id === selectedRecordId);
    if (record) {
      return (
        <MatchDetailPage
          record={record}
          onBack={handleBackFromDetail}
          onDelete={handleDeleteRecord}
        />
      );
    }
  }

  return (
    <HomePage
      onStart={handleStart}
      onResume={handleResume}
      onAbandon={handleAbandon}
      onHistory={handleHistory}
      onTournament={() => setView(activeTournament ? "tournament-chart" : "tournament")}
      hasSavedMatch={hasSavedMatch}
    />
  );
}
