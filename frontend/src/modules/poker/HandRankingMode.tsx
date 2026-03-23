import { useEffect, useMemo, useState } from 'react';
import { Badge } from '../../shared/components/Badge';
import { Button } from '../../shared/components/Button';
import { Card } from '../../shared/components/Card';
import { CardComponent } from './CardComponent';
import { Deck } from './engine/Deck';
import { HandEvaluator } from './engine/HandEvaluator';
import type { Card as PokerCard } from './engine/types';

type SessionMode = 'PRACTICE' | 'PLAY';
type HandRankingModeProps = {
  sessionMode: SessionMode;
  timeLimitSec: number | null;
  onScoredResult: (correct: boolean) => void;
};

type RankingRound = {
  key: string;
  heroCards: [PokerCard, PokerCard];
  board: [PokerCard, PokerCard, PokerCard, PokerCard, PokerCard];
};

const HAND_OPTIONS = [
  'High Card',
  'One Pair',
  'Two Pair',
  'Three of a Kind',
  'Straight',
  'Flush',
  'Full House',
  'Four of a Kind',
  'Straight Flush',
  'Royal Flush',
] as const;

function createRound(): RankingRound {
  const deck = new Deck();
  deck.shuffle();

  return {
    key: `ranking-${Date.now()}-${Math.random()}`,
    heroCards: deck.deal(2) as [PokerCard, PokerCard],
    board: deck.deal(5) as [PokerCard, PokerCard, PokerCard, PokerCard, PokerCard],
  };
}

function visibleBoard(board: RankingRound['board'], stageIndex: number): PokerCard[] {
  return stageIndex === 0 ? board.slice(0, 3) : stageIndex === 1 ? board.slice(0, 4) : board;
}

function buildOptions(correct: string): string[] {
  const index = HAND_OPTIONS.indexOf(correct as (typeof HAND_OPTIONS)[number]);
  const pool = new Set<string>([correct]);

  if (index > 0) pool.add(HAND_OPTIONS[index - 1]);
  if (index < HAND_OPTIONS.length - 1) pool.add(HAND_OPTIONS[index + 1]);

  while (pool.size < 4) {
    pool.add(HAND_OPTIONS[Math.floor(Math.random() * HAND_OPTIONS.length)]);
  }

  return [...pool].sort(() => Math.random() - 0.5);
}

export default function HandRankingMode({ sessionMode, timeLimitSec, onScoredResult }: HandRankingModeProps) {
  const [round, setRound] = useState<RankingRound>(() => createRound());
  const [stageIndex, setStageIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [answers, setAnswers] = useState<boolean[]>([]);
  const [timeLeft, setTimeLeft] = useState<number>(timeLimitSec ?? 0);

  const board = useMemo(() => visibleBoard(round.board, stageIndex), [round.board, stageIndex]);
  const correctName = useMemo(() => HandEvaluator.evaluate([...round.heroCards, ...board]).name, [board, round.heroCards]);
  const options = useMemo(() => buildOptions(correctName), [correctName]);
  const stageLabel = stageIndex === 0 ? 'FLOP' : stageIndex === 1 ? 'TURN' : 'RIVER';
  const timerPercent = timeLimitSec ? Math.max(0, (timeLeft / timeLimitSec) * 100) : 100;

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
        setAnswers((current) => [...current, false]);
        onScoredResult(false);
      }
    }, 100);

    return () => window.clearInterval(timer);
  }, [onScoredResult, round.key, selected, sessionMode, stageIndex, timeLimitSec]);

  const choose = (option: string) => {
    if (selected !== null) {
      return;
    }

    const correct = option === correctName;
    setSelected(option);
    setAnswers((current) => [...current, correct]);
    onScoredResult(correct);
  };

  const next = () => {
    if (stageIndex < 2) {
      setStageIndex((current) => current + 1);
      setSelected(null);
      return;
    }

    setRound(createRound());
    setStageIndex(0);
    setSelected(null);
    setAnswers([]);
  };

  const roundDone = stageIndex === 2 && selected !== null;
  const score = answers.filter(Boolean).length;

  return (
    <div className="poker-mode-layout">
      <Card className="poker-mode-shell">
        <div className="poker-mode-header">
          <Badge label="Hand Ranking" />
          <Badge label={stageLabel} />
        </div>

        <div className="poker-card-block">
          <div className="poker-card-row">
            {round.heroCards.map((card, index) => (
              <CardComponent key={`hero-${index}`} card={card} size="lg" />
            ))}
          </div>
          <div className="poker-card-row">
            {board.map((card, index) => (
              <CardComponent key={`board-${index}`} card={card} size="md" />
            ))}
          </div>
        </div>

        {sessionMode === 'PLAY' && timeLimitSec ? (
          <div className="poker-timer-bar">
            <div className="poker-timer-fill" style={{ width: `${timerPercent}%` }} />
          </div>
        ) : null}

        <div className="poker-option-grid">
          {options.map((option) => (
            <Button key={option} onClick={() => choose(option)} disabled={selected !== null}>
              {option}
            </Button>
          ))}
        </div>

        {selected ? (
          <div className={`poker-feedback-box ${selected === correctName ? 'poker-feedback-hit' : 'poker-feedback-miss'}`}>
            <div>{selected === 'TIMEOUT' ? 'TIME EXPIRED' : selected === correctName ? 'CORRECT' : 'INCORRECT'}</div>
            <div>CORRECT HAND: {correctName}</div>
          </div>
        ) : null}

        {roundDone ? (
          <Card className="poker-summary-card">
            <div className="poker-summary-line">ROUND COMPLETE</div>
            <div className="poker-summary-line">
              SCORE {score} / 3
            </div>
          </Card>
        ) : null}

        {selected ? <Button onClick={next}>{stageIndex < 2 ? 'Next Street' : 'New Round'}</Button> : null}
      </Card>
    </div>
  );
}
