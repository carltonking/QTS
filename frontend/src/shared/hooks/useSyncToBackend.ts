import { useCallback } from "react";
import axios from "axios";
import { STORAGE_KEYS } from "../constants";
import { useAuthContext } from "../contexts/AuthContext";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3001",
});

api.interceptors.request.use((config) => {
  const token = window.localStorage.getItem(STORAGE_KEYS.JWT);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export function useSyncToBackend() {
  const { isAuthenticated } = useAuthContext();

  const syncChessRating = useCallback(
    async (rating: number, ratingDeviation: number, puzzlesSolved: number) => {
      if (!isAuthenticated) return;
      try {
        await api.put("/api/chess/rating", {
          rating,
          ratingDeviation,
          volatility: 0.06,
          puzzlesSolved,
        });
      } catch {
        /* silently degrade */
      }
    },
    [isAuthenticated],
  );

  const syncChessAttempt = useCallback(
    async (puzzleId: string, solved: boolean, ratingDelta: number) => {
      if (!isAuthenticated) return;
      try {
        await api.post("/api/chess/attempts", {
          puzzleId,
          solved,
          ratingDelta,
        });
      } catch {
        /* silently degrade */
      }
    },
    [isAuthenticated],
  );

  const syncPokerProgress = useCallback(
    async (
      rank: string,
      totalAttempts: number,
      correctAttempts: number,
      currentStreak: number,
      bestStreak: number,
    ) => {
      if (!isAuthenticated) return;
      try {
        await api.put("/api/poker/progress", {
          rank,
          totalAttempts,
          correctAttempts,
          currentStreak,
          bestStreak,
        });
      } catch {
        /* silently degrade */
      }
    },
    [isAuthenticated],
  );

  const syncMathSession = useCallback(
    async (
      operation: string,
      correct: number,
      total: number,
      duration: number,
      score: number,
    ) => {
      if (!isAuthenticated) return;
      try {
        await api.post("/api/math/sessions", {
          operation,
          correct,
          total,
          duration,
          score,
        });
      } catch {
        /* silently degrade */
      }
    },
    [isAuthenticated],
  );

  const syncQuantRating = useCallback(
    async (category: string, rating: number) => {
      if (!isAuthenticated) return;
      try {
        await api.put("/api/quant/ratings", { category, rating });
      } catch {
        /* silently degrade */
      }
    },
    [isAuthenticated],
  );

  return {
    syncChessRating,
    syncChessAttempt,
    syncPokerProgress,
    syncMathSession,
    syncQuantRating,
  };
}
