import { Deck } from './Deck';
import type { BoardTexture, Card, EquityResult, HandRank, Rank } from './types';

type Category =
  | 'ROYAL_FLUSH'
  | 'STRAIGHT_FLUSH'
  | 'FOUR_OF_A_KIND'
  | 'FULL_HOUSE'
  | 'FLUSH'
  | 'STRAIGHT'
  | 'THREE_OF_A_KIND'
  | 'TWO_PAIR'
  | 'ONE_PAIR'
  | 'HIGH_CARD';

type EvaluatedFive = {
  category: Category;
  score: number[];
  hand: HandRank;
};

const RANK_VALUE: Record<Rank, number> = {
  '2': 2,
  '3': 3,
  '4': 4,
  '5': 5,
  '6': 6,
  '7': 7,
  '8': 8,
  '9': 9,
  T: 10,
  J: 11,
  Q: 12,
  K: 13,
  A: 14,
};

const VALUE_NAME: Record<number, string> = {
  2: 'Twos',
  3: 'Threes',
  4: 'Fours',
  5: 'Fives',
  6: 'Sixes',
  7: 'Sevens',
  8: 'Eights',
  9: 'Nines',
  10: 'Tens',
  11: 'Jacks',
  12: 'Queens',
  13: 'Kings',
  14: 'Aces',
};

const VALUE_NAME_SINGULAR: Record<number, string> = {
  2: 'Two',
  3: 'Three',
  4: 'Four',
  5: 'Five',
  6: 'Six',
  7: 'Seven',
  8: 'Eight',
  9: 'Nine',
  10: 'Ten',
  11: 'Jack',
  12: 'Queen',
  13: 'King',
  14: 'Ace',
};

const CATEGORY_BASE: Record<Category, number> = {
  ROYAL_FLUSH: 1,
  STRAIGHT_FLUSH: 2,
  FOUR_OF_A_KIND: 11,
  FULL_HOUSE: 167,
  FLUSH: 323,
  STRAIGHT: 1600,
  THREE_OF_A_KIND: 1610,
  TWO_PAIR: 2468,
  ONE_PAIR: 3326,
  HIGH_CARD: 6186,
};

const DISTINCT_FIVE_RANKS = buildDistinctFiveRankOrdinals();

function sortDesc(values: number[]): number[] {
  return [...values].sort((left, right) => right - left);
}

function cardValues(cards: Card[]): number[] {
  return sortDesc(cards.map((card) => RANK_VALUE[card.rank]));
}

function countByValue(values: number[]): Array<{ value: number; count: number }> {
  const counts = new Map<number, number>();
  values.forEach((value) => {
    counts.set(value, (counts.get(value) ?? 0) + 1);
  });

  return [...counts.entries()]
    .map(([value, count]) => ({ value, count }))
    .sort((left, right) => {
      if (left.count !== right.count) {
        return right.count - left.count;
      }

      return right.value - left.value;
    });
}

function getStraightHigh(values: number[]): number | null {
  const unique = [...new Set(values)].sort((left, right) => right - left);

  if (unique[0] === 14) {
    unique.push(1);
  }

  for (let index = 0; index <= unique.length - 5; index += 1) {
    const window = unique.slice(index, index + 5);
    const isStraight = window.every((value, offset) => value === window[0] - offset);

    if (isStraight) {
      return window[0] === 1 ? 5 : window[0];
    }
  }

  return null;
}

function compareScores(left: number[], right: number[]): -1 | 0 | 1 {
  const length = Math.max(left.length, right.length);

  for (let index = 0; index < length; index += 1) {
    const leftValue = left[index] ?? 0;
    const rightValue = right[index] ?? 0;

    if (leftValue > rightValue) {
      return -1;
    }

    if (leftValue < rightValue) {
      return 1;
    }
  }

  return 0;
}

function combinations<T>(items: T[], size: number): T[][] {
  if (size === 0) {
    return [[]];
  }

  if (size > items.length) {
    return [];
  }

  if (size === items.length) {
    return [items];
  }

  const [first, ...rest] = items;
  const withFirst = combinations(rest, size - 1).map((combo) => [first, ...combo]);
  const withoutFirst = combinations(rest, size);
  return [...withFirst, ...withoutFirst];
}

function describeKickers(values: number[]): string {
  return values.map((value) => VALUE_NAME_SINGULAR[value]).join(', ');
}

function buildDistinctFiveRankOrdinals(): number[][] {
  const values = [14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2];
  const combos = combinations(values, 5)
    .map((combo) => sortDesc(combo))
    .filter((combo) => getStraightHigh(combo) === null)
    .sort((left, right) => (compareScores(left, right) === -1 ? -1 : 1));

  return combos;
}

