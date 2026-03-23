import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PROBLEMS_URL = 'https://alfa-leetcode-api.onrender.com/problems';
const DETAIL_URL = 'https://alfa-leetcode-api.onrender.com/select';
const BATCH_SIZE = 100;
const FETCH_LIMIT = 200;
const DETAIL_DELAY_MS = 500;

type ProblemListItem = {
  questionFrontendId: number | string;
  title: string;
  titleSlug: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  acRate?: number;
  isPaidOnly?: boolean;
};

type ProblemListResponse = {
  totalQuestions: number;
  problemsetQuestionList: ProblemListItem[];
};

type TopicTag = {
  name: string;
};

type CodeSnippet = {
  langSlug: string;
  code: string;
};

type ProblemDetailResponse = {
  questionId: string;
  questionFrontendId?: string | number;
  title: string;
  titleSlug: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  content: string;
  topicTags?: TopicTag[];
  exampleTestcases?: string;
  codeSnippets?: CodeSnippet[];
  isPaidOnly?: boolean;
  acRate?: number;
};

type OutputProblem = {
  id: number;
  title: string;
  slug: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  tags: string[];
  description: string;
  examples: Array<{
    input: string;
    output: string;
    explanation?: string;
  }>;
  constraints: string[];
  starterCode: {
    python: string;
    javascript: string;
    java: string;
    cpp: string;
  };
  solutionCode: Record<string, string>;
  testCases: Array<{
    input: string;
    expectedOutput: string;
  }>;
  acceptanceRate: number;
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function stripHtml(html: string): string {
  return decodeHtmlEntities(
    html
      .replace(/<\s*br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n\n')
      .replace(/<\/div>/gi, '\n')
      .replace(/<\/li>/gi, '\n')
      .replace(/<li>/gi, '• ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\r/g, '')
      .replace(/[ \t]+\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .replace(/[ \t]{2,}/g, ' ')
      .trim(),
  );
}

function extractExamples(contentHtml: string) {
  const examples: OutputProblem['examples'] = [];
  const preMatches = [...contentHtml.matchAll(/<pre>([\s\S]*?)<\/pre>/gi)];

  preMatches.forEach((match) => {
    const block = stripHtml(match[1]);
    const inputMatch = block.match(/Input:\s*([\s\S]*?)(?:\n|$)(?:Output:|$)/i);
    const outputMatch = block.match(/Output:\s*([\s\S]*?)(?:\n|$)(?:Explanation:|$)/i);
    const explanationMatch = block.match(/Explanation:\s*([\s\S]*)$/i);

    if (!inputMatch || !outputMatch) {
      return;
    }

    examples.push({
      input: inputMatch[1].trim(),
      output: outputMatch[1].trim(),
      ...(explanationMatch?.[1]?.trim() ? { explanation: explanationMatch[1].trim() } : {}),
    });
  });

  return examples;
}

function extractConstraints(contentHtml: string): string[] {
  const constraintSection = contentHtml.match(
    /<strong>\s*Constraints:\s*<\/strong>([\s\S]*?)(?:<strong>|$)/i,
  );

  if (!constraintSection) {
    return [];
  }

  const text = stripHtml(constraintSection[1]);
  return text
    .split('\n')
    .map((line) => line.replace(/^•\s*/, '').trim())
    .filter(Boolean);
}

function parseExampleTestcases(raw?: string): OutputProblem['testCases'] {
  if (!raw) {
    return [];
  }

  return raw
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((input) => ({
      input,
      expectedOutput: '',
    }));
}

function mapStarterCode(snippets?: CodeSnippet[]): OutputProblem['starterCode'] {
  const starterCode: OutputProblem['starterCode'] = {
    python: '',
    javascript: '',
    java: '',
    cpp: '',
  };

  if (!snippets) {
    return starterCode;
  }

  snippets.forEach((snippet) => {
    if (snippet.langSlug === 'python3') {
      starterCode.python = snippet.code;
    }

    if (snippet.langSlug === 'javascript') {
      starterCode.javascript = snippet.code;
    }

    if (snippet.langSlug === 'java') {
      starterCode.java = snippet.code;
    }

    if (snippet.langSlug === 'cpp') {
      starterCode.cpp = snippet.code;
    }
  });

  return starterCode;
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    headers: {
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Request failed (${response.status}) for ${url}`);
  }

  return (await response.json()) as T;
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

function toOutputProblem(listItem: ProblemListItem, detail: ProblemDetailResponse): OutputProblem {
  const examples = extractExamples(detail.content);

  return {
    id: Number(detail.questionFrontendId ?? listItem.questionFrontendId),
    title: detail.title,
    slug: detail.titleSlug,
    difficulty: detail.difficulty,
    tags: (detail.topicTags ?? []).map((tag) => tag.name),
    description: stripHtml(detail.content),
    examples,
    constraints: extractConstraints(detail.content),
    starterCode: mapStarterCode(detail.codeSnippets),
    solutionCode: {},
    testCases: parseExampleTestcases(detail.exampleTestcases),
    acceptanceRate: Number(detail.acRate ?? listItem.acRate ?? 0),
  };
}

async function collectTargetProblems(): Promise<{
  totalQuestions: number;
  selected: ProblemListItem[];
}> {
  let skip = 0;
  let totalQuestions = 0;
  const selected: ProblemListItem[] = [];

  while (selected.length < FETCH_LIMIT) {
    const batch = await fetchJson<ProblemListResponse>(
      `${PROBLEMS_URL}?limit=${BATCH_SIZE}&skip=${skip}`,
    );

    totalQuestions = batch.totalQuestions;

    const items = batch.problemsetQuestionList ?? [];

    if (items.length === 0) {
      break;
    }

    items.forEach((item) => {
      if (!item.isPaidOnly && selected.length < FETCH_LIMIT) {
        selected.push(item);
      }
    });

    skip += BATCH_SIZE;

    if (skip >= totalQuestions) {
      break;
    }
  }

  return {
    totalQuestions,
    selected,
  };
}

async function main() {
  const rootDir = path.resolve(__dirname, '..');
  const outputDir = path.join(rootDir, 'data', 'problems');
  await fs.mkdir(outputDir, { recursive: true });

  const { totalQuestions, selected } = await collectTargetProblems();
  const targetCount = Math.min(FETCH_LIMIT, selected.length);

  console.log(`Collected ${selected.length} non-paid problems from ${totalQuestions} total questions`);

  let processed = 0;

  for (const item of selected) {
    const outputPath = path.join(outputDir, `${item.titleSlug}.json`);

    if (await fileExists(outputPath)) {
      processed += 1;
      console.log(`Fetched ${processed}/${targetCount} problems (skipped existing ${item.titleSlug})`);
      continue;
    }

    const detail = await fetchJson<ProblemDetailResponse>(
      `${DETAIL_URL}?titleSlug=${encodeURIComponent(item.titleSlug)}`,
    );

    if (detail.isPaidOnly) {
      processed += 1;
      console.log(`Fetched ${processed}/${targetCount} problems (skipped paid ${item.titleSlug})`);
      await sleep(DETAIL_DELAY_MS);
      continue;
    }

    const mapped = toOutputProblem(item, detail);
    await fs.writeFile(outputPath, `${JSON.stringify(mapped, null, 2)}\n`, 'utf8');

    processed += 1;
    console.log(`Fetched ${processed}/${targetCount} problems`);

    await sleep(DETAIL_DELAY_MS);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
