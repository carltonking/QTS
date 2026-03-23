import axios from 'axios';

export type Difficulty = 'EASY' | 'MEDIUM' | 'HARD';
export type ProblemStatus = 'SOLVED' | 'ATTEMPTED' | undefined;

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
  examples: Array<{
    input: string;
    output: string;
    explanation?: string;
  }>;
  constraints: string[];
  tags: string[];
  starterCode: Record<string, string>;
  solutionCode: Record<string, string>;
  acceptanceRate: number;
  neetcodeCategory?: string | null;
  neetcodeOrder?: number | null;
  status?: ProblemStatus;
};

export type ProblemsResponse = {
  problems: ProblemListItem[];
  total: number;
  page: number;
  pages: number;
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

export type AuthUser = {
  id: string;
  email: string;
  username: string;
  createdAt?: string;
};

export type AuthResponse = {
  token: string;
  user: AuthUser;
};

export type RoadmapResponse = {
  roadmap: Record<
    string,
    Array<{
      id: number;
      slug: string;
      title: string;
      difficulty: Difficulty;
      tags: string[];
      acceptanceRate: number;
      neetcodeCategory?: string | null;
      neetcodeOrder?: number | null;
      status?: ProblemStatus;
    }>
  >;
};

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001',
});

api.interceptors.request.use((config) => {
  const token = window.localStorage.getItem('qts_jwt');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      window.localStorage.removeItem('qts_jwt');

      if (window.location.pathname !== '/login') {
        window.location.assign('/login');
      }
    }

    return Promise.reject(error);
  },
);

export async function fetchProblems(params: {
  page: number;
  limit: number;
  difficulty?: Difficulty | 'ALL';
  search?: string;
  tag?: string;
}) {
  const response = await api.get<ProblemsResponse>('/api/problems', {
    params: {
      page: params.page,
      limit: params.limit,
      ...(params.difficulty && params.difficulty !== 'ALL'
        ? { difficulty: params.difficulty }
        : {}),
      ...(params.search ? { search: params.search } : {}),
      ...(params.tag ? { tag: params.tag } : {}),
    },
  });

  return response.data;
}

export async function fetchProblem(slug: string) {
  const response = await api.get<ProblemDetail>(`/api/problems/${slug}`);
  return response.data;
}

export async function fetchRoadmap() {
  const response = await api.get<RoadmapResponse>('/api/problems/neetcode/roadmap');
  return response.data;
}

export async function runSubmission(payload: { slug: string; language: string; code: string }) {
  const response = await api.post<SubmissionRunResult>('/api/submissions/run', payload);
  return response.data;
}

export async function submitSolution(payload: { slug: string; language: string; code: string }) {
  const response = await api.post<SubmissionRunResult>('/api/submissions', payload);
  return response.data;
}

export async function fetchSubmissionHistory(slug: string) {
  const response = await api.get<{ submissions: SubmissionHistoryEntry[] }>(
    `/api/submissions/${slug}`,
  );
  return response.data.submissions;
}

export async function loginRequest(payload: { email: string; password: string }) {
  const response = await api.post<AuthResponse>('/api/auth/login', payload);
  return response.data;
}

export async function registerRequest(payload: {
  email: string;
  username: string;
  password: string;
}) {
  const response = await api.post<AuthResponse>('/api/auth/register', payload);
  return response.data;
}

export async function fetchMe() {
  const response = await api.get<{ user: AuthUser }>('/api/auth/me');
  return response.data.user;
}

export default api;
