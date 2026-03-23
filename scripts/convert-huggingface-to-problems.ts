import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

type InputRow = {
  id: number;
  slug: string;
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  content: string;
  python?: string;
  javascript?: string;
  java?: string;
  cpp?: string;
};

type OutputProblem = {
  id: number;
  title: string;
  slug: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  tags: [];
  description: string;
  examples: [];
  constraints: [];
  starterCode: {
    python: string;
    javascript: string;
    java: string;
    cpp: string;
  };
  solutionCode: {
    python: string;
    javascript: string;
    java: string;
    cpp: string;
  };
  testCases: [];
  acceptanceRate: number;
};

function stripMarkdown(text: string): string {
  return text
    .replace(/\*\*/g, '')
    .replace(/__/g, '')
    .replace(/`/g, '')
    .replace(/\\([\[\](){}])/g, '$1')
    .replace(/\r/g, '')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function extractDescription(content: string): string {
  const exampleIndex = content.search(/\*\*Example/i);
  const description = exampleIndex >= 0 ? content.slice(0, exampleIndex) : content;
  return stripMarkdown(description);
}

function toOutputProblem(row: InputRow): OutputProblem {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    difficulty: row.difficulty,
    tags: [],
    description: extractDescription(row.content),
    examples: [],
    constraints: [],
    starterCode: {
      python: '',
      javascript: '',
      java: '',
      cpp: '',
    },
    solutionCode: {
      python: row.python ?? '',
      javascript: row.javascript ?? '',
      java: row.java ?? '',
      cpp: row.cpp ?? '',
    },
    testCases: [],
    acceptanceRate: 0,
  };
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.promises.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  const rootDir = path.resolve(__dirname, '..');
  const inputPath = path.join(rootDir, 'data', 'leetcode-train.jsonl');
  const outputDir = path.join(rootDir, 'data', 'problems');

  await fs.promises.mkdir(outputDir, { recursive: true });

  const input = fs.createReadStream(inputPath, { encoding: 'utf8' });
  const rl = readline.createInterface({
    input,
    crlfDelay: Infinity,
  });

  let processed = 0;
  let converted = 0;
  let skipped = 0;

  for await (const line of rl) {
    const trimmed = line.trim();

    if (!trimmed) {
      continue;
    }

    processed += 1;

    try {
      const row = JSON.parse(trimmed) as InputRow;
      const slug = row.slug?.trim();

      if (!slug) {
        skipped += 1;
        console.error(`Failed to parse line ${processed}: missing slug`);
        continue;
      }

      const outputPath = path.join(outputDir, `${slug}.json`);

      if (await fileExists(outputPath)) {
        skipped += 1;
      } else {
        const problem = toOutputProblem(row);
        await fs.promises.writeFile(outputPath, `${JSON.stringify(problem, null, 2)}\n`, 'utf8');
        converted += 1;
      }
    } catch (error) {
      skipped += 1;

      try {
        const partial = JSON.parse(trimmed) as Partial<InputRow>;
        console.error(`Failed to parse ${partial.slug ?? `line-${processed}`}`);
      } catch {
        console.error(`Failed to parse line-${processed}`);
      }

      if (error instanceof Error) {
        console.error(error.message);
      }
    }

    if (processed % 100 === 0) {
      console.log(`Processed ${processed} problems`);
    }
  }

  console.log(`Converted ${converted} problems`);
  console.log(`Skipped ${skipped} problems`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
