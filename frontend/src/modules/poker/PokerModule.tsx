import { useEffect, useMemo, useState } from "react";
import { Badge } from "../../shared/components/Badge";
import { Button } from "../../shared/components/Button";
import { Card } from "../../shared/components/Card";
import { useLocalStorage } from "../../shared/hooks/useLocalStorage";
import { useSyncToBackend } from "../../shared/hooks/useSyncToBackend";
import { STORAGE_KEYS } from "../../shared/constants";
import BestHandMode from "./BestHandMode";
import HandRankingMode from "./HandRankingMode";
import OddsMode from "./OddsMode";
import SimulatorMode from "./SimulatorMode";
import "./poker.css";

type SessionMode = "PRACTICE" | "PLAY";
type TrainerView = "SIMULATOR" | "HAND_RANKING" | "BEST_HAND" | "ODDS";
type RankName = "BRONZE" | "SILVER" | "GOLD" | "PLATINUM" | "DIAMOND" | "ELITE";

type RankState = {
  rankIndex: number;
  correctInRank: number;
  wrongInRank: number;
  totalAttempts: number;
  correctAttempts: number;
  bestStreak: number;
};

type RankMeta = {
  name: RankName;
  required: number | null;
  timeLimit: number;
};

type ModeProps = {
  sessionMode: SessionMode;
  timeLimitSec: number | null;
  onScoredResult: (correct: boolean) => void;
};

const RANKS: RankMeta[] = [
  { name: "BRONZE", required: 10, timeLimit: 15 },
  { name: "SILVER", required: 20, timeLimit: 12 },
  { name: "GOLD", required: 30, timeLimit: 10 },
  { name: "PLATINUM", required: 40, timeLimit: 8 },
  { name: "DIAMOND", required: 50, timeLimit: 6 },
  { name: "ELITE", required: null, timeLimit: 5 },
];

const MODE_COPY: Array<{ key: TrainerView; title: string; body: string }> = [
  {
    key: "SIMULATOR",
    title: "SIMULATOR",
    body: "TABLE-BASED DECISION SPOTS WITH POSITION, POT SIZE, BOARD TEXTURE, AND RANGE FEEDBACK.",
  },
  {
    key: "HAND_RANKING",
    title: "HAND RANKING",
    body: "TRACK YOUR MADE HAND THROUGH FLOP, TURN, AND RIVER WITH FAST MULTIPLE-CHOICE DRILLS.",
  },
  {
    key: "BEST_HAND",
    title: "BEST HAND",
    body: "COMPARE MULTIPLE HOLDINGS ON THE SAME BOARD AND IDENTIFY THE TRUE WINNER.",
  },
  {
    key: "ODDS",
    title: "ODDS",
    body: "CALCULATE POT ODDS AND BREAK-EVEN THRESHOLDS UNDER PRESSURE.",
  },
];

const DEFAULT_RANK_STATE: RankState = {
  rankIndex: 0,
  correctInRank: 0,
  wrongInRank: 0,
  totalAttempts: 0,
  correctAttempts: 0,
  bestStreak: 0,
};

function parseRankState(raw: RankState): RankState {
  return {
    rankIndex:
      typeof raw.rankIndex === "number" &&
      raw.rankIndex >= 0 &&
      raw.rankIndex < RANKS.length
        ? raw.rankIndex
        : 0,
    correctInRank:
      typeof raw.correctInRank === "number" && raw.correctInRank >= 0
        ? raw.correctInRank
        : 0,
    wrongInRank:
      typeof raw.wrongInRank === "number" && raw.wrongInRank >= 0
        ? raw.wrongInRank
        : 0,
    totalAttempts:
      typeof raw.totalAttempts === "number" ? raw.totalAttempts : 0,
    correctAttempts:
      typeof raw.correctAttempts === "number" ? raw.correctAttempts : 0,
    bestStreak: typeof raw.bestStreak === "number" ? raw.bestStreak : 0,
  };
}

function renderActiveMode(view: TrainerView, props: ModeProps) {
  switch (view) {
    case "SIMULATOR":
      return <SimulatorMode {...props} />;
    case "HAND_RANKING":
      return <HandRankingMode {...props} />;
    case "BEST_HAND":
      return <BestHandMode {...props} />;
    case "ODDS":
      return <OddsMode {...props} />;
    default:
      return null;
  }
}

