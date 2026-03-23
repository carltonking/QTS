import { useEffect, useState } from 'react';
import { Badge } from '../../shared/components/Badge';
import { Button } from '../../shared/components/Button';
import { Card } from '../../shared/components/Card';
import { fetchNextPuzzle } from './LichessAPI';
import { PuzzleLoader } from './PuzzleLoader';
import { processRatingPeriod } from './GlickoEngine';
import ChessBoard from './ChessBoard';
import { PlayAI } from './PlayAI';
import './chess.css';
import type { PlayerRating, Puzzle, PuzzleAttempt } from './types';

const PLAYER_RATING_KEY = 'qts_chess_player_rating';
const ATTEMPTS_KEY = 'qts_chess_attempts';
const STATS_KEY = 'qts_chess_stats';
const HINTS_KEY = 'qts_chess_hints';
const RATING_PERIOD = 10;

type ChessStats = {
  solved: number;
  accuracy: number;
  streak: number;
  total: number;
  firstTry: number;
};

type ChessTab = 'PUZZLES' | 'PLAY_AI';

function loadJson<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function formatTimer(seconds: number) {
  const minutes = Math.floor(seconds / 60)
    .toString()
    .padStart(2, '0');
  const remainder = (seconds % 60).toString().padStart(2, '0');

  return `${minutes}:${remainder}`;
}

function defaultPlayerRating(): PlayerRating {
  return {
    r: 1500,
    rd: 200,
    lastUpdated: Date.now(),
  };
}

function defaultStats(): ChessStats {
  return {
    solved: 0,
    accuracy: 0,
    streak: 0,
    total: 0,
    firstTry: 0,
  };
}

