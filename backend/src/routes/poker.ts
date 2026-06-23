import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { authMiddleware } from "../middleware/auth";

const router = Router();

/**
 * @openapi
 * /api/poker/progress:
 *   get:
 *     tags: [Poker]
 *     summary: Get user's poker training progress
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Poker progress data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 progress:
 *                   type: object
 *                   properties:
 *                     rank: { type: string }
 *                     totalAttempts: { type: integer }
 *                     correctAttempts: { type: integer }
 *                     currentStreak: { type: integer }
 *                     bestStreak: { type: integer }
 *       401: { description: Unauthorized }
 */
router.get("/progress", authMiddleware, async (req, res) => {
  const progress = await prisma.pokerProgress.findUnique({
    where: { userId: req.user!.id },
  });
  res.json({
    progress: progress || {
      rank: "BRONZE",
      totalAttempts: 0,
      correctAttempts: 0,
      currentStreak: 0,
      bestStreak: 0,
    },
  });
});

const updateProgressSchema = z.object({
  rank: z.enum(["BRONZE", "SILVER", "GOLD", "PLATINUM", "DIAMOND", "ELITE"]),
  totalAttempts: z.number(),
  correctAttempts: z.number(),
  currentStreak: z.number(),
  bestStreak: z.number(),
});
/**
 * @openapi
 * /api/poker/progress:
 *   put:
 *     tags: [Poker]
 *     summary: Update user's poker training progress
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [rank, totalAttempts, correctAttempts, currentStreak, bestStreak]
 *             properties:
 *               rank: { type: string, enum: [BRONZE, SILVER, GOLD, PLATINUM, DIAMOND, ELITE] }
 *               totalAttempts: { type: integer }
 *               correctAttempts: { type: integer }
 *               currentStreak: { type: integer }
 *               bestStreak: { type: integer }
 *     responses:
 *       200:
 *         description: Progress updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       400: { description: Invalid payload }
 *       401: { description: Unauthorized }
 */
router.put("/progress", authMiddleware, async (req, res) => {
  const parsed = updateProgressSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid payload" });
    return;
  }

  const progress = await prisma.pokerProgress.upsert({
    where: { userId: req.user!.id },
    create: { userId: req.user!.id, ...parsed.data },
    update: parsed.data,
  });

  res.json({ progress });
});

export default router;
