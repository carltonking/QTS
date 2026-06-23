export type Category = "MATH" | "PROBABILITY" | "FINANCE";
export type AttemptResult = "CORRECT" | "INCORRECT" | "PARTIAL";
export type Difficulty = "EASY" | "MEDIUM" | "HARD";

export interface Question {
  id: string;
  title: string;
  body: string;
  category: Category;
  difficulty: Difficulty;
  hint: string;
  solution: string;
  tags: string[];
}

export interface UserState {
  ratings: { MATH: number; PROBABILITY: number; FINANCE: number };
  solved: number;
  streak: number;
  bookmarks: string[];
  history: AttemptRecord[];
}

export interface AttemptRecord {
  questionId: string;
  result: AttemptResult;
  timestamp: number;
}
