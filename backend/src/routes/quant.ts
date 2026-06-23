import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { authMiddleware } from "../middleware/auth";

const router = Router();

router.get("/ratings", authMiddleware, async (req, res) => {
  const ratings = await prisma.quantRating.findMany({
    where: { userId: req.user!.id },
  });
  res.json({ ratings });
});

const upsertRatingSchema = z.object({
  category: z.enum(["MATH", "PROBABILITY", "FINANCE"]),
  rating: z.number(),
});
router.put("/ratings", authMiddleware, async (req, res) => {
  const parsed = upsertRatingSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid payload" });
    return;
  }

  const rating = await prisma.quantRating.upsert({
    where: {
      userId_category: { userId: req.user!.id, category: parsed.data.category },
    },
    create: { userId: req.user!.id, ...parsed.data },
    update: { rating: parsed.data.rating },
  });

  res.json({ rating });
});

export default router;
