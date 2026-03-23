import { useEffect, useMemo, useState } from 'react';
import { Badge } from '../../shared/components/Badge';
import { Button } from '../../shared/components/Button';
import { Card } from '../../shared/components/Card';
import BestHandMode from './BestHandMode';
import HandRankingMode from './HandRankingMode';
import OddsMode from './OddsMode';
import SimulatorMode from './SimulatorMode';
import './poker.css';

type SessionMode = 'PRACTICE' | 'PLAY';
type TrainerView = 'SIMULATOR' | 'HAND_RANKING' | 'BEST_HAND' | 'ODDS';
type RankName = 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM' | 'DIAMOND' | 'ELITE';

type RankState = {
  rankIndex: number;
  correctInRank: number;
  wrongInRank: number;
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

const RANK_STORAGE_KEY = 'qts_poker_rank';
const RANKS: RankMeta[] = [
  { name: 'BRONZE', required: 10, timeLimit: 15 },
  { name: 'SILVER', required: 20, timeLimit: 12 },
  { name: 'GOLD', required: 30, timeLimit: 10 },
  { name: 'PLATINUM', required: 40, timeLimit: 8 },
  { name: 'DIAMOND', required: 50, timeLimit: 6 },
  { name: 'ELITE', required: null, timeLimit: 5 },
];

const MODE_COPY: Array<{ key: TrainerView; title: string; body: string }> = [
  {
    key: 'SIMULATOR',
    title: 'SIMULATOR',
    body: 'TABLE-BASED DECISION SPOTS WITH POSITION, POT SIZE, BOARD TEXTURE, AND RANGE FEEDBACK.',
  },
  {
    key: 'HAND_RANKING',
    title: 'HAND RANKING',
    body: 'TRACK YOUR MADE HAND THROUGH FLOP, TURN, AND RIVER WITH FAST MULTIPLE-CHOICE DRILLS.',
  },
  {
    key: 'BEST_HAND',
    title: 'BEST HAND',
    body: 'COMPARE MULTIPLE HOLDINGS ON THE SAME BOARD AND IDENTIFY THE TRUE WINNER.',
  },
  {
    key: 'ODDS',
    title: 'ODDS',
    body: 'CALCULATE POT ODDS AND BREAK-EVEN THRESHOLDS UNDER PRESSURE.',
  },
];

function loadRankState(): RankState {
  try {
    const raw = localStorage.getItem(RANK_STORAGE_KEY);

    if (!raw) {
      return { rankIndex: 0, correctInRank: 0, wrongInRank: 0 };
    }

    const parsed = JSON.parse(raw) as Partial<RankState>;

    return {
      rankIndex:
        typeof parsed.rankIndex === 'number' && parsed.rankIndex >= 0 && parsed.rankIndex < RANKS.length
          ? parsed.rankIndex
          : 0,
      correctInRank: typeof parsed.correctInRank === 'number' && parsed.correctInRank >= 0 ? parsed.correctInRank : 0,
      wrongInRank: typeof parsed.wrongInRank === 'number' && parsed.wrongInRank >= 0 ? parsed.wrongInRank : 0,
    };
  } catch {
    return { rankIndex: 0, correctInRank: 0, wrongInRank: 0 };
  }
}

function renderActiveMode(view: TrainerView, props: ModeProps) {
  switch (view) {
    case 'SIMULATOR':
      return <SimulatorMode {...props} />;
    case 'HAND_RANKING':
      return <HandRankingMode {...props} />;
    case 'BEST_HAND':
      return <BestHandMode {...props} />;
    case 'ODDS':
      return <OddsMode {...props} />;
    default:
      return null;
  }
}

export default function PokerModule() {
  const [sessionMode, setSessionMode] = useState<SessionMode>('PRACTICE');
  const [rankState, setRankState] = useState<RankState>(() => loadRankState());
  const [selectedView, setSelectedView] = useState<TrainerView | null>(null);
  const [selectorValue, setSelectorValue] = useState<TrainerView>('SIMULATOR');

  const rank = RANKS[rankState.rankIndex];
  const progressTarget = rank.required ?? 1;
  const progressValue = rank.required === null ? progressTarget : Math.min(rankState.correctInRank, progressTarget);
  const progressPercent = rank.required === null ? 100 : (progressValue / progressTarget) * 100;
  const wrongText = sessionMode === 'PLAY' ? `${rankState.wrongInRank}/3 WRONG` : 'UNTIMED';

  useEffect(() => {
    try {
      localStorage.setItem(RANK_STORAGE_KEY, JSON.stringify(rankState));
    } catch {
      // Ignore localStorage failures.
    }
  }, [rankState]);

  const timeLimitSec = sessionMode === 'PLAY' ? rank.timeLimit : null;

  const handleScoredResult = (correct: boolean) => {
    if (sessionMode !== 'PLAY') {
      return;
    }

    setRankState((current) => {
      const currentRank = RANKS[current.rankIndex];

      if (correct) {
        if (currentRank.required !== null && current.correctInRank + 1 >= currentRank.required) {
          return current.rankIndex === RANKS.length - 1
            ? current
            : { rankIndex: current.rankIndex + 1, correctInRank: 0, wrongInRank: 0 };
        }

        return {
          ...current,
          correctInRank: current.correctInRank + 1,
        };
      }

      const nextWrong = current.wrongInRank + 1;

      if (nextWrong >= 3) {
        return {
          ...current,
          correctInRank: 0,
          wrongInRank: 0,
        };
      }

      return {
        ...current,
        wrongInRank: nextWrong,
      };
    });
  };

  const activeModeCard = useMemo(
    () =>
      MODE_COPY.find((mode) => mode.key === selectedView) ?? MODE_COPY.find((mode) => mode.key === selectorValue) ?? MODE_COPY[0],
    [selectedView, selectorValue],
  );

  return (
    <div className="poker-page">
      <Card className="poker-topbar">
        <div className="poker-topbar-row">
          <div className="poker-rank-block">
            <Badge label={rank.name} />
            <div className="poker-rank-meta">
              <span>{rank.required === null ? 'MAX RANK' : `${rankState.correctInRank}/${rank.required}`}</span>
              <span>{wrongText}</span>
            </div>
          </div>

          <div className="poker-progress-shell">
            <div className="poker-progress-header">
              <span>PROGRESS TO NEXT RANK</span>
              <span>{rank.required === null ? 'COMPLETE' : `${rankState.correctInRank}/${rank.required}`}</span>
            </div>
            <div className="poker-progress-bar">
              <div className="poker-progress-fill" style={{ width: `${progressPercent}%` }} />
            </div>
          </div>
        </div>

        <div className="poker-topbar-row poker-topbar-controls">
          <div className="poker-toggle-group">
            <Button
              onClick={() => setSessionMode('PRACTICE')}
              variant={sessionMode === 'PRACTICE' ? 'default' : 'ghost'}
            >
              Practice
            </Button>
            <Button onClick={() => setSessionMode('PLAY')} variant={sessionMode === 'PLAY' ? 'default' : 'ghost'}>
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
              <Button onClick={() => setSelectedView(selectorValue)}>Enter</Button>
            )}
          </div>
        </div>

        <div className="poker-topbar-row poker-status-row">
          <span>{sessionMode === 'PLAY' ? `TIMER ${rank.timeLimit}S` : 'FULL FEEDBACK MODE'}</span>
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
