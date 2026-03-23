export interface Puzzle {
  id: string;
  fen: string;
  moves: string[];
  rating: number;
  rd: number;
  themes: string[];
  turnToMove: 'WHITE' | 'BLACK';
}

export interface LichessPuzzleResponse {
  puzzle: {
    id: string;
    rating: number;
    solution: string[];
    themes: string[];
  };
  game: {
    pgn: string;
    players: Array<{
      color: 'white' | 'black';
      name?: string;
      title?: string;
      rating?: number;
    }>;
  };
}

export interface PlayerRating {
  r: number;
  rd: number;
  lastUpdated: number;
}

export interface PuzzleAttempt {
  puzzleId: string;
  puzzleRating: number;
  score: number;
  solvedAt: number;
  timeTaken: number;
}

export interface RatingHistoryEntry {
  rating: number;
  rd: number;
  timestamp: number;
  puzzlesSolved: number;
}
