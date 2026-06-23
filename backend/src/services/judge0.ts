import axios from "axios";
import type { SubmissionStatus } from "@prisma/client";

export type TestCase = {
  input: string;
  expectedOutput: string;
};

export type SubmissionResult = {
  status: SubmissionStatus;
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
    status: SubmissionStatus;
  }>;
};

export const LANGUAGE_IDS: Record<string, number> = {
  python: 71,
  javascript: 63,
  java: 62,
  cpp: 54,
  typescript: 74,
  go: 60,
};

const JUDGE0_URL = process.env.JUDGE0_URL || "http://localhost:2358";

const POLL_ATTEMPTS = 20;
const POLL_INTERVAL_MS = 500;

type Judge0BatchResponse = Array<{ token: string }>;

type Judge0Result = {
  token?: string;
  stdout?: string | null;
  stderr?: string | null;
  compile_output?: string | null;
  time?: string | null;
  memory?: number | null;
  status?: {
    id: number;
    description: string;
  };
};

function mapStatus(statusId?: number): SubmissionStatus {
  if (statusId === 3) return "ACCEPTED";
  if (statusId === 4) return "WRONG_ANSWER";
  if (statusId === 5) return "TIME_LIMIT_EXCEEDED";
  if (statusId === 6) return "COMPILE_ERROR";
  if (statusId === 11) return "RUNTIME_ERROR";
  return "PENDING";
}

function getLanguageId(language: string): number {
  const id = LANGUAGE_IDS[language];
  if (!id) throw new Error(`Unsupported language: ${language}`);
  return id;
}

async function batchSubmit(
  code: string,
  language: string,
  testCases: TestCase[],
): Promise<string[]> {
  const languageId = getLanguageId(language);

  const response = await axios.post<Judge0BatchResponse>(
    `${JUDGE0_URL}/submissions/batch?base64_encoded=false`,
    {
      submissions: testCases.map((testCase) => ({
        source_code: code,
        language_id: languageId,
        stdin: testCase.input,
      })),
    },
  );

  return response.data.map((entry) => entry.token);
}

async function pollResult(token: string): Promise<Judge0Result> {
  for (let attempt = 0; attempt < POLL_ATTEMPTS; attempt += 1) {
    const response = await axios.get<Judge0Result>(
      `${JUDGE0_URL}/submissions/${token}?base64_encoded=false`,
    );

    const result = response.data;
    const statusId = result.status?.id;

    if (statusId && statusId > 2) {
      return result;
    }

    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
  }

  throw new Error(`Judge0 polling timed out for token: ${token}`);
}

function evaluateTest(
  result: Judge0Result,
  testCase: TestCase,
): {
  passed: boolean;
  actualOutput: string;
  status: SubmissionStatus;
  errorMessage: string | null;
  runtime: number;
  memory: number;
} {
  const mappedStatus = mapStatus(result.status?.id);
  const actualOutput = (result.stdout ?? "").trim();
  const expectedOutput = testCase.expectedOutput.trim();
  const passed = mappedStatus === "ACCEPTED" && actualOutput === expectedOutput;

  return {
    passed,
    actualOutput,
    status:
      mappedStatus === "ACCEPTED" && !passed ? "WRONG_ANSWER" : mappedStatus,
    errorMessage: result.stderr ?? result.compile_output ?? null,
    runtime: Number(result.time ?? 0) * 1000,
    memory: Number(result.memory ?? 0),
  };
}

export async function runCode(
  code: string,
  language: string,
  testCases: TestCase[],
): Promise<SubmissionResult> {
  if (testCases.length === 0) {
    return {
      status: "ACCEPTED",
      runtime: null,
      memory: null,
      errorMessage: null,
      passed: 0,
      total: 0,
      percentile: null,
      testResults: [],
    };
  }

  const tokens = await batchSubmit(code, language, testCases);
  const judge0Results = await Promise.all(tokens.map(pollResult));

  const testResults: SubmissionResult["testResults"] = [];
  let totalRuntime = 0;
  let maxMemory = 0;

  for (let i = 0; i < judge0Results.length; i++) {
    const evaluation = evaluateTest(judge0Results[i], testCases[i]);
    totalRuntime += evaluation.runtime;
    maxMemory = Math.max(maxMemory, evaluation.memory);

    if (evaluation.status !== "ACCEPTED") {
      testResults.push({
        input: testCases[i].input,
        expectedOutput: testCases[i].expectedOutput,
        actualOutput: evaluation.actualOutput,
        passed: false,
        status: evaluation.status,
      });

      return {
        status: evaluation.status,
        runtime: Math.round(totalRuntime) || null,
        memory: maxMemory || null,
        errorMessage: evaluation.errorMessage,
        passed: testResults.filter((t) => t.passed).length,
        total: testCases.length,
        percentile: null,
        testResults,
      };
    }

    testResults.push({
      input: testCases[i].input,
      expectedOutput: testCases[i].expectedOutput,
      actualOutput: evaluation.actualOutput,
      passed: true,
      status: "ACCEPTED",
    });
  }

  return {
    status: "ACCEPTED",
    runtime: Math.round(totalRuntime) || null,
    memory: maxMemory || null,
    errorMessage: null,
    passed: testCases.length,
    total: testCases.length,
    percentile: null,
    testResults,
  };
}
