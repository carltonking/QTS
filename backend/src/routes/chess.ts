import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { authMiddleware } from "../middleware/auth";

const router = Router();

/**
 * @openapi
 * /api/chess/rating:
 *   get:
 *     tags: [Chess]
 *     summary: Get user's chess puzzle rating
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Chess rating data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 rating:
 *                   type: object
 *                   properties:
 *                     rating: { type: number }
 *                     ratingDeviation: { type: number }
 *                     volatility: { type: number }
 *                     puzzlesSolved: { type: integer }
 *       401: { description: Unauthorized }
 */
router.get("/rating", authMiddleware, async (req, res) => {
  const rating = await prisma.chessRating.findUnique({
    where: { userId: req.user!.id },
  });
  res.json({
    rating: rating || {
      rating: 1500,
      ratingDeviation: 350,
      volatility: 0.06,
      puzzlesSolved: 0,
    },
  });
});

const updateRatingSchema = z.object({
  rating: z.number(),
  ratingDeviation: z.number(),
  volatility: z.number(),
  puzzlesSolved: z.number(),
});
/**
 * @openapi
 * /api/chess/rating:
 *   put:
 *     tags: [Chess]
 *     summary: Update user's chess puzzle rating
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [rating, ratingDeviation, volatility, puzzlesSolved]
 *             properties:
 *               rating: { type: number }
 *               ratingDeviation: { type: number }
 *               volatility: { type: number }
 *               puzzlesSolved: { type: integer }
 *     responses:
 *       200:
 *         description: Rating updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       400: { description: Invalid payload }
 *       401: { description: Unauthorized }
 */
router.put("/rating", authMiddleware, async (req, res) => {
  const parsed = updateRatingSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid payload" });
    return;
  }

  const rating = await prisma.chessRating.upsert({
    where: { userId: req.user!.id },
    create: { userId: req.user!.id, ...parsed.data },
    update: parsed.data,
  });

  res.json({ rating });
});

const attemptSchema = z.object({
  puzzleId: z.string(),
  solved: z.boolean(),
  ratingDelta: z.number(),
});
/**
 * @openapi
 * /api/chess/attempts:
 *   post:
 *     tags: [Chess]
 *     summary: Record a chess puzzle attempt
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [puzzleId, solved, ratingDelta]
 *             properties:
 *               puzzleId: { type: string }
 *               solved: { type: boolean }
 *               ratingDelta: { type: number }
 *     responses:
 *       201:
 *         description: Attempt recorded
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       400: { description: Invalid payload }
 *       401: { description: Unauthorized }
 */
router.post("/attempts", authMiddleware, async (req, res) => {
  const parsed = attemptSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid payload" });
    return;
  }

  const attempt = await prisma.chessPuzzleAttempt.create({
    data: { userId: req.user!.id, ...parsed.data },
  });

  res.status(201).json({ attempt });
});

/**
 * @openapi
 * /api/chess/attempts:
 *   get:
 *     tags: [Chess]
 *     summary: Get user's recent chess puzzle attempts
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Recent attempts
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 attempts: { type: array, items: { type: object } }
 *       401: { description: Unauthorized }
 */
router.get("/attempts", authMiddleware, async (req, res) => {
  const attempts = await prisma.chessPuzzleAttempt.findMany({
    where: { userId: req.user!.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  res.json({ attempts });
});

export default router;