export default function ChessModule() {
  const [activeTab, setActiveTab] = useState<ChessTab>('PUZZLES');
  const [playerRating, setPlayerRating] = useState<PlayerRating>(() =>
    loadJson<PlayerRating>(PLAYER_RATING_KEY, defaultPlayerRating()),
  );
  const [attemptBuffer, setAttemptBuffer] = useState<PuzzleAttempt[]>(() =>
    loadJson<PuzzleAttempt[]>(ATTEMPTS_KEY, []),
  );
  const [periodPuzzles, setPeriodPuzzles] = useState<Puzzle[]>([]);
  const [stats, setStats] = useState<ChessStats>(() =>
    loadJson<ChessStats>(STATS_KEY, defaultStats()),
  );
  const [currentPuzzle, setCurrentPuzzle] = useState<Puzzle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attemptDisplay, setAttemptDisplay] = useState(1);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [ratingDeltaText, setRatingDeltaText] = useState('');
  const [hintsEnabled, setHintsEnabled] = useState<boolean>(() =>
    loadJson<boolean>(HINTS_KEY, true),
  );

  useEffect(() => {
    window.localStorage.setItem(PLAYER_RATING_KEY, JSON.stringify(playerRating));
  }, [playerRating]);

  useEffect(() => {
    window.localStorage.setItem(ATTEMPTS_KEY, JSON.stringify(attemptBuffer));
  }, [attemptBuffer]);

  useEffect(() => {
    window.localStorage.setItem(STATS_KEY, JSON.stringify(stats));
  }, [stats]);

  useEffect(() => {
    window.localStorage.setItem(HINTS_KEY, JSON.stringify(hintsEnabled));
  }, [hintsEnabled]);

  const loadPuzzle = async () => {
    setLoading(true);
    setError(null);

    try {
      const puzzle = await fetchNextPuzzle();
      setCurrentPuzzle(puzzle);
      setAttemptDisplay(1);
      setTimerSeconds(0);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Could not load puzzle');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadPuzzle();
  }, []);

  const processCompletedPuzzle = async (score: number, timeTaken: number, attempts: number) => {
    if (!currentPuzzle) {
      return;
    }

    const solvedAt = Date.now();
    const nextAttempt: PuzzleAttempt = {
      puzzleId: currentPuzzle.id,
      puzzleRating: currentPuzzle.rating,
      score,
      solvedAt,
      timeTaken,
    };

    const nextStats = {
      solved: stats.solved + (score > 0 ? 1 : 0),
      total: stats.total + 1,
      firstTry: stats.firstTry + (score === 1 ? 1 : 0),
      streak: score > 0 ? stats.streak + 1 : 0,
      accuracy: 0,
    };

    nextStats.accuracy =
      nextStats.total > 0 ? Math.round((nextStats.firstTry / nextStats.total) * 100) : 0;

    setStats(nextStats);

    const pendingAttempts = [...attemptBuffer, nextAttempt];
    const pendingPuzzles = [...periodPuzzles, currentPuzzle];

    if (pendingAttempts.length >= RATING_PERIOD) {
      const { player } = processRatingPeriod(playerRating, pendingAttempts, pendingPuzzles);
      const delta = player.r - playerRating.r;

      setRatingDeltaText(`${delta >= 0 ? '+' : ''}${delta} → ${player.r}`);
      setPlayerRating(player);
      setAttemptBuffer([]);
      setPeriodPuzzles([]);
    } else {
      setAttemptBuffer(pendingAttempts);
      setPeriodPuzzles(pendingPuzzles);
      setRatingDeltaText('');
    }

    await loadPuzzle();
  };

  const puzzlesTab = (
    <div className="chess-module">
      <div className="chess-column">
        <Card>
          <PuzzleLoader loading={loading} error={error} onRetry={() => void loadPuzzle()}>
            {currentPuzzle ? (
              <ChessBoard
                puzzle={currentPuzzle}
                hintsEnabled={hintsEnabled}
                onToggleHints={() => setHintsEnabled((previous) => !previous)}
                onSolved={(timeTaken, attempts) =>
                  void processCompletedPuzzle(attempts === 1 ? 1 : 0.5, timeTaken, attempts)
                }
                onGiveUp={(timeTaken, attempts) =>
                  void processCompletedPuzzle(0, timeTaken, attempts)
                }
                onAttemptsChange={setAttemptDisplay}
                onTimeChange={setTimerSeconds}
              />
            ) : null}
          </PuzzleLoader>
        </Card>

        {currentPuzzle ? (
          <Card>
            <div className="chess-info-grid">
              <div className="chess-badge-row">
                {currentPuzzle.themes.map((theme) => (
                  <Badge key={theme} label={theme} />
                ))}
              </div>

              <div className="chess-meta-grid">
                <div className="chess-meta-item">
                  <div className="chess-meta-label">Hints</div>
                  <div className="chess-meta-value">
                    {hintsEnabled ? '[ HINTS: ON ]' : '[ HINTS: OFF ]'}
                  </div>
                </div>
                <div className="chess-meta-item">
                  <div className="chess-meta-label">Puzzle Rating</div>
                  <div className="chess-meta-value">PUZZLE RATING: {currentPuzzle.rating}</div>
                </div>
                <div className="chess-meta-item">
                  <div className="chess-meta-label">Attempts</div>
                  <div className="chess-meta-value">ATTEMPTS: {attemptDisplay}</div>
                </div>
                <div className="chess-meta-item">
                  <div className="chess-meta-label">Timer</div>
                  <div className="chess-meta-value">TIMER: {formatTimer(timerSeconds)}</div>
                </div>
              </div>
            </div>
          </Card>
        ) : null}
      </div>

      <div className="chess-column">
        <Card>
          <div className="chess-stats-grid">
            <div className="chess-stat-row">
              <span className="chess-stat-label">Your Rating</span>
              <span className="chess-stat-value">YOUR RATING: {playerRating.r}</span>
            </div>
            <div className="chess-stat-row">
              <span className="chess-stat-label">Rating Deviation</span>
              <span className="chess-stat-value">RD: {playerRating.rd}</span>
            </div>
            <div className="chess-stat-row">
              <span className="chess-stat-label">Puzzles Solved</span>
              <span className="chess-stat-value">PUZZLES SOLVED: {stats.solved}</span>
            </div>
            <div className="chess-stat-row">
              <span className="chess-stat-label">Accuracy</span>
              <span className="chess-stat-value">ACCURACY: {stats.accuracy}%</span>
            </div>
            <div className="chess-stat-row">
              <span className="chess-stat-label">Streak</span>
              <span className="chess-stat-value">STREAK: {stats.streak}</span>
            </div>
          </div>
          {ratingDeltaText ? <div className="chess-feedback">{ratingDeltaText}</div> : null}
          <div className="chess-period">RATING PERIOD: {attemptBuffer.length} / {RATING_PERIOD}</div>
        </Card>
      </div>
    </div>
  );

  return (
    <div className="chess-tab-shell">
      <div className="chess-tab-row">
        <Button
          variant={activeTab === 'PUZZLES' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('PUZZLES')}
        >
          Puzzles
        </Button>
        <Button
          variant={activeTab === 'PLAY_AI' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('PLAY_AI')}
        >
          Play AI
        </Button>
      </div>
      {activeTab === 'PUZZLES' ? puzzlesTab : <PlayAI />}
    </div>
  );
}
