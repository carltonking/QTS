import type { CSSProperties } from 'react';
import { Badge } from '../../shared/components/Badge';
import type { Card as PokerCard, Position } from './engine/types';

type RangeAction = 'RAISE' | 'CALL' | 'FOLD';

type RangeChartProps = {
  heroCards: [PokerCard, PokerCard];
  heroPosition: Position;
  facingRaise: boolean;
  correctAction: 'FOLD' | 'CALL' | 'RAISE';
  explanation: string;
};

const RANKS = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'] as const;
const RANK_VALUE: Record<(typeof RANKS)[number], number> = {
  A: 14,
  K: 13,
  Q: 12,
  J: 11,
  T: 10,
  '9': 9,
  '8': 8,
  '7': 7,
  '6': 6,
  '5': 5,
  '4': 4,
  '3': 3,
  '2': 2,
};

function isInPosition(position: Position): boolean {
  return position === 'BTN' || position === 'CO';
}

function comboScore(first: string, second: string, suited: boolean): number {
  const high = Math.max(RANK_VALUE[first as keyof typeof RANK_VALUE], RANK_VALUE[second as keyof typeof RANK_VALUE]);
  const low = Math.min(RANK_VALUE[first as keyof typeof RANK_VALUE], RANK_VALUE[second as keyof typeof RANK_VALUE]);
  const paired = first === second;
  const connected = Math.abs(high - low) <= 1;
  let score = high * 4 + low * 2;

  if (paired) score += 26;
  if (suited) score += 6;
  if (connected) score += 4;
  if (high === 14) score += 4;
  if (high >= 10 && low >= 10) score += 3;

  return Math.min(100, Math.max(0, Math.round((score / 92) * 100)));
}

function rangeAction(first: string, second: string, suited: boolean, position: Position, facingRaise: boolean): RangeAction {
  const score = comboScore(first, second, suited);

  if (score >= 70) {
    return 'RAISE';
  }

  if (score >= 55) {
    return isInPosition(position) ? 'RAISE' : 'CALL';
  }

  if (score >= 40) {
    return position === 'BTN' ? 'RAISE' : 'CALL';
  }

  return facingRaise ? 'FOLD' : 'CALL';
}

function actionStyle(action: RangeAction, isHeroHand: boolean): CSSProperties {
  return {
    background:
      action === 'RAISE' ? '#ffffff' : action === 'CALL' ? '#555555' : '#111111',
    color: action === 'RAISE' ? '#000000' : '#ffffff',
    border: isHeroHand ? '2px solid var(--text-1)' : '1px solid var(--border)',
  };
}

function normalizeCombo(cards: [PokerCard, PokerCard]): string {
  const [first, second] = cards;
  const firstValue = RANK_VALUE[first.rank as keyof typeof RANK_VALUE];
  const secondValue = RANK_VALUE[second.rank as keyof typeof RANK_VALUE];

  if (first.rank === second.rank) {
    return `${first.rank}${second.rank}`;
  }

  const high = firstValue >= secondValue ? first : second;
  const low = firstValue >= secondValue ? second : first;
  const suited = high.suit === low.suit ? 'S' : 'O';

  return `${high.rank}${low.rank}${suited}`;
}

function matrixLabel(row: string, column: string, rowIndex: number, columnIndex: number): string {
  if (rowIndex === columnIndex) {
    return `${row}${column}`;
  }

  return `${row}${column}${rowIndex < columnIndex ? 'S' : 'O'}`;
}

export default function RangeChart({
  heroCards,
  heroPosition,
  facingRaise,
  correctAction,
  explanation,
}: RangeChartProps) {
  const heroCombo = normalizeCombo(heroCards);

  return (
    <div className="poker-range-shell">
      <div className="poker-range-grid-wrap">
        <div className="poker-range-label-row">
          <span />
          {RANKS.map((rank) => (
            <span key={`top-${rank}`} className="poker-range-axis">
              {rank}
            </span>
          ))}
        </div>

        {RANKS.map((rowRank, rowIndex) => (
          <div key={`row-${rowRank}`} className="poker-range-row">
            <span className="poker-range-axis">{rowRank}</span>
            {RANKS.map((columnRank, columnIndex) => {
              const suited = rowIndex < columnIndex;
              const cellLabel = matrixLabel(rowRank, columnRank, rowIndex, columnIndex);
              const action = rangeAction(rowRank, columnRank, suited, heroPosition, facingRaise);

              return (
                <div
                  key={cellLabel}
                  className="poker-range-cell"
                  style={actionStyle(action, heroCombo === cellLabel)}
                >
                  {cellLabel}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      <div className="poker-range-legend">
        <Badge label="Raise" />
        <Badge label="Call" />
        <Badge label="Fold" />
        <Badge label={`Correct ${correctAction}`} />
      </div>

      <div className="poker-range-explanation">{explanation}</div>
    </div>
  );
}
