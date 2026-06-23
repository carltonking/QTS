import { Prisma } from "@prisma/client";
import { Router } from "express";
import { z } from "zod";
import { extractUserFromAuthHeader } from "../middleware/auth";
import { prisma } from "../lib/prisma";

const router = Router();

const difficultyEnum = z.enum(["EASY", "MEDIUM", "HARD"]).optional();
const listQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(50),
  difficulty: difficultyEnum,
  tag: z.string().optional(),
  search: z.string().optional(),
});

/**
 * @openapi
 * /api/problems:
 *   get:
 *     tags: [Problems]
 *     summary: List problems with optional filters
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 50 }
 *       - in: query
 *         name: difficulty
 *         schema: { type: string, enum: [EASY, MEDIUM, HARD] }
 *       - in: query
 *         name: tag
 *         schema: { type: string }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Paginated problem list
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 problems: { type: array, items: { type: object } }
 *                 total: { type: integer }
 *                 page: { type: integer }
 *                 pages: { type: integer }
 *       400: { description: Invalid query parameters }
 */
router.get("/", async (request, response) => {
  const parsed = listQuerySchema.safeParse(request.query);

  if (!parsed.success) {
    response
      .status(400)
      .json({
        error: "Invalid query parameters",
        details: parsed.error.flatten(),
      });
    return;
  }

  const { page, limit, difficulty, tag, search } = parsed.data;

  const where: Prisma.ProblemWhereInput = {
    ...(difficulty ? { difficulty } : {}),
    ...(tag ? { tags: { has: tag } } : {}),
    ...(search
      ? {
          OR: [
            { title: { contains: search, mode: "insensitive" as const } },
            { slug: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [total, problems] = await Promise.all([
    prisma.problem.count({ where }),
    prisma.problem.findMany({
      where,
      orderBy: [
        { neetcodeCategory: "asc" },
        { neetcodeOrder: "asc" },
        { id: "asc" },
      ],
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        slug: true,
        title: true,
        difficulty: true,
        tags: true,
        acceptanceRate: true,
        neetcodeCategory: true,
      },
    }),
  ]);

  let progressByProblemId = new Map<number, string>();
  const user = extractUserFromAuthHeader(request);

  if (user) {
    const progress = await prisma.userProgress.findMany({
      where: {
        userId: user.id,
        problemId: { in: problems.map((problem) => problem.id) },
      },
    });

    progressByProblemId = new Map(
      progress.map((entry) => [entry.problemId, entry.status]),
    );
  }

  response.json({
    problems: problems.map((problem) => ({
      ...problem,
      status: progressByProblemId.get(problem.id),
    })),
    total,
    page,
    pages: Math.ceil(total / limit),
  });
});

/**
 * @openapi
 * /api/problems/neetcode/roadmap:
 *   get:
 *     tags: [Problems]
 *     summary: Get problems grouped by NeetCode category
 *     responses:
 *       200:
 *         description: Roadmap grouped by category
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 roadmap: { type: object }
 */
router.get("/neetcode/roadmap", async (request, response) => {
  const user = extractUserFromAuthHeader(request);
  const problems = await prisma.problem.findMany({
    orderBy: [
      { neetcodeCategory: "asc" },
      { neetcodeOrder: "asc" },
      { id: "asc" },
    ],
    select: {
      id: true,
      slug: true,
      title: true,
      difficulty: true,
      tags: true,
      acceptanceRate: true,
      neetcodeCategory: true,
      neetcodeOrder: true,
    },
  });

  let progressByProblemId = new Map<number, string>();

  if (user) {
    const progress = await prisma.userProgress.findMany({
      where: { userId: user.id },
    });
    progressByProblemId = new Map(
      progress.map((entry) => [entry.problemId, entry.status]),
    );
  }

  const grouped = problems.reduce<
    Record<string, Array<Record<string, unknown>>>
  >((accumulator, problem) => {
    const category = problem.neetcodeCategory ?? "Uncategorized";

    if (!accumulator[category]) {
      accumulator[category] = [];
    }

    accumulator[category].push({
      ...problem,
      status: progressByProblemId.get(problem.id),
    });

    return accumulator;
  }, {});

  response.json({ roadmap: grouped });
});

const slugSchema = z
  .string()
  .min(1)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);

/**
 * @openapi
 * /api/problems/{slug}:
 *   get:
 *     tags: [Problems]
 *     summary: Get problem by slug
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Problem details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id: { type: integer }
 *                 slug: { type: string }
 *                 title: { type: string }
 *                 difficulty: { type: string }
 *                 description: { type: string }
 *       400: { description: Invalid slug }
 *       404: { description: Problem not found }
 */
router.get("/:slug", async (request, response) => {
  const parsed = slugSchema.safeParse(request.params.slug);

  if (!parsed.success) {
    response.status(400).json({ error: "Invalid slug" });
    return;
  }

  const user = extractUserFromAuthHeader(request);
  const problem = await prisma.problem.findUnique({
    where: { slug: parsed.data },
    select: {
      id: true,
      slug: true,
      title: true,
      difficulty: true,
      description: true,
      examples: true,
      constraints: true,
      tags: true,
      starterCode: true,
      solutionCode: true,
      acceptanceRate: true,
      neetcodeCategory: true,
      neetcodeOrder: true,
    },
  });

  if (!problem) {
    response.status(404).json({ error: "Problem not found" });
    return;
  }

  const progress =
    user &&
    (await prisma.userProgress.findUnique({
      where: {
        userId_problemId: {
          userId: user.id,
          problemId: problem.id,
        },
      },
    }));

  response.json({
    ...problem,
    status: progress?.status,
  });
});

export default router;
