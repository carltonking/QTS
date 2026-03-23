import { ProgressStatus } from '@prisma/client';
import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authMiddleware } from '../middleware/auth';
import { runCode } from '../services/judge0';

const router = Router();

const submissionSchema = z.object({
  slug: z.string().min(1),
  language: z.string().min(1),
  code: z.string().min(1),
});

router.post('/run', authMiddleware, async (request, response) => {
  const parsed = submissionSchema.safeParse(request.body);

  if (!parsed.success) {
    response.status(400).json({ error: 'Invalid payload' });
    return;
  }

  const problem = await prisma.problem.findUnique({
    where: { slug: parsed.data.slug },
  });

  if (!problem) {
    response.status(404).json({ error: 'Problem not found' });
    return;
  }

  const visibleTestCases = (problem.testCases as Array<{ input: string; expectedOutput: string }>).slice(0, 3);
  const result = await runCode(parsed.data.code, parsed.data.language, visibleTestCases);

  response.json(result);
});

router.post('/', authMiddleware, async (request, response) => {
  const parsed = submissionSchema.safeParse(request.body);

  if (!parsed.success) {
    response.status(400).json({ error: 'Invalid payload' });
    return;
  }

  const problem = await prisma.problem.findUnique({
    where: { slug: parsed.data.slug },
  });

  if (!problem) {
    response.status(404).json({ error: 'Problem not found' });
    return;
  }

  const testCases = problem.testCases as Array<{ input: string; expectedOutput: string }>;
  const result = await runCode(parsed.data.code, parsed.data.language, testCases);

  const submission = await prisma.submission.create({
    data: {
      userId: request.user!.id,
      problemId: problem.id,
      code: parsed.data.code,
      language: parsed.data.language,
      status: result.status,
      runtime: result.runtime,
      memory: result.memory,
      errorMessage: result.errorMessage,
    },
  });

  await prisma.userProgress.upsert({
    where: {
      userId_problemId: {
        userId: request.user!.id,
        problemId: problem.id,
      },
    },
    create: {
      userId: request.user!.id,
      problemId: problem.id,
      status: result.status === 'ACCEPTED' ? ProgressStatus.SOLVED : ProgressStatus.ATTEMPTED,
    },
    update: {
      status: result.status === 'ACCEPTED' ? ProgressStatus.SOLVED : ProgressStatus.ATTEMPTED,
    },
  });

  response.status(201).json({
    submissionId: submission.id,
    ...result,
  });
});

router.get('/:slug', authMiddleware, async (request, response) => {
  const problem = await prisma.problem.findUnique({
    where: { slug: request.params.slug as string },
    select: { id: true },
  });

  if (!problem) {
    response.status(404).json({ error: 'Problem not found' });
    return;
  }

  const submissions = await prisma.submission.findMany({
    where: {
      userId: request.user!.id,
      problemId: problem.id,
    },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      language: true,
      status: true,
      runtime: true,
      memory: true,
      errorMessage: true,
      createdAt: true,
    },
  });

  response.json({ submissions });
});

export default router;
