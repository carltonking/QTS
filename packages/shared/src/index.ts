export type Difficulty = "EASY" | "MEDIUM" | "HARD";
export type SubmissionStatus =
  | "ACCEPTED"
  | "WRONG_ANSWER"
  | "TIME_LIMIT_EXCEEDED"
  | "RUNTIME_ERROR"
  | "COMPILE_ERROR"
  | "PENDING";
export type ProgressStatus = "SOLVED" | "ATTEMPTED";
export type ProblemStatus = ProgressStatus | undefined;
export type UserRole = "USER" | "ADMIN";

export type TestCase = {
  input: string;
  expectedOutput: string;
};

export type AuthUser = {
  id: string;
  email: string;
  username: string;
  role: UserRole;
  createdAt?: string;
};

export type ProblemListItem = {
  id: number;
  slug: string;
  title: string;
  difficulty: Difficulty;
  tags: string[];
  acceptanceRate: number;
  neetcodeCategory?: string | null;
  status?: ProblemStatus;
};

export type ProblemDetail = {
  id: number;
  slug: string;
  title: string;
  difficulty: Difficulty;
  description: string;
  examples: Array<{ input: string; output: string; explanation?: string }>;
  constraints: string[];
  tags: string[];
  starterCode: Record<string, string>;
  solutionCode: Record<string, string>;
  acceptanceRate: number;
  neetcodeCategory?: string | null;
  neetcodeOrder?: number | null;
  status?: ProblemStatus;
};

export type SubmissionHistoryEntry = {
  id: string;
  language: string;
  status: string;
  runtime: number | null;
  memory: number | null;
  errorMessage: string | null;
  createdAt: string;
};

export type SubmissionRunResult = {
  status: string;
  runtime: number | null;
  memory: number | null;
  errorMessage: string | null;
  passed: number;
  total: number;
  percentile: number | null;
  testResults: Array<{
    input: string;
    expectedOutput: string;
    actualOutput: string;
    passed: boolean;
    status: string;
  }>;
  submissionId?: string;
};
