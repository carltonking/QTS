import { ProgressStatus } from "@prisma/client";
import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { authMiddleware } from "../middleware/auth";
import { runCode } from "../services/judge0";
import { TestCaseSchema, parseJsonColumn } from "../lib/jsonSchema";

const router = Router();

const submissionSchema = z.object({
  slug: z.string().min(1),
  language: z.string().min(1),
  code: z.string().min(1),
});

const slugParamSchema = z
  .string()
  .min(1)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);

/**
 * @openapi
 * /api/submissions/run:
 *   post:
 *     tags: [Submissions]
 *     summary: Run code against visible test cases without saving
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [slug, language, code]
 *             properties:
 *               slug: { type: string }
 *               language: { type: string }
 *               code: { type: string }
 *     responses:
 *       200:
 *         description: Run result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       400: { description: Invalid payload }
 *       401: { description: Unauthorized }
 *       404: { description: Problem not found }
 */
router.post("/run", authMiddleware, async (request, response) => {
  const parsed = submissionSchema.safeParse(request.body);

  if (!parsed.success) {
    response.status(400).json({ error: "Invalid payload" });
    return;
  }

  const problem = await prisma.problem.findUnique({
    where: { slug: parsed.data.slug },
  });

  if (!problem) {
    response.status(404).json({ error: "Problem not found" });
    return;
  }

  const visibleTestCases = parseJsonColumn(
    problem.testCases,
    TestCaseSchema,
  ).slice(0, 3);
  const result = await runCode(
    parsed.data.code,
    parsed.data.language,
    visibleTestCases,
  );

  response.json(result);
});

/**
 * @openapi
 * /api/submissions:
 *   post:
 *     tags: [Submissions]
 *     summary: Submit code for full evaluation
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [slug, language, code]
 *             properties:
 *               slug: { type: string }
 *               language: { type: string }
 *               code: { type: string }
 *     responses:
 *       201:
 *         description: Submission created with result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       400: { description: Invalid payload }
 *       401: { description: Unauthorized }
 *       404: { description: Problem not found }
 */
router.post("/", authMiddleware, async (request, response) => {
  const parsed = submissionSchema.safeParse(request.body);

  if (!parsed.success) {
    response.status(400).json({ error: "Invalid payload" });
    return;
  }

  const problem = await prisma.problem.findUnique({
    where: { slug: parsed.data.slug },
  });

  if (!problem) {
    response.status(404).json({ error: "Problem not found" });
    return;
  }

  const testCases = parseJsonColumn(problem.testCases, TestCaseSchema);
  const result = await runCode(
    parsed.data.code,
    parsed.data.language,
    testCases,
  );

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
      status:
        result.status === "ACCEPTED"
          ? ProgressStatus.SOLVED
          : ProgressStatus.ATTEMPTED,
    },
    update: {
      status:
        result.status === "ACCEPTED"
          ? ProgressStatus.SOLVED
          : ProgressStatus.ATTEMPTED,
    },
  });

  response.status(201).json({
    submissionId: submission.id,
    ...result,
  });
});

/**
 * @openapi
 * /api/submissions/{slug}:
 *   get:
 *     tags: [Submissions]
 *     summary: Get user's submissions for a problem
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: List of submissions
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 submissions: { type: array, items: { type: object } }
 *       400: { description: Invalid slug }
 *       401: { description: Unauthorized }
 *       404: { description: Problem not found }
 */
router.get("/:slug", authMiddleware, async (request, response) => {
  const parsed = slugParamSchema.safeParse(request.params.slug);

  if (!parsed.success) {
    response.status(400).json({ error: "Invalid slug" });
    return;
  }

  const problem = await prisma.problem.findUnique({
    where: { slug: parsed.data },
    select: { id: true },
  });

  if (!problem) {
    response.status(404).json({ error: "Problem not found" });
    return;
  }

  const submissions = await prisma.submission.findMany({
    where: {
      userId: request.user!.id,
      problemId: problem.id,
    },
    orderBy: { createdAt: "desc" },
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
