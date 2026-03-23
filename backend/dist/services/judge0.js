"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LANGUAGE_IDS = void 0;
exports.submitToJudge0 = submitToJudge0;
exports.pollResult = pollResult;
exports.runCode = runCode;
const axios_1 = __importDefault(require("axios"));
exports.LANGUAGE_IDS = {
    python: 71,
    javascript: 63,
    java: 62,
    cpp: 54,
    typescript: 74,
    go: 60,
};
const JUDGE0_URL = process.env.JUDGE0_URL || 'http://localhost:2358';
function mapStatus(statusId) {
    if (statusId === 3)
        return 'ACCEPTED';
    if (statusId === 4)
        return 'WRONG_ANSWER';
    if (statusId === 5)
        return 'TIME_LIMIT_EXCEEDED';
    if (statusId === 6)
        return 'COMPILE_ERROR';
    if (statusId === 11)
        return 'RUNTIME_ERROR';
    return 'PENDING';
}
async function submitToJudge0(code, language, stdin) {
    const languageId = exports.LANGUAGE_IDS[language];
    if (!languageId) {
        throw new Error(`Unsupported language: ${language}`);
    }
    const response = await axios_1.default.post(`${JUDGE0_URL}/submissions?base64_encoded=false&wait=false`, {
        source_code: code,
        language_id: languageId,
        stdin,
    });
    return response.data;
}
async function pollResult(token) {
    for (let attempt = 0; attempt < 20; attempt += 1) {
        const response = await axios_1.default.get(`${JUDGE0_URL}/submissions/${token}?base64_encoded=false`);
        const result = response.data;
        const statusId = result.status?.id;
        if (statusId && statusId > 2) {
            return result;
        }
        await new Promise((resolve) => setTimeout(resolve, 500));
    }
    throw new Error('Judge0 polling timed out');
}
async function runCode(code, language, testCases) {
    const testResults = [];
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
                errorMessage: result.stderr ?? result.compile_output ?? result.status?.description ?? 'Execution failed',
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
