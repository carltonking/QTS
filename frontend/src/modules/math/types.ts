export type Operation = 'ADD' | 'SUB' | 'MUL' | 'DIV';

export interface SessionConfig {
  operations: Operation[];
  duration: 30 | 60 | 120 | 180;
  ranges: {
    ADD: [number, number];
    SUB: [number, number];
    MUL: [number, number];
    DIV: [number, number];
  };
}

export interface Problem {
  a: number;
  b: number;
  operation: Operation;
  answer: number;
  display: string;
}

export interface SessionResult {
  id: string;
  date: string;
  config: SessionConfig;
  correct: number;
  incorrect: number;
  bestStreak: number;
  accuracy: number;
  name?: string;
}
