import type { Card, Rank, Suit } from './types';

const SUITS: Suit[] = ['S', 'H', 'D', 'C'];
const RANKS: Rank[] = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A'];

function cardKey(card: Card): string {
  return `${card.rank}${card.suit}`;
}

export class Deck {
  private cards: Card[] = [];

  constructor() {
    this.reset();
  }

  reset(): void {
    this.cards = [];

    SUITS.forEach((suit) => {
      RANKS.forEach((rank) => {
        this.cards.push({ rank, suit });
      });
    });
  }

  shuffle(): void {
    for (let index = this.cards.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(Math.random() * (index + 1));
      const current = this.cards[index];
      this.cards[index] = this.cards[swapIndex];
      this.cards[swapIndex] = current;
    }
  }

  deal(n: number): Card[] {
    if (n < 0 || n > this.cards.length) {
      throw new Error(`Cannot deal ${n} cards from a deck of ${this.cards.length}`);
    }

    return this.cards.splice(0, n);
  }

  remove(cards: Card[]): void {
    const keys = new Set(cards.map(cardKey));
    this.cards = this.cards.filter((card) => !keys.has(cardKey(card)));
  }

  getCards(): Card[] {
    return this.cards.map((card) => ({ ...card }));
  }
}
