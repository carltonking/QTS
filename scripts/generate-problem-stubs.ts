import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

type ProblemStub = {
  id: number;
  title: string;
  slug: string;
  difficulty: string;
  tags: string[];
  description: string;
  examples: Array<{
    input: string;
    output: string;
    explanation?: string;
  }>;
  constraints: string[];
  starterCode: Record<string, string>;
  solutionCode: Record<string, string>;
  testCases: Array<{
    input: string;
    expectedOutput: string;
  }>;
};

async function main() {
  const rootDir = path.resolve(__dirname, '..');
  const definitionsPath = path.join(rootDir, 'scripts', 'problem-definitions.json');
  const outputDir = path.join(rootDir, 'data', 'problems');
  const raw = await fs.readFile(definitionsPath, 'utf8');
  const definitions = JSON.parse(raw) as ProblemStub[];

  await fs.mkdir(outputDir, { recursive: true });

  await Promise.all(
    definitions.map(async (problem) => {
      const filePath = path.join(outputDir, `${problem.slug}.json`);
      await fs.writeFile(filePath, `${JSON.stringify(problem, null, 2)}\n`, 'utf8');
    }),
  );

  console.log(`Generated ${definitions.length} problem stubs in ${outputDir}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
