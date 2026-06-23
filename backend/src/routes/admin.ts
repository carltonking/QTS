import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { authMiddleware } from "../middleware/auth";
import { adminMiddleware } from "../middleware/admin";

const router = Router();

router.use(authMiddleware, adminMiddleware);

const listUsersQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(50),
});

/**
 * @openapi
 * /api/admin/users:
 *   get:
 *     tags: [Admin]
 *     summary: List all users (admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 50 }
 *     responses:
 *       200:
 *         description: Paginated user list
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 users: { type: array, items: { type: object } }
 *                 total: { type: integer }
 *                 page: { type: integer }
 *                 pages: { type: integer }
 *       400: { description: Invalid query parameters }
 *       401: { description: Unauthorized }
 *       403: { description: Forbidden }
 */
router.get("/users", async (req, res) => {
  const parsed = listUsersQuerySchema.safeParse(req.query);

  if (!parsed.success) {
    res
      .status(400)
      .json({
        error: "Invalid query parameters",
        details: parsed.error.flatten(),
      });
    return;
  }

  const { page, limit } = parsed.data;

  const [total, users] = await Promise.all([
    prisma.user.count(),
    prisma.user.findMany({
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  res.json({ users, total, page, pages: Math.ceil(total / limit) });
});

const updateRoleSchema = z.object({
  userId: z.string(),
  role: z.enum(["USER", "ADMIN"]),
});
/**
 * @openapi
 * /api/admin/users/role:
 *   put:
 *     tags: [Admin]
 *     summary: Update a user's role (admin only)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [userId, role]
 *             properties:
 *               userId: { type: string }
 *               role: { type: string, enum: [USER, ADMIN] }
 *     responses:
 *       200:
 *         description: User role updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       400: { description: Invalid payload }
 *       401: { description: Unauthorized }
 *       403: { description: Forbidden }
 */
router.put("/users/role", async (req, res) => {
  const parsed = updateRoleSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid payload" });
    return;
  }

  const user = await prisma.user.update({
    where: { id: parsed.data.userId },
    data: { role: parsed.data.role },
    select: { id: true, email: true, username: true, role: true },
  });

  res.json({ user });
});

/**
 * @openapi
 * /api/admin/stats:
 *   get:
 *     tags: [Admin]
 *     summary: Get platform statistics (admin only)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Platform stats
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 stats:
 *                   type: object
 *                   properties:
 *                     users: { type: integer }
 *                     problems: { type: integer }
 *                     submissions: { type: integer }
 *                     chessPlayers: { type: integer }
 *                     mathSessions: { type: integer }
 *                     pokerPlayers: { type: integer }
 *                     quantPlayers: { type: integer }
 *       401: { description: Unauthorized }
 *       403: { description: Forbidden }
 */
router.get("/stats", async (_req, res) => {
  const [
    userCount,
    problemCount,
    submissionCount,
    chessCount,
    mathCount,
    pokerCount,
    quantCount,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.problem.count(),
    prisma.submission.count(),
    prisma.chessRating.count(),
    prisma.mathSession.count(),
    prisma.pokerProgress.count(),
    prisma.quantRating.count(),
  ]);

  res.json({
    stats: {
      users: userCount,
      problems: problemCount,
      submissions: submissionCount,
      chessPlayers: chessCount,
      mathSessions: mathCount,
      pokerPlayers: pokerCount,
      quantPlayers: quantCount,
    },
  });
});

const problemSchema = z.object({
  slug: z.string(),
  title: z.string(),
  difficulty: z.enum(["EASY", "MEDIUM", "HARD"]),
  description: z.string(),
  examples: z.array(z.record(z.any())).default([]),
  constraints: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
  starterCode: z.record(z.string()).default({}),
  solutionCode: z.record(z.string()).default({}),
  testCases: z.array(z.record(z.any())).default([]),
  acceptanceRate: z.number().default(0),
  neetcodeCategory: z.string().nullable().optional(),
  neetcodeOrder: z.number().nullable().optional(),
});

/**
 * @openapi
 * /api/admin/problems:
 *   post:
 *     tags: [Admin]
 *     summary: Create a new problem (admin only)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [slug, title, difficulty, description]
 *             properties:
 *               slug: { type: string }
 *               title: { type: string }
 *               difficulty: { type: string, enum: [EASY, MEDIUM, HARD] }
 *               description: { type: string }
 *               examples: { type: array, items: { type: object } }
 *               constraints: { type: array, items: { type: string } }
 *               tags: { type: array, items: { type: string } }
 *               starterCode: { type: object }
 *               solutionCode: { type: object }
 *               testCases: { type: array, items: { type: object } }
 *               acceptanceRate: { type: number }
 *     responses:
 *       201:
 *         description: Problem created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       400: { description: Invalid payload }
 *       401: { description: Unauthorized }
 *       403: { description: Forbidden }
 */
router.post("/problems", async (req, res) => {
  const parsed = problemSchema.safeParse(req.body);
  if (!parsed.success) {
    res
      .status(400)
      .json({ error: "Invalid payload", details: parsed.error.flatten() });
    return;
  }

  const problem = await prisma.problem.create({ data: parsed.data });
  res.status(201).json({ problem });
});

/**
 * @openapi
 * /api/admin/problems/{slug}:
 *   put:
 *     tags: [Admin]
 *     summary: Update a problem (admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Problem updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       400: { description: Invalid payload }
 *       401: { description: Unauthorized }
 *       403: { description: Forbidden }
 *   delete:
 *     tags: [Admin]
 *     summary: Delete a problem (admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       204: { description: Problem deleted }
 *       401: { description: Unauthorized }
 *       403: { description: Forbidden }
 */
router.put("/problems/:slug", async (req, res) => {
  const parsed = problemSchema.partial().safeParse(req.body);
  if (!parsed.success) {
    res
      .status(400)
      .json({ error: "Invalid payload", details: parsed.error.flatten() });
    return;
  }

  const problem = await prisma.problem.update({
    where: { slug: req.params.slug },
    data: parsed.data,
  });
  res.json({ problem });
});

router.delete("/problems/:slug", async (req, res) => {
  await prisma.problem.delete({ where: { slug: req.params.slug } });
  res.status(204).send();
});

export default router;
