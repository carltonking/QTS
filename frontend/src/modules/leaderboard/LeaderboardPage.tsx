import { useCallback, useEffect, useState } from "react";
import { api } from "../leetcode/api";
import "./leaderboard.css";

type ChessEntry = {
  username: string;
  avatarUrl: string | null;
  rating: number;
  puzzlesSolved: number;
};
type MathEntry = {
  username: string;
  avatarUrl: string | null;
  score: number;
  correct: number;
  total: number;
  sessions: number;
};
type PokerEntry = {
  username: string;
  avatarUrl: string | null;
  rank: string;
  accuracy: number;
  bestStreak: number;
};
type QuantEntry = {
  username: string;
  avatarUrl: string | null;
  avgRating: number;
  totalRating: number;
  categories: number;
};

type Tab = "chess" | "math" | "poker" | "quant";

export function LeaderboardPage() {
  const [tab, setTab] = useState<Tab>("chess");
  const [chess, setChess] = useState<ChessEntry[]>([]);
  const [math, setMath] = useState<MathEntry[]>([]);
  const [poker, setPoker] = useState<PokerEntry[]>([]);
  const [quant, setQuant] = useState<QuantEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTab = useCallback(async (t: Tab) => {
    setLoading(true);
    setError(null);
    try {
      if (t === "chess") {
        const res = await api.get("/api/leaderboard/chess");
        setChess(res.data.entries);
      } else if (t === "math") {
        const res = await api.get("/api/leaderboard/math");
        setMath(res.data.entries);
      } else if (t === "poker") {
        const res = await api.get("/api/leaderboard/poker");
        setPoker(res.data.entries);
      } else if (t === "quant") {
        const res = await api.get("/api/leaderboard/quant");
        setQuant(res.data.entries);
      }
    } catch {
      setError("Failed to load leaderboard");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTab(tab);
  }, [tab, fetchTab]);

  return (
    <div className="lb-container">
      <div className="lb-card">
        <div className="lb-title">GLOBAL LEADERBOARD</div>
        {error ? (
          <div
            style={{
              color: "#ff4444",
              fontSize: "0.82rem",
              textAlign: "center",
              padding: "0.5rem",
            }}
          >
            {error}
          </div>
        ) : null}
        {loading ? (
          <div
            style={{
              textAlign: "center",
              padding: "2rem",
              fontSize: "0.82rem",
              letterSpacing: "0.08em",
            }}
          >
            LOADING...
          </div>
        ) : null}
        <div className="lb-tabs">
          {(["chess", "math", "poker", "quant"] as const).map((t) => (
            <button
              key={t}
              className={`lb-tab ${tab === t ? "active" : ""}`}
              onClick={() => setTab(t)}
            >
              {t.toUpperCase()}
            </button>
          ))}
        </div>

        {tab === "chess" && (
          <table className="lb-table">
            <thead>
              <tr>
                <th>#</th>
                <th>PLAYER</th>
                <th>RATING</th>
                <th>PUZZLES</th>
              </tr>
            </thead>
            <tbody>
              {chess.map((e, i) => (
                <tr key={i}>
                  <td>{i + 1}</td>
                  <td>{e.username}</td>
                  <td>{Math.round(e.rating)}</td>
                  <td>{e.puzzlesSolved}</td>
                </tr>
              ))}
              {chess.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ opacity: 0.5 }}>
                    NO DATA
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}

        {tab === "math" && (
          <table className="lb-table">
            <thead>
              <tr>
                <th>#</th>
                <th>PLAYER</th>
                <th>SCORE</th>
                <th>ACCURACY</th>
                <th>SESSIONS</th>
              </tr>
            </thead>
            <tbody>
              {math.map((e, i) => (
                <tr key={i}>
                  <td>{i + 1}</td>
                  <td>{e.username}</td>
                  <td>{e.score}</td>
                  <td>
                    {e.total > 0
                      ? `${Math.round((e.correct / e.total) * 100)}%`
                      : "-"}
                  </td>
                  <td>{e.sessions}</td>
                </tr>
              ))}
              {math.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ opacity: 0.5 }}>
                    NO DATA
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}

        {tab === "poker" && (
          <table className="lb-table">
            <thead>
              <tr>
                <th>#</th>
                <th>PLAYER</th>
                <th>RANK</th>
                <th>ACCURACY</th>
                <th>BEST STREAK</th>
              </tr>
            </thead>
            <tbody>
              {poker.map((e, i) => (
                <tr key={i}>
                  <td>{i + 1}</td>
                  <td>{e.username}</td>
                  <td>{e.rank}</td>
                  <td>{e.accuracy}%</td>
                  <td>{e.bestStreak}</td>
                </tr>
              ))}
              {poker.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ opacity: 0.5 }}>
                    NO DATA
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}

        {tab === "quant" && (
          <table className="lb-table">
            <thead>
              <tr>
                <th>#</th>
                <th>PLAYER</th>
                <th>AVG RATING</th>
                <th>CATEGORIES</th>
              </tr>
            </thead>
            <tbody>
              {quant.map((e, i) => (
                <tr key={i}>
                  <td>{i + 1}</td>
                  <td>{e.username}</td>
                  <td>{e.avgRating}</td>
                  <td>{e.categories}/3</td>
                </tr>
              ))}
              {quant.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ opacity: 0.5 }}>
                    NO DATA
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
