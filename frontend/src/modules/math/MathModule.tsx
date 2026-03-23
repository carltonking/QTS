import { useEffect, useRef, useState } from 'react';
import './math.css';
import { generateProblem } from './MathEngine';
import { ConfigView } from './ConfigView';
import { GameView } from './GameView';
import { LeaderboardView } from './LeaderboardView';
import { ResultsView } from './ResultsView';
import type { Problem, SessionConfig, SessionResult } from './types';

const HISTORY_KEY = 'qts_math_history';
const LEADERBOARD_KEY = 'qts_math_leaderboard';

type Screen = 'config' | 'game' | 'results' | 'leaderboard';

const defaultConfig: SessionConfig = {
  operations: ['ADD', 'SUB', 'MUL', 'DIV'],
  duration: 60,
  ranges: {
    ADD: [2, 99],
    SUB: [2, 99],
    MUL: [2, 12],
    DIV: [2, 12],
  },
};

function loadJson<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function createEmptyProblem(config: SessionConfig): Problem {
  return generateProblem(config);
}

export default function MathModule() {
  const finishedRef = useRef(false);
  const [screen, setScreen] = useState<Screen>('config');
  const [config, setConfig] = useState<SessionConfig>(defaultConfig);
  const [problem, setProblem] = useState<Problem>(() => createEmptyProblem(defaultConfig));
  const [secondsLeft, setSecondsLeft] = useState<number>(defaultConfig.duration);
  const [correct, setCorrect] = useState(0);
  const [incorrect, setIncorrect] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [sessionResult, setSessionResult] = useState<SessionResult | null>(null);
  const [history, setHistory] = useState<SessionResult[]>(() => loadJson<SessionResult[]>(HISTORY_KEY, []));
  const [leaderboard, setLeaderboard] = useState<SessionResult[]>(() =>
    loadJson<SessionResult[]>(LEADERBOARD_KEY, []),
  );

  useEffect(() => {
    if (screen !== 'game') {
      return;
    }

    finishedRef.current = false;

    const timer = window.setInterval(() => {
      setSecondsLeft((previous) => {
        if (previous <= 1) {
          window.clearInterval(timer);
          return 0;
        }

        return previous - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [screen]);

  useEffect(() => {
    if (screen === 'game' && secondsLeft === 0 && !finishedRef.current) {
      finishedRef.current = true;
      const totalAnswered = correct + incorrect;
      const result: SessionResult = {
        id:
          globalThis.crypto?.randomUUID?.() ??
          `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
        date: new Date().toLocaleDateString(),
        config,
        correct,
        incorrect,
        bestStreak,
        accuracy: totalAnswered > 0 ? Math.round((correct / totalAnswered) * 100) : 0,
      };

      const nextHistory = [...history, result];
      setHistory(nextHistory);
      window.localStorage.setItem(HISTORY_KEY, JSON.stringify(nextHistory));
      setSessionResult(result);
      setScreen('results');
    }
  }, [bestStreak, config, correct, history, incorrect, screen, secondsLeft]);

  const startSession = (nextConfig = config) => {
    finishedRef.current = false;
    setConfig(nextConfig);
    setProblem(generateProblem(nextConfig));
    setSecondsLeft(nextConfig.duration);
    setCorrect(0);
    setIncorrect(0);
    setStreak(0);
    setBestStreak(0);
    setSessionResult(null);
    setScreen('game');
  };

  const handleSubmitAnswer = (answer: number | null) => {
    const isCorrect = answer === problem.answer;

    if (isCorrect) {
      const nextStreak = streak + 1;
      setCorrect((previous) => previous + 1);
      setStreak(nextStreak);
      setBestStreak((previous) => Math.max(previous, nextStreak));
      window.setTimeout(() => {
        setProblem(generateProblem(config));
      }, 200);

      return { correct: true, expected: problem.answer };
    }

    setIncorrect((previous) => previous + 1);
    setStreak(0);
    window.setTimeout(() => {
      setProblem(generateProblem(config));
    }, 1000);

    return { correct: false, expected: problem.answer };
  };

  const saveToLeaderboard = (name: string) => {
    if (!sessionResult) {
      return;
    }

    const savedResult = { ...sessionResult, name };
    const nextHistory = history.map((entry) => (entry.id === savedResult.id ? savedResult : entry));
    const nextLeaderboard = [...leaderboard, savedResult]
      .sort((a, b) => b.correct - a.correct || b.accuracy - a.accuracy)
      .slice(0, 10);

    setSessionResult(savedResult);
    setHistory(nextHistory);
    setLeaderboard(nextLeaderboard);
    window.localStorage.setItem(HISTORY_KEY, JSON.stringify(nextHistory));
    window.localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(nextLeaderboard));
  };

  if (screen === 'leaderboard') {
    return <LeaderboardView entries={leaderboard} onBack={() => setScreen('config')} />;
  }

  if (screen === 'game') {
    return (
      <GameView
        problem={problem}
        secondsLeft={secondsLeft}
        correct={correct}
        incorrect={incorrect}
        streak={streak}
        onSubmitAnswer={handleSubmitAnswer}
      />
    );
  }

  if (screen === 'results' && sessionResult) {
    return (
      <ResultsView
        result={sessionResult}
        history={history}
        onRestart={() => startSession(config)}
        onNewSession={() => setScreen('config')}
        onSave={saveToLeaderboard}
      />
    );
  }

  return (
    <ConfigView
      config={config}
      onConfigChange={setConfig}
      onStart={() => startSession(config)}
      onLeaderboard={() => setScreen('leaderboard')}
    />
  );
}