export default function PokerModule() {
  const [sessionMode, setSessionMode] = useState<SessionMode>("PRACTICE");
  const [rankState, setRankState] = useLocalStorage<RankState>(
    STORAGE_KEYS.POKER_RANK,
    DEFAULT_RANK_STATE,
    parseRankState,
  );
  const { syncPokerProgress } = useSyncToBackend();
  const [selectedView, setSelectedView] = useState<TrainerView | null>(null);
  const [selectorValue, setSelectorValue] = useState<TrainerView>("SIMULATOR");

  const rank = RANKS[rankState.rankIndex];
  const progressTarget = rank.required ?? 1;
  const progressValue =
    rank.required === null
      ? progressTarget
      : Math.min(rankState.correctInRank, progressTarget);
  const progressPercent =
    rank.required === null ? 100 : (progressValue / progressTarget) * 100;
  const wrongText =
    sessionMode === "PLAY" ? `${rankState.wrongInRank}/3 WRONG` : "UNTIMED";

  const timeLimitSec = sessionMode === "PLAY" ? rank.timeLimit : null;

  const handleScoredResult = (correct: boolean) => {
    if (sessionMode !== "PLAY") {
      return;
    }

    setRankState((current) => {
      const currentRank = RANKS[current.rankIndex];
      const nextTotal = current.totalAttempts + 1;
      const nextCorrect = current.correctAttempts + (correct ? 1 : 0);

      let nextStreak = current.bestStreak;
      if (correct) {
        const newStreak = current.rankIndex > 0 ? 1 : current.correctInRank + 1;
        if (newStreak > nextStreak) nextStreak = newStreak;
      }

      if (correct) {
        if (
          currentRank.required !== null &&
          current.correctInRank + 1 >= currentRank.required
        ) {
          return current.rankIndex === RANKS.length - 1
            ? {
                ...current,
                totalAttempts: nextTotal,
                correctAttempts: nextCorrect,
                bestStreak: nextStreak,
              }
            : {
                rankIndex: current.rankIndex + 1,
                correctInRank: 0,
                wrongInRank: 0,
                totalAttempts: nextTotal,
                correctAttempts: nextCorrect,
                bestStreak: nextStreak,
              };
        }

        return {
          ...current,
          correctInRank: current.correctInRank + 1,
          totalAttempts: nextTotal,
          correctAttempts: nextCorrect,
          bestStreak: nextStreak,
        };
      }

      const nextWrong = current.wrongInRank + 1;

      if (nextWrong >= 3) {
        return {
          ...current,
          correctInRank: 0,
          wrongInRank: 0,
          totalAttempts: nextTotal,
          correctAttempts: nextCorrect,
          bestStreak: nextStreak,
        };
      }

      return {
        ...current,
        wrongInRank: nextWrong,
        totalAttempts: nextTotal,
        correctAttempts: nextCorrect,
        bestStreak: nextStreak,
      };
    });
  };

  useEffect(() => {
    const name = RANKS[rankState.rankIndex]?.name || "BRONZE";
    syncPokerProgress(
      name,
      rankState.totalAttempts,
      rankState.correctAttempts,
      rankState.correctInRank,
      rankState.bestStreak,
    );
  }, [rankState, syncPokerProgress]);

  const activeModeCard = useMemo(
    () =>
      MODE_COPY.find((mode) => mode.key === selectedView) ??
      MODE_COPY.find((mode) => mode.key === selectorValue) ??
      MODE_COPY[0],
    [selectedView, selectorValue],
  );

  return (
    <div className="poker-page">
      <Card className="poker-topbar">
        <div className="poker-topbar-row">
          <div className="poker-rank-block">
            <Badge label={rank.name} />
            <div className="poker-rank-meta">
              <span>
                {rank.required === null
                  ? "MAX RANK"
                  : `${rankState.correctInRank}/${rank.required}`}
              </span>
              <span>{wrongText}</span>
            </div>
          </div>

          <div className="poker-progress-shell">
            <div className="poker-progress-header">
              <span>PROGRESS TO NEXT RANK</span>
              <span>
                {rank.required === null
                  ? "COMPLETE"
                  : `${rankState.correctInRank}/${rank.required}`}
              </span>
            </div>
            <div className="poker-progress-bar">
              <div
                className="poker-progress-fill"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>

        <div className="poker-topbar-row poker-topbar-controls">
          <div className="poker-toggle-group">
            <Button
              onClick={() => setSessionMode("PRACTICE")}
              variant={sessionMode === "PRACTICE" ? "default" : "ghost"}
            >
              Practice
            </Button>
            <Button
              onClick={() => setSessionMode("PLAY")}
              variant={sessionMode === "PLAY" ? "default" : "ghost"}
            >
              Play
            </Button>
          </div>

          <div className="poker-selector-group">
            <label className="poker-select-label">
              <span>MODE SELECTOR</span>
              <select
                className="poker-select"
                value={selectedView ?? selectorValue}
                onChange={(event) => {
                  const next = event.target.value as TrainerView;
                  setSelectorValue(next);
                  if (selectedView) {
                    setSelectedView(next);
                  }
                }}
              >
                {MODE_COPY.map((mode) => (
                  <option key={mode.key} value={mode.key}>
                    {mode.title}
                  </option>
                ))}
              </select>
            </label>

            {selectedView ? (
              <Button variant="ghost" onClick={() => setSelectedView(null)}>
                Back
              </Button>
            ) : (
              <Button onClick={() => setSelectedView(selectorValue)}>
                Enter
              </Button>
            )}
          </div>
        </div>

        <div className="poker-topbar-row poker-status-row">
          <span>
            {sessionMode === "PLAY"
              ? `TIMER ${rank.timeLimit}S`
              : "FULL FEEDBACK MODE"}
          </span>
          <span>{activeModeCard.title}</span>
        </div>
      </Card>

      {selectedView ? (
        renderActiveMode(selectedView, {
          sessionMode,
          timeLimitSec,
          onScoredResult: handleScoredResult,
        })
      ) : (
        <div className="poker-mode-grid">
          {MODE_COPY.map((mode) => (
            <Card key={mode.key} className="poker-mode-card">
              <div className="poker-mode-card-header">
                <Badge label={mode.title} />
              </div>
              <div className="poker-mode-copy">{mode.body}</div>
              <Button onClick={() => setSelectedView(mode.key)}>Start</Button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