function sameRanks(left: number[], right: number[]): boolean {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

function ordinalFromDistinctRanks(values: number[]): number {
  const ordinal = DISTINCT_FIVE_RANKS.findIndex((combo) => sameRanks(combo, values));

  if (ordinal < 0) {
    throw new Error(`Could not derive ordinal for ranks: ${values.join(',')}`);
  }

  return ordinal;
}

function ordinalExcluding(excluded: number, descending = true): number[] {
  const values = [14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2].filter((value) => value !== excluded);
  return descending ? values : [...values].reverse();
}

function exactRank(category: Category, score: number[]): number {
  if (category === 'ROYAL_FLUSH') {
    return 1;
  }

  if (category === 'STRAIGHT_FLUSH') {
    return CATEGORY_BASE[category] + (13 - score[0]);
  }

  if (category === 'FOUR_OF_A_KIND') {
    const [quadValue, kicker] = score;
    const kickerOrder = ordinalExcluding(quadValue);
    return CATEGORY_BASE[category] + (14 - quadValue) * 12 + kickerOrder.indexOf(kicker);
  }

  if (category === 'FULL_HOUSE') {
    const [tripValue, pairValue] = score;
    const pairOrder = ordinalExcluding(tripValue);
    return CATEGORY_BASE[category] + (14 - tripValue) * 12 + pairOrder.indexOf(pairValue);
  }

  if (category === 'FLUSH') {
    return CATEGORY_BASE[category] + ordinalFromDistinctRanks(score);
  }

  if (category === 'STRAIGHT') {
    return CATEGORY_BASE[category] + (14 - score[0]);
  }

  if (category === 'THREE_OF_A_KIND') {
    const [tripValue, kickerOne, kickerTwo] = score;
    const kickers = sortDesc([kickerOne, kickerTwo]);
    const combos = combinations(ordinalExcluding(tripValue), 2)
      .map((combo) => sortDesc(combo))
      .sort((left, right) => (compareScores(left, right) === -1 ? -1 : 1));
    const comboIndex = combos.findIndex((combo) => sameRanks(combo, kickers));
    return CATEGORY_BASE[category] + (14 - tripValue) * 66 + comboIndex;
  }

  if (category === 'TWO_PAIR') {
    const [highPair, lowPair, kicker] = score;
    const pairCombos = combinations([14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2], 2)
      .map((combo) => sortDesc(combo))
      .sort((left, right) => (compareScores(left, right) === -1 ? -1 : 1));
    const pairIndex = pairCombos.findIndex((combo) => sameRanks(combo, [highPair, lowPair]));
    const kickerOrder = ordinalExcluding(highPair).filter((value) => value !== lowPair);
    return CATEGORY_BASE[category] + pairIndex * 11 + kickerOrder.indexOf(kicker);
  }

  if (category === 'ONE_PAIR') {
    const [pairValue, ...kickers] = score;
    const kickerCombos = combinations(ordinalExcluding(pairValue), 3)
      .map((combo) => sortDesc(combo))
      .sort((left, right) => (compareScores(left, right) === -1 ? -1 : 1));
    const comboIndex = kickerCombos.findIndex((combo) => sameRanks(combo, kickers));
    return CATEGORY_BASE[category] + (14 - pairValue) * 220 + comboIndex;
  }

  return CATEGORY_BASE[category] + ordinalFromDistinctRanks(score);
}

function buildHand(category: Category, score: number[], name: string, description: string): EvaluatedFive {
  return {
    category,
    score,
    hand: {
      rank: exactRank(category, score),
      name,
      description,
    },
  };
}

export class HandEvaluator {
  static evaluate(cards: Card[]): HandRank {
    if (cards.length < 5 || cards.length > 7) {
      throw new Error(`Expected 5, 6, or 7 cards, received ${cards.length}`);
    }

    if (cards.length === 5) {
      return this.evaluateFive(cards);
    }

    const allHands = combinations(cards, 5).map((combo) => this.evaluateDetailedFive(combo));
    allHands.sort((left, right) => left.hand.rank - right.hand.rank);
    return allHands[0].hand;
  }

  static evaluateFive(cards: Card[]): HandRank {
    if (cards.length !== 5) {
      throw new Error(`Expected exactly 5 cards, received ${cards.length}`);
    }

    return this.evaluateDetailedFive(cards).hand;
  }

  static compare(hand1: HandRank, hand2: HandRank): -1 | 0 | 1 {
    if (hand1.rank < hand2.rank) {
      return -1;
    }

    if (hand1.rank > hand2.rank) {
      return 1;
    }

    return 0;
  }

  static runMonteCarlo(
    holeCards1: Card[],
    holeCards2: Card[],
    communityCards: Card[],
    iterations = 10000,
  ): EquityResult {
    let playerWins = 0;
    let opponentWins = 0;
    let ties = 0;

    for (let index = 0; index < iterations; index += 1) {
      const deck = new Deck();
      deck.remove([...holeCards1, ...holeCards2, ...communityCards]);
      deck.shuffle();

      const board = [...communityCards, ...deck.deal(5 - communityCards.length)];
      const playerHand = this.evaluate([...holeCards1, ...board]);
      const opponentHand = this.evaluate([...holeCards2, ...board]);
      const comparison = this.compare(playerHand, opponentHand);

      if (comparison === -1) {
        playerWins += 1;
      } else if (comparison === 1) {
        opponentWins += 1;
      } else {
        ties += 1;
      }
    }

    return {
      playerEquity: (playerWins + ties / 2) / iterations,
      opponentEquity: (opponentWins + ties / 2) / iterations,
      ties: ties / iterations,
      iterations,
    };
  }

  static classifyBoardTexture(communityCards: Card[]): BoardTexture {
    const suitCounts = new Map<string, number>();
    const values = sortDesc(communityCards.map((card) => RANK_VALUE[card.rank]));
    const uniqueValues = [...new Set(values)].sort((left, right) => left - right);

    communityCards.forEach((card) => {
      suitCounts.set(card.suit, (suitCounts.get(card.suit) ?? 0) + 1);
    });

    const maxSuitCount = Math.max(0, ...suitCounts.values());
    const suitedness =
      maxSuitCount === communityCards.length
        ? 'MONOTONE'
        : suitCounts.size === 2
          ? 'TWO_TONE'
          : 'RAINBOW';

    let longestRun = 1;
    let currentRun = 1;

    for (let index = 1; index < uniqueValues.length; index += 1) {
      if (uniqueValues[index] === uniqueValues[index - 1] + 1) {
        currentRun += 1;
        longestRun = Math.max(longestRun, currentRun);
      } else {
        currentRun = 1;
      }
    }

    const connectedness =
      longestRun >= 4 || (communityCards.length <= 3 && longestRun >= 3)
        ? 'HIGHLY_CONNECTED'
        : longestRun >= 3
          ? 'CONNECTED'
          : 'DISCONNECTED';

    const isPaired = new Set(values).size !== values.length;
    const wetness =
      suitedness === 'MONOTONE' || connectedness === 'HIGHLY_CONNECTED'
        ? 'WET'
        : suitedness === 'TWO_TONE' || connectedness === 'CONNECTED' || isPaired
          ? 'SEMI_WET'
          : 'DRY';

    return {
      wetness,
      suitedness,
      connectedness,
      isPaired,
      label: `${wetness} / ${suitedness.replace('_', '-')} / ${connectedness.replace('_', '-')}`,
    };
  }

  private static evaluateDetailedFive(cards: Card[]): EvaluatedFive {
    const values = cardValues(cards);
    const counts = countByValue(values);
    const isFlush = new Set(cards.map((card) => card.suit)).size === 1;
    const straightHigh = getStraightHigh(values);

    if (isFlush && straightHigh === 14) {
      return buildHand('ROYAL_FLUSH', [14], 'Royal Flush', 'Ace-high straight flush');
    }

    if (isFlush && straightHigh !== null) {
      return buildHand(
        'STRAIGHT_FLUSH',
        [straightHigh],
        'Straight Flush',
        `${VALUE_NAME_SINGULAR[straightHigh]}-high straight flush`,
      );
    }

    if (counts[0].count === 4) {
      const kicker = counts[1].value;
      return buildHand(
        'FOUR_OF_A_KIND',
        [counts[0].value, kicker],
        'Four of a Kind',
        `${VALUE_NAME[counts[0].value]} with ${VALUE_NAME_SINGULAR[kicker]} kicker`,
      );
    }

    if (counts[0].count === 3 && counts[1].count === 2) {
      return buildHand(
        'FULL_HOUSE',
        [counts[0].value, counts[1].value],
        'Full House',
        `${VALUE_NAME[counts[0].value]} full of ${VALUE_NAME[counts[1].value]}`,
      );
    }

    if (isFlush) {
      return buildHand(
        'FLUSH',
        values,
        'Flush',
        `${VALUE_NAME_SINGULAR[values[0]]}-high flush`,
      );
    }

    if (straightHigh !== null) {
      return buildHand(
        'STRAIGHT',
        [straightHigh],
        'Straight',
        `${VALUE_NAME_SINGULAR[straightHigh]}-high straight`,
      );
    }

    if (counts[0].count === 3) {
      const kickers = counts.slice(1).map((entry) => entry.value);
      return buildHand(
        'THREE_OF_A_KIND',
        [counts[0].value, ...kickers],
        'Three of a Kind',
        `${VALUE_NAME[counts[0].value]} with ${describeKickers(kickers)} kickers`,
      );
    }

    if (counts[0].count === 2 && counts[1].count === 2) {
      const highPair = Math.max(counts[0].value, counts[1].value);
      const lowPair = Math.min(counts[0].value, counts[1].value);
      const kicker = counts[2].value;

      return buildHand(
        'TWO_PAIR',
        [highPair, lowPair, kicker],
        'Two Pair',
        `${VALUE_NAME[highPair]} and ${VALUE_NAME[lowPair]} with ${VALUE_NAME_SINGULAR[kicker]} kicker`,
      );
    }

    if (counts[0].count === 2) {
      const kickers = counts.slice(1).map((entry) => entry.value);
      return buildHand(
        'ONE_PAIR',
        [counts[0].value, ...kickers],
        'One Pair',
        `${VALUE_NAME[counts[0].value]} with ${describeKickers(kickers)} kickers`,
      );
    }

    return buildHand(
      'HIGH_CARD',
      values,
      'High Card',
      `${VALUE_NAME_SINGULAR[values[0]]}-high`,
    );
  }
}

export type { BoardTexture };
