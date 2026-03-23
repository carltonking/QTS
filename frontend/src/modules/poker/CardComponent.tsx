import type { Card } from './engine/types';

type CardComponentProps = {
  card?: Card;
  faceDown?: boolean;
  size?: 'sm' | 'md' | 'lg';
};

const suitMap: Record<Card['suit'], string> = {
  S: '♠',
  H: '♥',
  D: '♦',
  C: '♣',
};

export function CardComponent({ card, faceDown = false, size = 'md' }: CardComponentProps) {
  return (
    <div className={`poker-card poker-card-${size} ${faceDown ? 'poker-card-face-down' : ''}`}>
      {faceDown || !card ? (
        <div className="poker-card-back">░░</div>
      ) : (
        <>
          <div className="poker-card-rank">{card.rank}</div>
          <div className="poker-card-suit">{suitMap[card.suit]}</div>
        </>
      )}
    </div>
  );
}
