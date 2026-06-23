export const STORAGE_KEYS = {
  JWT: "qts_jwt",
  CHESS_PLAYER_RATING: "qts_chess_player_rating",
  CHESS_ATTEMPTS: "qts_chess_attempts",
  CHESS_STATS: "qts_chess_stats",
  CHESS_HINTS: "qts_chess_hints",
  POKER_RANK: "qts_poker_rank",
  MATH_HISTORY: "qts_math_history",
  MATH_LEADERBOARD: "qts_math_leaderboard",
  QUANT_USER: "qts_quant_user",
  CURRICULUM_PROGRESS: "qts_curriculum_progress",
  MM_BEST_PNL: "qts_mm_best_pnl",
} as const;

export function getCodeDraftKey(slug: string, language: string) {
  return `qts_code_${slug}_${language}`;
}

export const JUDGE0_POLL_ATTEMPTS = 20;
export const JUDGE0_POLL_INTERVAL_MS = 500;
export const JUDGE0_DEFAULT_URL = "http://localhost:2358";
