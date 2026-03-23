export type Suit = 'S' | 'H' | 'D' | 'C';
export type Rank = '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | 'T' | 'J' | 'Q' | 'K' | 'A';

export interface Card {
  rank: Rank;
  suit: Suit;
}

export type ScenarioMode = 'STANDARD' | 'ADVANCED';
export type Street = 'PREFLOP' | 'FLOP' | 'TURN' | 'RIVER' | 'SHOWDOWN';
export type Action = 'FOLD' | 'CHECK' | 'CALL' | 'RAISE' | 'ALL_IN';
export type Position = 'BTN' | 'SB' | 'BB' | 'UTG' | 'MP' | 'CO';
export type TableSize = 2 | 6;
export type FacingAction = 'CHECK' | 'BET_33' | 'BET_75' | 'BET_150' | 'RAISE';
export type ScenarioHandStrength = 'STRONG' | 'MEDIUM' | 'WEAK' | 'DRAW';

export interface Player {
  id: string;
  name: string;
  stack: number;
  holeCards: Card[];
  position: Position;
  isHuman: boolean;
  isFolded: boolean;
  isAllIn: boolean;
  currentBet: number;
  totalInvested: number;
}

export interface SidePot {
  amount: number;
  eligiblePlayerIds: string[];
}

export interface ActionRecord {
  playerId: string;
  action: Action;
  amount?: number;
  street: Street;
}

export interface LegalAction {
  action: Action;
  minAmount?: number;
  maxAmount?: number;
}

export interface GameState {
  tableSize: TableSize;
  players: Player[];
  deck: Card[];
  communityCards: Card[];
  pot: number;
  sidePots: SidePot[];
  street: Street;
  currentPlayerIndex: number;
  dealerIndex: number;
  minBet: number;
  bigBlind: number;
  smallBlind: number;
  actionHistory: ActionRecord[];
  handNumber: number;
}

export interface HandRank {
  rank: number;
  name: string;
  description: string;
}

export interface EquityResult {
  playerEquity: number;
  opponentEquity: number;
  ties: number;
  iterations: number;
}

export interface BoardTexture {
  wetness: 'DRY' | 'SEMI_WET' | 'WET';
  suitedness: 'RAINBOW' | 'TWO_TONE' | 'MONOTONE';
  connectedness: 'DISCONNECTED' | 'CONNECTED' | 'HIGHLY_CONNECTED';
  isPaired: boolean;
  label: string;
}

export interface Scenario {
  street: Exclude<Street, 'SHOWDOWN'>;
  heroPosition: Position;
  heroCards: [Card, Card];
  communityCards: Card[];
  potSize: number;
  facingAction: FacingAction;
  stackDepth: number;
  villainPosition: Position;
  handStrength: ScenarioHandStrength;
  boardTextureLabel: string;
  equityEstimate: number;
}

export interface GTOAnswer {
  primaryAction: 'FOLD' | 'CHECK' | 'CALL' | 'RAISE';
  acceptableActions: Array<'FOLD' | 'CHECK' | 'CALL' | 'RAISE'>;
  explanation: string;
  evDiff: number;
}
