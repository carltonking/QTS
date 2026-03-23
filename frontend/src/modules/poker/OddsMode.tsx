import { useEffect, useMemo, useState } from 'react';
import { Badge } from '../../shared/components/Badge';
import { Button } from '../../shared/components/Button';
import { Card } from '../../shared/components/Card';

type SessionMode = 'PRACTICE' | 'PLAY';
type OddsSubMode = 'ODDS_AGAINST' | 'BREAK_EVEN';
type OddsModeProps = {
  sessionMode: SessionMode;
  timeLimitSec: number | null;
  onScoredResult: (correct: boolean) => void;
};

type OddsScenario = {
  key: string;
  pot: number;
  bet: number;
  correct: string;
  explanation: string;
  choices: string[];
};

const POT_OPTIONS = [50, 75, 100, 150, 200, 300];
const BET_OPTIONS = [25, 33, 50, 75, 100, 150];

function formatRatio(value: number): string {
  const rounded = Math.round(value * 10) / 10;
  return `${rounded}:1`;
}

function uniqueChoices(values: string[]): string[] {
  return [...new Set(values)].slice(0, 3);
}

function createScenario(mode: OddsSubMode): OddsScenario {
  const pot = POT_OPTIONS[Math.floor(Math.random() * POT_OPTIONS.length)];
  const legalBets = BET_OPTIONS.filter((bet) => bet <= pot * 2);
  const bet = legalBets[Math.floor(Math.random() * legalBets.length)];
  const ratio = (pot + bet) / bet;
  const breakEven = Math.round((bet / (pot + bet + bet)) * 100);

  if (mode === 'ODDS_AGAINST') {
    const correct = formatRatio(ratio);
    const choices = uniqueChoices([
      correct,
      formatRatio(Math.max(0.5, ratio - 1)),
      formatRatio(ratio + 1),
    ]).sort(() => Math.random() - 0.5);

    return {
      key: `odds-${Date.now()}-${Math.random()}`,
      pot,
      bet,
      correct,
      explanation: `POT ODDS USE THE CURRENT POT AFTER THE BET. YOU CALL ${bet} TO WIN ${pot + bet}, SO THE PRICE IS ${correct}.`,
      choices,
    };
  }

  const correct = `${breakEven}%`;
  const choices = uniqueChoices([
    correct,
    `${Math.max(1, breakEven - 8)}%`,
    `${Math.min(99, breakEven + 7)}%`,
  ]).sort(() => Math.random() - 0.5);

  return {
    key: `breakeven-${Date.now()}-${Math.random()}`,
    pot,
    bet,
    correct,
    explanation: `BREAK-EVEN EQUITY IS CALL / (POT + BET + CALL). HERE THAT IS ${bet} / ${pot + bet + bet} = ${correct}.`,
    choices,
  };
}

export default function OddsMode({ sessionMode, timeLimitSec, onScoredResult }: OddsModeProps) {
  const [subMode, setSubMode] = useState<OddsSubMode>('ODDS_AGAINST');
  const [scenario, setScenario] = useState<OddsScenario>(() => createScenario('ODDS_AGAINST'));
  const [selected, setSelected] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(timeLimitSec ?? 0);

  const timerPercent = useMemo(
    () => (timeLimitSec ? Math.max(0, (timeLeft / timeLimitSec) * 100) : 100),
    [timeLeft, timeLimitSec],
  );

  useEffect(() => {
    setScenario(createScenario(subMode));
    setSelected(null);
  }, [subMode]);

  useEffect(() => {
    if (sessionMode !== 'PLAY' || timeLimitSec === null || selected !== null) {
      return;
    }

    setTimeLeft(timeLimitSec);
    const startedAt = Date.now();
    const timer = window.setInterval(() => {
      const remaining = Math.max(0, timeLimitSec * 1000 - (Date.now() - startedAt));
      setTimeLeft(remaining / 1000);

      if (remaining <= 0) {
        window.clearInterval(timer);
        setSelected('TIMEOUT');
        onScoredResult(false);
      }
    }, 100);

    return () => window.clearInterval(timer);
  }, [onScoredResult, scenario.key, selected, sessionMode, timeLimitSec]);

  const choose = (value: string) => {
    if (selected !== null) {
      return;
    }

    setSelected(value);
    onScoredResult(value === scenario.correct);
  };

  return (
    <div className="poker-mode-layout">
      <Card className="poker-mode-shell">
        <div className="poker-mode-header">
          <Badge label="Odds" />
          <div className="poker-pill-row">
            <Button
              variant={subMode === 'ODDS_AGAINST' ? 'default' : 'ghost'}
              onClick={() => setSubMode('ODDS_AGAINST')}
            >
              Odds Against
            </Button>
            <Button
              variant={subMode === 'BREAK_EVEN' ? 'default' : 'ghost'}
              onClick={() => setSubMode('BREAK_EVEN')}
            >
              Break Even %
            </Button>
          </div>
        </div>

        <Card className="poker-scenario-box">
          <div>POT: ${scenario.pot}</div>
          <div>OPPONENT BETS: ${scenario.bet}</div>
        </Card>

        {sessionMode === 'PLAY' && timeLimitSec ? (
          <div className="poker-timer-bar">
            <div className="poker-timer-fill" style={{ width: `${timerPercent}%` }} />
          </div>
        ) : null}

        <div className="poker-option-grid">
          {scenario.choices.map((choice) => (
            <Button key={choice} onClick={() => choose(choice)} disabled={selected !== null}>
              {choice}
            </Button>
          ))}
        </div>

        {selected ? (
          <>
            <div
              className={`poker-feedback-box ${
                selected === scenario.correct ? 'poker-feedback-hit' : 'poker-feedback-miss'
              }`}
            >
              <div>{selected === 'TIMEOUT' ? 'TIME EXPIRED' : selected === scenario.correct ? 'CORRECT' : 'INCORRECT'}</div>
              <div>CORRECT ANSWER: {scenario.correct}</div>
            </div>
            <div className="poker-explainer">{scenario.explanation}</div>
            <Button onClick={() => { setScenario(createScenario(subMode)); setSelected(null); }}>
              Next Scenario
            </Button>
          </>
        ) : null}
      </Card>
    </div>
  );
}
