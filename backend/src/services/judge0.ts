import axios from 'axios';
import type { SubmissionStatus } from '@prisma/client';

export type TestCase = {
  input: string;
  expectedOutput: string;
};

export type Judge0Result = {
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

const JUDGE0_URL = process.env.JUDGE0_URL || 'http://localhost:2358';

function mapStatus(statusId?: number): SubmissionStatus {
  if (statusId === 3) return 'ACCEPTED';
  if (statusId === 4) return 'WRONG_ANSWER';
  if (statusId === 5) return 'TIME_LIMIT_EXCEEDED';
  if (statusId === 6) return 'COMPILE_ERROR';
  if (statusId === 11) return 'RUNTIME_ERROR';
  return 'PENDING';
}

export async function submitToJudge0(
  code: string,
  language: string,
  stdin: string,
): Promise<Judge0Result> {
  const languageId = LANGUAGE_IDS[language];

  if (!languageId) {
    throw new Error(`Unsupported language: ${language}`);
  }

  const response = await axios.post<Judge0Result>(`${JUDGE0_URL}/submissions?base64_encoded=false&wait=false`, {
    source_code: code,
    language_id: languageId,
    stdin,
  });

  return response.data;
}

export async function pollResult(token: string): Promise<Judge0Result> {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const response = await axios.get<Judge0Result>(
      `${JUDGE0_URL}/submissions/${token}?base64_encoded=false`,
    );

    const result = response.data;
    const statusId = result.status?.id;

    if (statusId && statusId > 2) {
      return result;
    }

    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  throw new Error('Judge0 polling timed out');
}

export async function runCode(
  code: string,
  language: string,
  testCases: TestCase[],
): Promise<SubmissionResult> {
  const testResults: SubmissionResult['testResults'] = [];
  let totalRuntime = 0;
  let maxMemory = 0;

  for (const testCase of testCases) {
    const submission = await submitToJudge0(code, language, testCase.input);
    const result = await pollResult(submission.token ?? '');
    const mappedStatus = mapStatus(result.status?.id);
    const actualOutput = (result.stdout ?? '').trim();
    const expectedOutput = testCase.expectedOutput.trim();
    const passed = mappedStatus === 'ACCEPTED' && actualOutput === expectedOutput;
    totalRuntime += Number(result.time ?? 0) * 1000;
    maxMemory = Math.max(maxMemory, Number(result.memory ?? 0));

    if (!passed && mappedStatus === 'ACCEPTED') {
      testResults.push({
        input: testCase.input,
        expectedOutput: testCase.expectedOutput,
        actualOutput,
        passed: false,
        status: 'WRONG_ANSWER',
      });

      return {
        status: 'WRONG_ANSWER',
        runtime: Math.round(totalRuntime),
        memory: maxMemory || null,
        errorMessage: null,
        passed: testResults.filter((entry) => entry.passed).length,
        total: testCases.length,
        percentile: null,
        testResults,
      };
    }

    testResults.push({
      input: testCase.input,
      expectedOutput: testCase.expectedOutput,
      actualOutput,
      passed,
      status: passed ? 'ACCEPTED' : mappedStatus,
    });

    if (mappedStatus !== 'ACCEPTED') {
      return {
        status: mappedStatus,
        runtime: Math.round(totalRuntime) || null,
        memory: maxMemory || null,
        errorMessage:
          result.stderr ?? result.compile_output ?? result.status?.description ?? 'Execution failed',
        passed: testResults.filter((entry) => entry.passed).length,
        total: testCases.length,
        percentile: null,
        testResults,
      };
    }
  }

  return {
    status: 'ACCEPTED',
    runtime: Math.round(totalRuntime) || null,
    memory: maxMemory || null,
    errorMessage: null,
    passed: testCases.length,
    total: testCases.length,
    percentile: Math.floor(Math.random() * 39) + 60,
    testResults,
  };
}
