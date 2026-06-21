"use client";

import { useCallback, useEffect, useState } from "react";
import HomePage from "@/components/HomePage";
import HistoryPage from "@/components/HistoryPage";
import HistoryPasswordModal, { isHistoryUnlocked } from "@/components/HistoryPasswordModal";
import MatchDetailPage from "@/components/MatchDetailPage";
import MatchPage from "@/components/MatchPage";
import { MatchRecord, MatchSetup, MatchState } from "@/types/match";
import {
  deleteHistoryRecord,
  loadActiveMatch,
  loadHistory,
  saveActiveMatch,
  saveHistoryRecord,
} from "@/utils/matchStorage";
import { createMatch, createMatchRecord } from "@/utils/scoringLogic";

type View = "home" | "match" | "history" | "detail";

export default function Page() {
  const [view, setView] = useState<View>("home");
  const [match, setMatch] = useState<MatchState | null>(null);
  const [hasSavedMatch, setHasSavedMatch] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [history, setHistory] = useState<MatchRecord[]>([]);
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  useEffect(() => {
    const saved = loadActiveMatch();
    setHasSavedMatch(!!saved && !saved.matchWinner);
    if (saved && !saved.matchWinner) {
      setMatch(saved);
    }
    setHistory(loadHistory());
    setHydrated(true);
  }, []);

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

  const handleMatchComplete = useCallback((completed: MatchState) => {
    const record = createMatchRecord(completed, Date.now());
    saveHistoryRecord(record);
    setHistory(loadHistory());
    saveActiveMatch(null);
    setHasSavedMatch(false);
  }, []);

  const handleLeaveMatch = useCallback(() => {
    setView("home");
  }, []);

  const handleEnd = useCallback(() => {
    setMatch(null);
    saveActiveMatch(null);
    setHasSavedMatch(false);
    setView("home");
  }, []);

  const goToHistory = useCallback(() => {
    setHistory(loadHistory());
    setView("history");
  }, []);

  const handleHistory = useCallback(() => {
    if (isHistoryUnlocked()) {
      goToHistory();
    } else {
      setShowPasswordModal(true);
    }
  }, [goToHistory]);

  const handlePasswordSuccess = useCallback(() => {
    setShowPasswordModal(false);
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
      />
    );
  }

  if (view === "history") {
    return (
      <HistoryPage
        records={history}
        onSelect={handleSelectRecord}
        onDelete={handleDeleteRecord}
        onBack={handleBackFromHistory}
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
    <>
      <HomePage
        onStart={handleStart}
        onResume={handleResume}
        onAbandon={handleAbandon}
        onHistory={handleHistory}
        hasSavedMatch={hasSavedMatch}
      />
      {showPasswordModal && (
        <HistoryPasswordModal
          onSuccess={handlePasswordSuccess}
          onClose={() => setShowPasswordModal(false)}
        />
      )}
    </>
  );
}
