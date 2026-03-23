import { useEffect, useMemo, useState } from 'react';
import { Badge } from '../../shared/components/Badge';
import { Button } from '../../shared/components/Button';
import { Card } from '../../shared/components/Card';
import { CardComponent } from './CardComponent';
import { Deck } from './engine/Deck';
import { HandEvaluator } from './engine/HandEvaluator';
import type { Card as PokerCard } from './engine/types';

type SessionMode = 'PRACTICE' | 'PLAY';
type BestHandModeProps = {
  sessionMode: SessionMode;
  timeLimitSec: number | null;
  onScoredResult: (correct: boolean) => void;
};

type CandidateHand = {
  id: string;
  holeCards: [PokerCard, PokerCard];
  handName: string;
  rank: number;
};

type BestHandRound = {
  key: string;
  board: [PokerCard, PokerCard, PokerCard, PokerCard, PokerCard];
  candidates: CandidateHand[];
  winnerId: string;
};

function createRound(): BestHandRound {
  for (let attempt = 0; attempt < 300; attempt += 1) {
    const deck = new Deck();
    deck.shuffle();
    const board = deck.deal(5) as [PokerCard, PokerCard, PokerCard, PokerCard, PokerCard];
    const candidates: CandidateHand[] = [0, 1, 2].map((index) => {
      const holeCards = deck.deal(2) as [PokerCard, PokerCard];
      const hand = HandEvaluator.evaluate([...holeCards, ...board]);
      return {
        id: `choice-${index}`,
        holeCards,
        handName: hand.name,
        rank: hand.rank,
      };
    });

    const sorted = [...candidates].sort((left, right) => left.rank - right.rank);

    if (sorted[0].rank !== sorted[1].rank) {
      return {
        key: `best-${Date.now()}-${Math.random()}`,
        board,
        candidates,
        winnerId: sorted[0].id,
      };
    }
  }

  throw new Error('Unable to generate unique best-hand scenario.');
}

export default function BestHandMode({ sessionMode, timeLimitSec, onScoredResult }: BestHandModeProps) {
  const [round, setRound] = useState<BestHandRound>(() => createRound());
  const [selected, setSelected] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(timeLimitSec ?? 0);

  const winner = useMemo(
    () => round.candidates.find((candidate) => candidate.id === round.winnerId) ?? round.candidates[0],
    [round.candidates, round.winnerId],
  );
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
        onScoredResult(false);
      }
    }, 100);

    return () => window.clearInterval(timer);
  }, [onScoredResult, round.key, selected, sessionMode, timeLimitSec]);

  const choose = (candidateId: string) => {
    if (selected !== null) {
      return;
    }

    setSelected(candidateId);
    onScoredResult(candidateId === round.winnerId);
  };

  const isCorrect = selected !== null && selected === round.winnerId;

  return (
    <div className="poker-mode-layout">
      <Card className="poker-mode-shell">
        <div className="poker-mode-header">
          <Badge label="Best Hand" />
          <Badge label="River" />
        </div>

        <div className="poker-card-row">
          {round.board.map((card, index) => (
            <CardComponent key={`board-${index}`} card={card} size="md" />
          ))}
        </div>

        {sessionMode === 'PLAY' && timeLimitSec ? (
          <div className="poker-timer-bar">
            <div className="poker-timer-fill" style={{ width: `${timerPercent}%` }} />
          </div>
        ) : null}

        <div className="poker-choice-stack">
          {round.candidates.map((candidate) => (
            <button
              key={candidate.id}
              type="button"
              className="poker-choice-card"
              onClick={() => choose(candidate.id)}
              disabled={selected !== null}
            >
              <div className="poker-card-row">
                {candidate.holeCards.map((card, index) => (
                  <CardComponent key={`${candidate.id}-${index}`} card={card} size="md" />
                ))}
              </div>
              <div>{candidate.handName}</div>
            </button>
          ))}
        </div>

        {selected ? (
          <div className={`poker-feedback-box ${isCorrect ? 'poker-feedback-hit' : 'poker-feedback-miss'}`}>
            <div>{selected === 'TIMEOUT' ? 'TIME EXPIRED' : isCorrect ? 'CORRECT' : 'INCORRECT'}</div>
            <div>BEST HAND: {winner.handName}</div>
          </div>
        ) : null}

        {selected ? (
          <div className="poker-explainer">
            THE WINNING HOLDING MAKES THE BEST FIVE-CARD COMBINATION AGAINST THE BOARD. IDENTIFY THE HAND WITH THE LOWEST NUMERICAL HAND RANK.
          </div>
        ) : null}

        {selected ? <Button onClick={() => { setRound(createRound()); setSelected(null); }}>Next Hand</Button> : null}
      </Card>
    </div>
  );
}
