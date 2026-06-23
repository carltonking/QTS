import axios from "axios";
import { STORAGE_KEYS } from "../../shared/constants";
import type {
  Difficulty,
  ProblemListItem,
  ProblemDetail,
  SubmissionHistoryEntry,
  SubmissionRunResult,
  AuthUser,
  ProblemStatus,
} from "@qts/shared";

export type {
  Difficulty,
  ProblemListItem,
  ProblemDetail,
  SubmissionHistoryEntry,
  SubmissionRunResult,
  AuthUser,
  ProblemStatus,
} from "@qts/shared";

export type ProblemsResponse = {
  problems: ProblemListItem[];
  total: number;
  page: number;
  pages: number;
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

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3001",
});

api.interceptors.request.use((config) => {
  const token = window.localStorage.getItem(STORAGE_KEYS.JWT);

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      window.localStorage.removeItem(STORAGE_KEYS.JWT);

      if (window.location.pathname !== "/login") {
        window.location.assign("/login");
      }
    }

    return Promise.reject(error);
  },
);

export async function fetchProblems(params: {
  page: number;
  limit: number;
  difficulty?: Difficulty | "ALL";
  search?: string;
  tag?: string;
}) {
  const response = await api.get<ProblemsResponse>("/api/problems", {
    params: {
      page: params.page,
      limit: params.limit,
      ...(params.difficulty && params.difficulty !== "ALL"
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
  const response = await api.get<RoadmapResponse>(
    "/api/problems/neetcode/roadmap",
  );
  return response.data;
}

export async function runSubmission(payload: {
  slug: string;
  language: string;
  code: string;
}) {
  const response = await api.post<SubmissionRunResult>(
    "/api/submissions/run",
    payload,
  );
  return response.data;
}

export async function submitSolution(payload: {
  slug: string;
  language: string;
  code: string;
}) {
  const response = await api.post<SubmissionRunResult>(
    "/api/submissions",
    payload,
  );
  return response.data;
}

export async function fetchSubmissionHistory(slug: string) {
  const response = await api.get<{ submissions: SubmissionHistoryEntry[] }>(
    `/api/submissions/${slug}`,
  );
  return response.data.submissions;
}

export async function loginRequest(payload: {
  email: string;
  password: string;
}) {
  const response = await api.post<AuthResponse>("/api/auth/login", payload);
  return response.data;
}

export async function registerRequest(payload: {
  email: string;
  username: string;
  password: string;
}) {
  const response = await api.post<AuthResponse>("/api/auth/register", payload);
  return response.data;
}

export async function fetchMe() {
  const response = await api.get<{ user: AuthUser }>("/api/auth/me");
  return response.data.user;
}

export default api;
